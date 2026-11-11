import { parseIceCandidate } from "@/utils/candidate.utils";

export interface ProFirewallPolicy {
  blockHost: boolean;
  blockSrflx: boolean;
  blockRelay: boolean;
}

export interface InterceptedCandidate {
  id: string;
  timestamp: string;
  from: "A" | "B";
  type: "host" | "srflx" | "relay" | "unknown";
  protocol: string;
  address: string;
  port: number;
  status: "ADMITTED" | "BLOCKED";
  reason: string;
  raw: string;
}

export interface ProLiveStats {
  stateA: RTCPeerConnectionState;
  stateB: RTCPeerConnectionState;
  iceStateA: RTCIceConnectionState;
  iceStateB: RTCIceConnectionState;
  signalingStateA: RTCSignalingState;
  nominatedPair?: {
    localCandidate: string;
    remoteCandidate: string;
    localType: string;
    remoteType: string;
  };
  rttMs: number;
  currentBitrateKbps: number;
  bytesSent: number;
  bytesReceived: number;
  packetsSent: number;
  packetsReceived: number;
  packetsLost: number;
  videoFps?: number;
  videoWidth?: number;
  videoHeight?: number;
}

export class ProLiveService {
  public peerA: RTCPeerConnection | null = null;
  public peerB: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public dcA: RTCDataChannel | null = null;
  public dcB: RTCDataChannel | null = null;

  public policy: ProFirewallPolicy = {
    blockHost: false,
    blockSrflx: false,
    blockRelay: false,
  };

  private pollIntervalId: number | null = null;
  private prevBytesSent = 0;
  private prevTimestamp = 0;

  // Callbacks
  public onCandidateIntercepted?: (candidate: InterceptedCandidate) => void;
  public onStatsUpdated?: (stats: ProLiveStats) => void;
  public onRemoteStream?: (stream: MediaStream) => void;
  public onLocalStream?: (stream: MediaStream) => void;
  public onConnectionStateChange?: (stateA: RTCPeerConnectionState, stateB: RTCPeerConnectionState) => void;

  public updatePolicy(newPolicy: ProFirewallPolicy) {
    this.policy = { ...newPolicy };
  }

  public async start(stream?: MediaStream) {
    this.stop();

    if (stream) {
      this.localStream = stream;
      this.onLocalStream?.(stream);
    }

    const config: RTCConfiguration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      iceCandidatePoolSize: 2,
    };

    this.peerA = new RTCPeerConnection(config);
    this.peerB = new RTCPeerConnection(config);

    // Attach local stream tracks to Peer A
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.peerA && this.localStream) {
          this.peerA.addTrack(track, this.localStream);
        }
      });
    }

    // Attach data channel to Peer A (ensures m-section even if no media)
    this.dcA = this.peerA.createDataChannel("pro-data-channel");
    this.peerB.ondatachannel = (e) => {
      this.dcB = e.channel;
    };

    // Listen for incoming remote tracks on Peer B
    this.peerB.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        this.remoteStream = e.streams[0];
        this.onRemoteStream?.(e.streams[0]);
      } else {
        const fallbackStream = new MediaStream([e.track]);
        this.remoteStream = fallbackStream;
        this.onRemoteStream?.(fallbackStream);
      }
    };

    // State listeners
    const notifyState = () => {
      if (this.peerA && this.peerB) {
        this.onConnectionStateChange?.(this.peerA.connectionState, this.peerB.connectionState);
      }
    };

    this.peerA.onconnectionstatechange = notifyState;
    this.peerB.onconnectionstatechange = notifyState;

    // Buffer for Peer B candidates arriving before setRemoteDescription
    const bufferedForB: RTCIceCandidateInit[] = [];
    const bufferedForA: RTCIceCandidateInit[] = [];

    // Peer A Candidate Filter Interceptor
    this.peerA.onicecandidate = async (e) => {
      if (!e.candidate) return;
      const parsed = parseIceCandidate(e.candidate.candidate);
      const isBlocked = this.evaluateFilter(parsed.type);

      const intercepted: InterceptedCandidate = {
        id: `cand-a-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        from: "A",
        type: (parsed.type as InterceptedCandidate["type"]) || "unknown",
        protocol: parsed.protocol || "udp",
        address: parsed.address || "unknown",
        port: parsed.port || 0,
        status: isBlocked ? "BLOCKED" : "ADMITTED",
        reason: isBlocked
          ? `Policy Block: typ ${parsed.type} filtered out by live firewall rule`
          : "Permitted by firewall policy; forwarded to Peer B",
        raw: e.candidate.candidate,
      };

      this.onCandidateIntercepted?.(intercepted);

      if (!isBlocked && this.peerB) {
        if (!this.peerB.currentRemoteDescription) {
          bufferedForB.push(e.candidate.toJSON());
        } else {
          try {
            await this.peerB.addIceCandidate(e.candidate);
          } catch (err) {
            console.warn("Peer B addIceCandidate error:", err);
          }
        }
      }
    };

    // Peer B Candidate Filter Interceptor
    this.peerB.onicecandidate = async (e) => {
      if (!e.candidate) return;
      const parsed = parseIceCandidate(e.candidate.candidate);
      const isBlocked = this.evaluateFilter(parsed.type);

      const intercepted: InterceptedCandidate = {
        id: `cand-b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        from: "B",
        type: (parsed.type as InterceptedCandidate["type"]) || "unknown",
        protocol: parsed.protocol || "udp",
        address: parsed.address || "unknown",
        port: parsed.port || 0,
        status: isBlocked ? "BLOCKED" : "ADMITTED",
        reason: isBlocked
          ? `Policy Block: typ ${parsed.type} filtered out by live firewall rule`
          : "Permitted by firewall policy; forwarded to Peer A",
        raw: e.candidate.candidate,
      };

      this.onCandidateIntercepted?.(intercepted);

      if (!isBlocked && this.peerA) {
        if (!this.peerA.currentRemoteDescription) {
          bufferedForA.push(e.candidate.toJSON());
        } else {
          try {
            await this.peerA.addIceCandidate(e.candidate);
          } catch (err) {
            console.warn("Peer A addIceCandidate error:", err);
          }
        }
      }
    };

    // 1. Peer A creates Offer
    const offer = await this.peerA.createOffer();
    await this.peerA.setLocalDescription(offer);

    // 2. Peer B sets Remote Offer
    await this.peerB.setRemoteDescription(offer);

    // Flush any buffered candidates for B
    for (const cand of bufferedForB) {
      try {
        await this.peerB.addIceCandidate(cand);
      } catch (err) {
        console.warn("Flush candidate for B error:", err);
      }
    }
    bufferedForB.length = 0;

    // 3. Peer B creates Answer
    const answer = await this.peerB.createAnswer();
    await this.peerB.setLocalDescription(answer);

    // 4. Peer A sets Remote Answer
    await this.peerA.setRemoteDescription(answer);

    // Flush any buffered candidates for A
    for (const cand of bufferedForA) {
      try {
        await this.peerA.addIceCandidate(cand);
      } catch (err) {
        console.warn("Flush candidate for A error:", err);
      }
    }
    bufferedForA.length = 0;

    // Start Real Stats Polling
    this.startStatsPolling();
  }

  private evaluateFilter(type: string): boolean {
    if (type === "host" && this.policy.blockHost) return true;
    if (type === "srflx" && this.policy.blockSrflx) return true;
    if (type === "relay" && this.policy.blockRelay) return true;
    return false;
  }

  private startStatsPolling() {
    if (this.pollIntervalId) {
      window.clearInterval(this.pollIntervalId);
    }

    this.prevBytesSent = 0;
    this.prevTimestamp = performance.now();

    this.pollIntervalId = window.setInterval(async () => {
      await this.pollStats();
    }, 750);
  }

  public async pollStats() {
    if (!this.peerA || !this.peerB) return;

    try {
      const statsA = await this.peerA.getStats();
      let rttMs = 0;
      let bytesSent = 0;
      let bytesReceived = 0;
      let packetsSent = 0;
      let packetsReceived = 0;
      let packetsLost = 0;
      let videoFps: number | undefined;
      let videoWidth: number | undefined;
      let videoHeight: number | undefined;
      let nominatedPair: ProLiveStats["nominatedPair"] = undefined;

      const now = performance.now();
      const timeDiffSec = (now - this.prevTimestamp) / 1000;

      // Candidate pairs check
      statsA.forEach((report) => {
        if (report.type === "candidate-pair" && (report.nominated || report.state === "succeeded")) {
          if (report.currentRoundTripTime !== undefined) {
            rttMs = Math.round(report.currentRoundTripTime * 1000);
          }

          // Lookup local & remote candidates
          const localCand = statsA.get(report.localCandidateId);
          const remoteCand = statsA.get(report.remoteCandidateId);

          if (localCand && remoteCand) {
            nominatedPair = {
              localCandidate: `${localCand.ip || localCand.address}:${localCand.port} (${localCand.candidateType})`,
              remoteCandidate: `${remoteCand.ip || remoteCand.address}:${remoteCand.port} (${remoteCand.candidateType})`,
              localType: localCand.candidateType || "unknown",
              remoteType: remoteCand.candidateType || "unknown",
            };
          }
        }

        if (report.type === "outbound-rtp") {
          bytesSent += report.bytesSent || 0;
          packetsSent += report.packetsSent || 0;
          if (report.framesPerSecond !== undefined) {
            videoFps = report.framesPerSecond;
          }
          if (report.frameWidth !== undefined) {
            videoWidth = report.frameWidth;
          }
          if (report.frameHeight !== undefined) {
            videoHeight = report.frameHeight;
          }
        }

        if (report.type === "inbound-rtp") {
          bytesReceived += report.bytesReceived || 0;
          packetsReceived += report.packetsReceived || 0;
          packetsLost += report.packetsLost || 0;
        }
      });

      // Compute bitrate in kbps
      let currentBitrateKbps = 0;
      if (this.prevBytesSent > 0 && timeDiffSec > 0) {
        currentBitrateKbps = Math.round(((bytesSent - this.prevBytesSent) * 8) / (timeDiffSec * 1000));
      }
      this.prevBytesSent = bytesSent;
      this.prevTimestamp = now;

      const liveStats: ProLiveStats = {
        stateA: this.peerA.connectionState,
        stateB: this.peerB.connectionState,
        iceStateA: this.peerA.iceConnectionState,
        iceStateB: this.peerB.iceConnectionState,
        signalingStateA: this.peerA.signalingState,
        nominatedPair,
        rttMs,
        currentBitrateKbps: Math.max(0, currentBitrateKbps),
        bytesSent,
        bytesReceived,
        packetsSent,
        packetsReceived,
        packetsLost,
        videoFps,
        videoWidth,
        videoHeight,
      };

      this.onStatsUpdated?.(liveStats);
    } catch {
      // ignore
    }
  }

  public stop() {
    if (this.pollIntervalId) {
      window.clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }

    if (this.dcA) {
      this.dcA.close();
      this.dcA = null;
    }
    if (this.dcB) {
      this.dcB.close();
      this.dcB = null;
    }

    if (this.peerA) {
      this.peerA.close();
      this.peerA = null;
    }
    if (this.peerB) {
      this.peerB.close();
      this.peerB = null;
    }

    this.remoteStream = null;
  }
}

export const proLiveService = new ProLiveService();
