import { useLabStore, type MailboxMessage } from "@/store/labStore";
import { parseIceCandidate } from "@/utils/candidate.utils";

export type PeerConnectionFactory = (config?: RTCConfiguration) => RTCPeerConnection;

const defaultFactory: PeerConnectionFactory = (config) => {
  if (typeof window !== "undefined" && window.RTCPeerConnection) {
    return new window.RTCPeerConnection(config);
  }
  throw new Error("RTCPeerConnection is not available in the current environment");
};

export class LoopbackService {
  private factory: PeerConnectionFactory;
  public peerA: RTCPeerConnection | null = null;
  public peerB: RTCPeerConnection | null = null;
  public dcA: RTCDataChannel | null = null;
  public dcB: RTCDataChannel | null = null;

  private bufferA: RTCIceCandidateInit[] = [];
  private bufferB: RTCIceCandidateInit[] = [];

  constructor(factory: PeerConnectionFactory = defaultFactory) {
    this.factory = factory;
  }

  public init() {
    this.reset();

    const config: RTCConfiguration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    this.peerA = this.factory(config);
    this.peerB = this.factory(config);

    // Track states in store
    this.peerA.onconnectionstatechange = () => {
      if (this.peerA) {
        useLabStore.getState().setPeerAConnectionState(this.peerA.connectionState);
        useLabStore.getState().pushEvent({
          category: "ICE",
          summary: `Peer A connection state: ${this.peerA.connectionState}`,
        });
      }
    };

    this.peerB.onconnectionstatechange = () => {
      if (this.peerB) {
        useLabStore.getState().setPeerBConnectionState(this.peerB.connectionState);
        useLabStore.getState().pushEvent({
          category: "ICE",
          summary: `Peer B connection state: ${this.peerB.connectionState}`,
        });
      }
    };

    // Candidate handling
    this.peerA.onicecandidate = (e) => {
      if (e.candidate) {
        const parsed = parseIceCandidate(e.candidate.candidate);
        useLabStore.getState().addGatheredCandidate({
          peer: "A",
          type: parsed.type,
          protocol: parsed.protocol,
          address: parsed.address,
          port: parsed.port,
          isMdns: parsed.isMdns,
          raw: e.candidate.candidate,
        });

        this.routeMessage({
          from: "A",
          to: "B",
          type: "candidate",
          payload: e.candidate.toJSON ? e.candidate.toJSON() : { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex },
          summary: `Peer A gathered candidate (${parsed.type})`,
        });
      }
    };

    this.peerB.onicecandidate = (e) => {
      if (e.candidate) {
        const parsed = parseIceCandidate(e.candidate.candidate);
        useLabStore.getState().addGatheredCandidate({
          peer: "B",
          type: parsed.type,
          protocol: parsed.protocol,
          address: parsed.address,
          port: parsed.port,
          isMdns: parsed.isMdns,
          raw: e.candidate.candidate,
        });

        this.routeMessage({
          from: "B",
          to: "A",
          type: "candidate",
          payload: e.candidate.toJSON ? e.candidate.toJSON() : { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex },
          summary: `Peer B gathered candidate (${parsed.type})`,
        });
      }
    };

    // Handle data channel arrival on Peer B
    this.peerB.ondatachannel = (e) => {
      this.dcB = e.channel;
      this.dcB.onmessage = (msgEvent) => {
        useLabStore.getState().addDataChannelMessage({ from: "A", text: msgEvent.data });
      };
      useLabStore.getState().pushEvent({
        category: "DATA_CHANNEL",
        summary: "Data channel received on Peer B",
      });
    };
  }

  public async startOfferFlow() {
    if (!this.peerA) this.init();
    if (!this.peerA) return;

    // RULE: Create data channel before createOffer so an m-section exists
    this.dcA = this.peerA.createDataChannel("lab-channel");
    this.dcA.onmessage = (msgEvent) => {
      useLabStore.getState().addDataChannelMessage({ from: "B", text: msgEvent.data });
    };

    useLabStore.getState().pushEvent({
      category: "DATA_CHANNEL",
      summary: "Created data channel 'lab-channel' on Peer A before offer",
    });

    const offer = await this.peerA.createOffer();
    await this.peerA.setLocalDescription(offer);

    useLabStore.getState().setSdpOffer(offer.sdp || "");
    useLabStore.getState().pushEvent({
      category: "SIGNALING",
      summary: "Peer A created SDP offer and setLocalDescription",
    });

    this.routeMessage({
      from: "A",
      to: "B",
      type: "offer",
      payload: offer,
      summary: "SDP Offer from Peer A",
    });
  }

  public routeMessage(msg: Omit<MailboxMessage, "id">) {
    const isPaused = useLabStore.getState().isPaused;
    if (isPaused) {
      useLabStore.getState().enqueueMailbox(msg);
      useLabStore.getState().pushEvent({
        category: "SIGNALING",
        summary: `[SIMULATION: In-Memory Mailbox] Queued ${msg.type.toUpperCase()} from Peer ${msg.from}`,
      });
    } else {
      this.deliverMessage(msg);
    }
  }

  public async stepNext(): Promise<boolean> {
    const msg = useLabStore.getState().dequeueMailbox();
    if (!msg) return false;

    await this.deliverMessage(msg);
    return true;
  }

  public async deliverMessage(msg: Omit<MailboxMessage, "id">) {
    if (msg.type === "offer") {
      if (!this.peerB) return;
      const offer = msg.payload as RTCSessionDescriptionInit;
      await this.peerB.setRemoteDescription(offer);
      useLabStore.getState().pushEvent({
        category: "SIGNALING",
        summary: "Peer B setRemoteDescription(offer)",
      });

      // Flush candidates buffered on Peer B before remote description was set
      await this.flushBufferB();

      const answer = await this.peerB.createAnswer();
      await this.peerB.setLocalDescription(answer);

      useLabStore.getState().setSdpAnswer(answer.sdp || "");
      useLabStore.getState().pushEvent({
        category: "SIGNALING",
        summary: "Peer B created SDP answer and setLocalDescription",
      });

      this.routeMessage({
        from: "B",
        to: "A",
        type: "answer",
        payload: answer,
        summary: "SDP Answer from Peer B",
      });
    } else if (msg.type === "answer") {
      if (!this.peerA) return;
      const answer = msg.payload as RTCSessionDescriptionInit;
      await this.peerA.setRemoteDescription(answer);
      useLabStore.getState().pushEvent({
        category: "SIGNALING",
        summary: "Peer A setRemoteDescription(answer)",
      });

      // Flush candidates buffered on Peer A before remote description was set
      await this.flushBufferA();
    } else if (msg.type === "candidate") {
      const candInit = msg.payload as RTCIceCandidateInit;
      if (msg.to === "B") {
        if (!this.peerB || !this.peerB.currentRemoteDescription) {
          this.bufferB.push(candInit);
          useLabStore.getState().pushEvent({
            category: "ICE",
            summary: "Buffered Peer A candidate on Peer B (awaiting remote description)",
          });
        } else {
          await this.peerB.addIceCandidate(candInit);
        }
      } else if (msg.to === "A") {
        if (!this.peerA || !this.peerA.currentRemoteDescription) {
          this.bufferA.push(candInit);
          useLabStore.getState().pushEvent({
            category: "ICE",
            summary: "Buffered Peer B candidate on Peer A (awaiting remote description)",
          });
        } else {
          await this.peerA.addIceCandidate(candInit);
        }
      }
    }
  }

  private async flushBufferA() {
    if (!this.peerA || !this.peerA.currentRemoteDescription) return;
    while (this.bufferA.length > 0) {
      const cand = this.bufferA.shift();
      if (cand) await this.peerA.addIceCandidate(cand);
    }
  }

  private async flushBufferB() {
    if (!this.peerB || !this.peerB.currentRemoteDescription) return;
    while (this.bufferB.length > 0) {
      const cand = this.bufferB.shift();
      if (cand) await this.peerB.addIceCandidate(cand);
    }
  }

  public sendMessage(from: "A" | "B", text: string) {
    if (from === "A" && this.dcA && this.dcA.readyState === "open") {
      this.dcA.send(text);
      useLabStore.getState().addDataChannelMessage({ from: "A", text });
    } else if (from === "B" && this.dcB && this.dcB.readyState === "open") {
      this.dcB.send(text);
      useLabStore.getState().addDataChannelMessage({ from: "B", text });
    }
  }

  public reset() {
    if (this.peerA) {
      this.peerA.onconnectionstatechange = null;
      this.peerA.onicecandidate = null;
      this.peerA.close();
      this.peerA = null;
    }
    if (this.peerB) {
      this.peerB.onconnectionstatechange = null;
      this.peerB.onicecandidate = null;
      this.peerB.ondatachannel = null;
      this.peerB.close();
      this.peerB = null;
    }
    if (this.dcA) {
      this.dcA.onmessage = null;
      this.dcA.close();
      this.dcA = null;
    }
    if (this.dcB) {
      this.dcB.onmessage = null;
      this.dcB.close();
      this.dcB = null;
    }
    this.bufferA = [];
    this.bufferB = [];
    useLabStore.getState().reset();
  }
}

export const loopbackService = new LoopbackService();
