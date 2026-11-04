import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Laptop,
  Radio,
  Server,
  Layers,
  Activity,
  Play,
  Pause,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Video,
  MessageSquare,
  Zap,
  CheckCircle2,
  FileText,
  Network,
  Cloud,
  ArrowRight,
  Terminal,
} from "lucide-react";
import { useLabStore, type CandidateInfo } from "@/store/labStore";
import { loopbackService } from "@/services/loopback.service";
import { createSyntheticMediaStream } from "@/utils/media.utils";
import { Stepper, type StepItem } from "@/components/react-bits/Stepper";
import { SpecularButton } from "@/components/react-bits/SpecularButton";
import { CallChip, type CallChipState } from "@/components/react-bits/CallChip";

interface ActionReaction {
  title: string;
  detail: string;
  badge?: string;
  timestamp: string;
}

interface WsFrame {
  id: string;
  timestamp: string;
  direction: "A ➔ SRV" | "B ➔ SRV" | "SRV ➔ A" | "SRV ➔ B" | "SRV ➔ ALL" | "A ➔ SRV ➔ B";
  title: string;
  explanation: string;
  payload: string;
  badge?: string;
  emoji?: string;
}

export const BeginnerLab: React.FC = () => {
  const {
    currentStep,
    setStep,
    isPaused,
    setIsPaused,
    mailbox,
    gatheredCandidates,
    sdpOffer,
    sdpAnswer,
    dataChannelMessages,
    peerAConnectionState,
    peerBConnectionState,
    localMediaStream,
    remoteMediaStream,
    mediaStatus,
    setMediaStatus,
  } = useLabStore();

  const [messageInputA, setMessageInputA] = useState("");
  const [messageInputB, setMessageInputB] = useState("");
  const [selectedPacketIndex, setSelectedPacketIndex] = useState<number | null>(null);
  const [packetFilter, setPacketFilter] = useState<"all" | "sdp" | "ice">("all");

  // CallChip Live Action Timer State
  const [callChipLabel, setCallChipLabel] = useState("ready_for_handshake");
  const [callChipState, setCallChipState] = useState<CallChipState>("idle");
  const [callChipDuration, setCallChipDuration] = useState<number | undefined>(undefined);

  // Step 1 Signaling WebSocket simulation state
  const [signalingConnected, setSignalingConnected] = useState(false);
  const [signalingPingActive, setSignalingPingActive] = useState(false);
  const [signalingPingDelivered, setSignalingPingDelivered] = useState(false);
  const [wsFrames, setWsFrames] = useState<WsFrame[]>([
    {
      id: "init",
      timestamp: new Date().toLocaleTimeString(),
      direction: "SRV ➔ ALL",
      title: "Server Standby • Listening for Peers",
      explanation: "The central signaling server is online at wss://signaling.lab:443. It awaits WebSocket connections from peers wishing to meet in room 'mesh-402'.",
      payload: '{"status":"ready","server":"wss://signaling.lab:443","room":"mesh-402"}',
      badge: "STANDBY",
      emoji: "☁️",
    },
  ]);

  // Dynamic Action Reaction State (Explains what just happened on click)
  const [lastReaction, setLastReaction] = useState<ActionReaction>({
    title: "System Standby",
    detail: "Choose a step and trigger an action to observe live WebRTC protocol events.",
    badge: "INITIAL",
    timestamp: new Date().toLocaleTimeString(),
  });

  // Video Refs for Step 5
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const syntheticMediaStopRef = useRef<(() => void) | null>(null);

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
  };

  useEffect(() => {
    loopbackService.init();

    if (typeof window !== "undefined") {
      (window as unknown as { __LOOPBACK_SERVICE__: typeof loopbackService }).__LOOPBACK_SERVICE__ = loopbackService;
    }

    return () => {
      if (syntheticMediaStopRef.current) {
        syntheticMediaStopRef.current();
      }
      loopbackService.reset();
    };
  }, []);

  // Sync video elements with streams
  useEffect(() => {
    if (localVideoRef.current && localMediaStream) {
      localVideoRef.current.srcObject = localMediaStream;
    }
  }, [localMediaStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteMediaStream) {
      remoteVideoRef.current.srcObject = remoteMediaStream;
    }
  }, [remoteMediaStream]);

  // Step 1: Connect to Signaling Matchmaker and trigger handshake
  const handleConnectSignaling = async () => {
    setSignalingConnected(true);
    setCallChipLabel("websocket_room_mesh402_connected");
    setCallChipState("success");
    setCallChipDuration(400);

    const now = new Date().toLocaleTimeString();
    setWsFrames((prev) => [
      ...prev,
      {
        id: `ws-${Date.now()}-1`,
        timestamp: now,
        direction: "A ➔ SRV",
        title: "Peer A joins room 'mesh-402'",
        explanation: "Peer A establishes a WebSocket connection to the matchmaker server and registers: 'I am Peer A (caller_a19). Let me know when another peer enters room mesh-402.'",
        payload: '{"action":"join_room","clientId":"caller_a19","room":"mesh-402"}',
        badge: "JOIN_ROOM",
        emoji: "👤",
      },
      {
        id: `ws-${Date.now()}-2`,
        timestamp: now,
        direction: "B ➔ SRV",
        title: "Peer B joins room 'mesh-402'",
        explanation: "Peer B connects to the same matchmaker server: 'I am Peer B (callee_b82). I am in room mesh-402 and ready to receive connection requests.'",
        payload: '{"action":"join_room","clientId":"callee_b82","room":"mesh-402"}',
        badge: "JOIN_ROOM",
        emoji: "👤",
      },
      {
        id: `ws-${Date.now()}-3`,
        timestamp: now,
        direction: "SRV ➔ ALL",
        title: "Matchmaker announces: Room is Ready!",
        explanation: "The server broadcasts to both peers: 'Both parties are online in room mesh-402! Peer A, you may now generate and send your SDP offer.'",
        payload: '{"event":"room_ready","room":"mesh-402","peers":["caller_a19","callee_b82"]}',
        badge: "ROOM_READY",
        emoji: "🎉",
      },
    ]);

    setLastReaction({
      title: "WebSocket Handshake Verified",
      detail: "Both peers upgraded HTTP to WebSocket (101 Switching Protocols) and joined room 'mesh-402'. The server holds open two-way TCP channels so both clients can exchange SDP credentials.",
      badge: "WEBSOCKET 101",
      timestamp: now,
    });

    await loopbackService.startOfferFlow();
  };

  // Step 1: Dispatch Test Rendezvous Ping
  const handleDispatchPing = () => {
    if (!signalingConnected) {
      handleConnectSignaling();
    }
    setSignalingPingActive(true);
    setCallChipLabel("dispatching_rendezvous_ping");
    setCallChipState("running");

    const now = new Date().toLocaleTimeString();
    setWsFrames((prev) => [
      ...prev,
      {
        id: `ws-${Date.now()}-ping`,
        timestamp: now,
        direction: "A ➔ SRV ➔ B",
        title: "Relay Health Ping (A ➔ Server ➔ B)",
        explanation: "Peer A sends a lightweight JSON ping through the server to test relay health. The matchmaker immediately forwards it to Peer B to prove bidirectional transport works.",
        payload: '{"type":"signal_relay","from":"caller_a19","data":{"type":"ping","note":"ready_for_sdp"}}',
        badge: "PING_RELAY",
        emoji: "⚡",
      },
    ]);

    setTimeout(() => {
      setSignalingPingActive(false);
      setSignalingPingDelivered(true);
      setCallChipLabel("rendezvous_ping_acknowledged");
      setCallChipState("success");
      setCallChipDuration(600);

      setLastReaction({
        title: "Signaling Relay Confirmed (A ➔ Server ➔ B)",
        detail: "Peer A dispatched a test JSON message through the server. Peer B received it without error. The signaling highway is proven and ready to exchange SDP offers in Step 2.",
        badge: "RELAY VERIFIED",
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 900);
  };

  // Handle Offer Creation with CallChip feedback and dynamic reaction
  const handleStartHandshake = async () => {
    setCallChipLabel("generating_sdp_offer_and_datachannel");
    setCallChipState("running");

    setLastReaction({
      title: "Generating Local SDP Offer",
      detail: "Peer A inspected local video/audio capabilities, created a data channel ('lab-channel'), and serialized 42 lines of SDP.",
      badge: "SDP OFFER",
      timestamp: new Date().toLocaleTimeString(),
    });

    setTimeout(async () => {
      await loopbackService.startOfferFlow();
      setCallChipLabel("offer_queued_in_mailbox");
      setCallChipState("success");
      setCallChipDuration(800);

      setLastReaction({
        title: "Offer & Initial Candidates Queued",
        detail: "SDP offer and initial host candidates placed into signaling mailbox. Awaiting transmission to Peer B.",
        badge: "MAILBOX",
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 700);
  };

  // Handle Stepping Next Message through Mailbox
  const handleStepMessage = async () => {
    if (mailbox.length === 0) return;
    const nextMsg = mailbox[0];

    setCallChipLabel(`delivering_${nextMsg.type}_to_peer_${nextMsg.to}`);
    setCallChipState("running");

    setLastReaction({
      title: `Forwarding ${nextMsg.type.toUpperCase()} to Peer ${nextMsg.to}`,
      detail: `Mailbox transferred item '${nextMsg.summary}'. Recipient will parse and invoke setRemoteDescription or addIceCandidate.`,
      badge: nextMsg.type.toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
    });

    setTimeout(async () => {
      await loopbackService.stepNext();
      setCallChipLabel(`${nextMsg.type}_delivered_to_peer_${nextMsg.to}`);
      setCallChipState("success");
      setCallChipDuration(650);
    }, 600);
  };

  const handleSendA = () => {
    if (!messageInputA.trim()) return;
    loopbackService.sendMessage("A", messageInputA.trim());
    setCallChipLabel("sctp_packet_sent_to_peer_b");
    setCallChipState("success");
    setCallChipDuration(120);

    setLastReaction({
      title: "SCTP Data Packet Sent (Peer A ➔ Peer B)",
      detail: `Delivered message "${messageInputA.trim()}" over SCTP stream 0 via encrypted DTLS session.`,
      badge: "DATA CHANNEL",
      timestamp: new Date().toLocaleTimeString(),
    });

    setMessageInputA("");
  };

  const handleSendB = () => {
    if (!messageInputB.trim()) return;
    loopbackService.sendMessage("B", messageInputB.trim());
    setCallChipLabel("sctp_packet_sent_to_peer_a");
    setCallChipState("success");
    setCallChipDuration(120);

    setLastReaction({
      title: "SCTP Data Packet Sent (Peer B ➔ Peer A)",
      detail: `Delivered response "${messageInputB.trim()}" over SCTP stream 0 via encrypted DTLS session.`,
      badge: "DATA CHANNEL",
      timestamp: new Date().toLocaleTimeString(),
    });

    setMessageInputB("");
  };

  // Step 4 NAT packet trigger with CallChip feedback & explanation
  const handleTriggerNatSimulation = () => {
    setCallChipLabel("nat_rewriting_packet_header");
    setCallChipState("running");

    setLastReaction({
      title: "Outbound UDP Packet Leaving LAN",
      detail: "Source packet originating from private address 192.168.1.15:54321 hitting NAT router...",
      badge: "NAT OUTBOUND",
      timestamp: new Date().toLocaleTimeString(),
    });

    setTimeout(() => {
      setCallChipLabel("pinhole_active_103.21.44.12:49152");
      setCallChipState("success");
      setCallChipDuration(1100);

      setLastReaction({
        title: "Pinhole Active: STUN Reflected Public IP",
        detail: "Pinhole active! STUN server successfully reflected external address 103.21.44.12:49152. Inbound return path unlocked.",
        badge: "PINHOLE OPEN",
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 1100);
  };

  // Step 5 Media capture trigger
  const handleRequestMedia = async () => {
    setMediaStatus("requesting");
    setCallChipLabel("requesting_media_stream_track");
    setCallChipState("running");

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        loopbackService.attachMediaStream(stream);
        setMediaStatus("live");
        setCallChipLabel("live_camera_track_attached");
        setCallChipState("success");
        setCallChipDuration(750);

        setLastReaction({
          title: "Hardware Camera Track Attached",
          detail: "Feed Active: Live video track bound to RTCPeerConnection via addTrack(). Encrypted via DTLS-SRTP.",
          badge: "MEDIA LIVE",
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        throw new Error("No mediaDevices");
      }
    } catch {
      // Fallback to synthetic animated canvas stream
      const { stream, stop } = createSyntheticMediaStream(320, 240, "Local Peer A Camera");
      syntheticMediaStopRef.current = stop;
      loopbackService.attachMediaStream(stream);
      setMediaStatus("synthetic");
      setCallChipLabel("synthetic_canvas_track_attached");
      setCallChipState("success");
      setCallChipDuration(500);

      setLastReaction({
        title: "Synthetic 30FPS Test Video Stream Attached",
        detail: "Feed Active: Rendered canvas test pattern track bound to Peer A and encoded via VP8.",
        badge: "SYNTHETIC VIDEO",
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  // 6 Stepper definitions
  const stepperItems: StepItem[] = [
    { id: 1, label: "Signaling" },
    { id: 2, label: "SDP Cards" },
    { id: 3, label: "ICE Paths" },
    { id: 4, label: "NAT Router" },
    { id: 5, label: "Media SRTP" },
    { id: 6, label: "Data Channel" },
  ];

  // Step curriculum definitions
  const stepConfigs = [
    {
      title: "The Matchmaker (Signaling)",
      question: "If WebRTC is peer-to-peer, why do we need a server at all to get started?",
      analogy: "You can have a private phone call with anyone in the world, but you first need a mutual friend to give you each other's phone number.",
      whatHappened: "Peer A and Peer B can't connect directly until they know how to address each other. The signaling server is simply a messenger that passes their initial contact notes.",
    },
    {
      title: "The Business Card (SDP Offer / Answer)",
      question: "How do two browsers agree on video quality and audio formats before sending media?",
      analogy: "Before starting a business deal, two people exchange business cards detailing what languages they speak and what contracts they accept.",
      whatHappened: "Peer A listed its supported video formats and media channels in an SDP text document. Peer B reviewed it, matched compatible formats, and sent back its agreement (the Answer).",
    },
    {
      title: "Finding the Path (ICE Candidates)",
      question: "How do browsers find the actual network route to reach each other through home Wi-Fi and mobile networks?",
      analogy: "Imagine writing down every possible address where someone might reach you: your home Wi-Fi address, your public street address, and an office mailbox.",
      whatHappened: "Candidates are gathered after setLocalDescription, and only for a media section or data channel in the offer. This lab adds a data channel before creating the offer so there is something to connect.",
    },
    {
      title: "The Apartment Front Desk (NAT Basics)",
      question: "Why can't someone on the public internet connect directly to your laptop's Wi-Fi IP address?",
      analogy: "Your apartment building has one street address, but individual apartment numbers are secret from outside delivery drivers until the front desk logs your outgoing request.",
      whatHappened: "Network Address Translation (NAT) maps many private home IPs to a single public IP. When Peer A sends an outbound packet, the router creates a temporary pinhole that lets Peer B reply.",
    },
    {
      title: "Hooking up the Cameras (Media Streams & Tracks)",
      question: "How does raw webcam video get compressed, packetized, and encrypted into the peer connection?",
      analogy: "A camera feed is like an uncompressed water hose. WebRTC puts it through a tight nozzle (codec), stamps every droplet with a timestamp (RTP), and locks it in an armored pipe (SRTP).",
      whatHappened: "getUserMedia captures raw camera frames, the browser encodes them into VP8 or H.264 video packets, and encrypts them using SRTP keys negotiated during the DTLS handshake.",
    },
    {
      title: "The Direct Wire (Data Channels)",
      question: "Can we transfer arbitrary data like chat, gaming states, or files directly between browsers?",
      analogy: "Alongside the audio and video pipe, WebRTC lays a direct fiber-optic cable for binary and text messages with zero server in between.",
      whatHappened: "RTCDataChannel uses the SCTP protocol running over DTLS. It provides high-throughput, low-latency, encrypted messaging with configurable reliability and ordering.",
    },
  ];

  const currentConfig = stepConfigs[currentStep - 1];

  // Derive consolidated list of all transmitted & in-flight packets for X-Ray Inspector
  interface PacketRecord {
    id: string;
    from: "A" | "B";
    to: "A" | "B";
    type: "offer" | "answer" | "candidate";
    summary: string;
    candidate?: CandidateInfo;
    sdpSnippet?: string;
    isInFlight?: boolean;
  }

  const allPackets: PacketRecord[] = [];

  // Add currently queued mailbox items
  mailbox.forEach((msg) => {
    allPackets.push({
      id: `mb-${msg.id}`,
      from: msg.from,
      to: msg.to,
      type: msg.type,
      summary: msg.summary,
      isInFlight: true,
    });
  });

  // Add SDP offer
  if (sdpOffer) {
    allPackets.push({
      id: "sdp-offer",
      from: "A",
      to: "B",
      type: "offer",
      summary: "SDP Offer (VP8, H264, SCTP data-channel)",
      sdpSnippet: sdpOffer.slice(0, 320) + "...",
    });
  }

  // Add SDP answer
  if (sdpAnswer) {
    allPackets.push({
      id: "sdp-answer",
      from: "B",
      to: "A",
      type: "answer",
      summary: "SDP Answer (Codecs Accepted, DTLS Fingerprint)",
      sdpSnippet: sdpAnswer.slice(0, 320) + "...",
    });
  }

  // Add gathered candidates
  gatheredCandidates.forEach((c) => {
    allPackets.push({
      id: `cand-${c.id}`,
      from: c.peer,
      to: c.peer === "A" ? "B" : "A",
      type: "candidate",
      summary: `ICE Candidate: [${c.type}] ${c.address}:${c.port} (${c.protocol.toUpperCase()})`,
      candidate: c,
    });
  });

  // Filtered packets
  const filteredPackets = allPackets.filter((p) => {
    if (packetFilter === "sdp") return p.type === "offer" || p.type === "answer";
    if (packetFilter === "ice") return p.type === "candidate";
    return true;
  });

  const activePacket =
    selectedPacketIndex !== null && filteredPackets[selectedPacketIndex]
      ? filteredPackets[selectedPacketIndex]
      : filteredPackets[0] || null;

  return (
    <div className="min-h-screen lg:h-screen w-screen bg-[#000000] text-[#ededed] font-sans selection:bg-[#262626] selection:text-[#ededed] p-2.5 sm:p-3 flex flex-col overflow-y-auto lg:overflow-hidden gap-2">
      {/* 1. COMPACT TOP HEADER & NAVIGATION RIBBON */}
      <header className="h-11 shrink-0 flex items-center justify-between border-b border-[#242424] pb-2 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#262626] bg-[#121212] font-mono text-xs text-[#ededed]">
              ▲
            </span>
            <span className="text-sm font-semibold tracking-tight text-[#ededed]">WebRTC Learning Lab</span>
            <span className="text-xs text-[#666666]">/</span>
            <span className="text-xs font-mono text-[#a1a1a1]">Interactive Simulator</span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-2">
            <CallChip
              label={callChipLabel}
              state={callChipState}
              durationMs={callChipDuration}
            />
          </div>
        </div>

        {/* Center: Stepper (1 to 6) */}
        <div className="hidden sm:block">
          <Stepper
            steps={stepperItems}
            currentStep={currentStep}
            onStepChange={handleStepChange}
          />
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            data-testid="btn-pause-toggle"
            className={`inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-xs font-mono font-medium border transition-colors ${
              isPaused
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-[#242424] bg-[#121212] text-[#ededed] hover:border-[#404040]"
            }`}
          >
            {isPaused ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isPaused ? "Mailbox Paused" : "Real-Time Delivery"}</span>
          </button>

          <button
            type="button"
            onClick={() => loopbackService.reset()}
            data-testid="btn-reset"
            className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-2 text-xs text-[#a1a1a1] hover:border-[#404040] hover:text-[#ededed] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden md:inline">Reset</span>
          </button>

          <div className="flex items-center gap-1 border-l border-[#242424] pl-2">
            <button
              type="button"
              data-testid="btn-back"
              onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
              disabled={currentStep <= 1}
              aria-label="Back"
              className="inline-flex h-7 items-center gap-0.5 px-2 text-xs font-medium rounded-[6px] border border-[#242424] bg-[#0a0a0a] text-[#ededed] hover:border-[#404040] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <button
              type="button"
              data-testid="btn-next"
              onClick={() => handleStepChange(Math.min(6, currentStep + 1))}
              disabled={currentStep >= 6}
              aria-label="Next"
              className="inline-flex h-7 items-center gap-0.5 px-2.5 text-xs font-medium rounded-[6px] border border-[#242424] bg-[#ededed] text-[#000000] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span>Next</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. THE ADAPTIVE MORPHING BENTO GRID */}
      <AnimatePresence mode="wait">
        {currentStep === 1 ? (
          /* ============================================================== */
          /* STEP 1: SIGNALING DISCOVERY ARENA (Morphing Bento View) */
          /* ============================================================== */
          <motion.div
            key="step-1-bento"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-h-0 h-full w-full grid grid-cols-12 grid-rows-1 gap-2.5"
          >
            {/* LEFT HERO: BASELINE EXPLANATION & ACTION DECK (Col 5) */}
            <div className="col-span-12 lg:col-span-5 h-full min-h-0 flex flex-col justify-between rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 shadow-sm overflow-hidden">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤝</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Cloud className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm sm:text-base font-bold text-[#ededed]">
                          Step 1 • The Matchmaker (Signaling)
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#888888]">Curriculum • Phase: Discovery & Rendezvous</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-[6px] border border-cyan-500/40 bg-cyan-950/30 text-cyan-300 font-semibold">
                    🌐 WebSocket Online
                  </span>
                </div>

                {/* Dedicated 2-Line "Why Are We Doing This?" Card */}
                <div className="rounded-[8px] border border-cyan-500/40 bg-gradient-to-r from-cyan-950/30 via-cyan-900/10 to-transparent p-2.5 space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
                    <span>🎯</span>
                    <span>Why Are We Doing This?</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#ededed] leading-relaxed">
                    Before two browsers can talk directly, neither knows the other's IP address or private home router port.
                    We use this temporary server as a "matchmaker" just long enough to swap contact cards — once connected, real video and audio never touch this server!
                  </p>
                </div>

                {/* The Core Problem & Baseline */}
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-semibold text-[#ededed] flex items-center gap-1.5">
                    <span>❓</span>
                    <span>The Chicken-and-Egg Dilemma</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#a1a1a1] leading-relaxed">
                    WebRTC creates direct, encrypted peer-to-peer pipelines for video and data. But <strong className="text-[#ededed]">two browsers cannot dial each other blindly</strong>. They live behind private home routers (NAT) and neither browser knows the other's public IP or supported codecs.
                  </p>
                </div>

                {/* Mental Model & Analogy */}
                <div className="rounded-[8px] border border-[#222222] bg-[#121212] p-2.5 space-y-1 text-xs sm:text-sm">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1">
                    <span>💡</span>
                    <span>Mental Model & Analogy</span>
                  </span>
                  <p className="text-[#ededed] italic leading-relaxed">
                    "You want to make a private phone call with someone across the world, but you first need a mutual friend to introduce you and exchange your phone numbers."
                  </p>
                </div>

                {/* The WebRTC Rule */}
                <div className="text-xs sm:text-sm font-mono text-[#888888] space-y-0.5 border-l-2 border-cyan-500/60 pl-2.5 py-0.5">
                  <p>
                    <strong className="text-[#ededed]">🔑 Key Protocol Fact:</strong> WebRTC intentionally specifies <span className="underline decoration-cyan-500 text-cyan-200">zero signaling</span>. Developers choose the transport (WebSocket, HTTP REST, SIP, or Firebase).
                  </p>
                </div>
              </div>

              {/* Numbered Action Directive ("What tells you what to do") */}
              <div className="space-y-2 pt-2 border-t border-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1">
                    <span>⚡</span>
                    <span>Interactive Directives</span>
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-medium">2-Stage Verification</span>
                </div>

                <div className="flex gap-2">
                  <SpecularButton
                    onClick={handleConnectSignaling}
                    data-testid="btn-start-offer"
                    className={`flex-1 h-9 text-xs sm:text-sm font-semibold ${signalingConnected ? "opacity-90" : ""}`}
                  >
                    <Zap className="h-3.5 w-3.5 mr-1 text-amber-400" />
                    <span>{signalingConnected ? "1. Connected & Offer Initialized" : "1. Connect Peers to Server"}</span>
                  </SpecularButton>

                  <button
                    type="button"
                    onClick={handleDispatchPing}
                    className="px-3.5 h-9 rounded-[6px] border border-[#242424] bg-[#141414] text-xs sm:text-sm font-mono text-[#ededed] hover:border-[#404040] hover:bg-[#1a1a1a] transition-all flex items-center gap-1.5"
                  >
                    <span>2. Send Ping</span>
                    <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
                  </button>
                </div>

                {/* Action Reaction Feed */}
                <div className="rounded-[8px] border border-[#262626] bg-[#111111] p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#ededed]">{lastReaction.title}</span>
                    </div>
                    {lastReaction.badge && (
                      <span className="rounded bg-[#1c1c1c] px-2 py-0.5 text-xs font-mono text-cyan-300 border border-[#2c2c2c]">
                        {lastReaction.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#a1a1a1] font-mono leading-relaxed">
                    {lastReaction.detail}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT FLANK: NETWORK STAGE + WEBSOCKET PROTOCOL LOG & DATA PIPE (Col 7) */}
            <div className="col-span-12 lg:col-span-7 h-full min-h-0 flex flex-col gap-2.5">
              {/* TOP: VISUAL TOPOLOGY STAGE (~44% height) */}
              <div className="h-[44%] shrink-0 rounded-[8px] border border-[#242424] bg-[#0c0c0c] p-2.5 flex flex-col justify-between relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed] flex items-center gap-1.5">
                      <span>🌐</span>
                      <span>Rendezvous Highway Topology</span>
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#888888] flex items-center gap-1">
                    <span>☁️</span>
                    <span>Cloud Broker • Room #mesh-402</span>
                  </span>
                </div>

                {/* Central Server & Client Nodes Visual */}
                <div className="relative my-auto flex flex-col items-center justify-between h-36 py-1">
                  {/* Central Cloud Matchmaker */}
                  <div className="z-10 flex flex-col items-center gap-1">
                    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] border transition-all ${
                      signalingConnected
                        ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.25)]"
                        : "border-[#242424] bg-[#141414] text-[#777777]"
                    }`}>
                      <Server className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div className="text-left font-mono">
                        <div className="text-xs sm:text-sm font-semibold text-[#ededed] flex items-center gap-1">
                          <span>☁️ Signaling Server (Matchmaker)</span>
                        </div>
                        <div className="text-xs text-[#888888]">wss://signaling.lab:443 • Room #mesh-402</div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Wire Animation Beams */}
                  <div className="w-full flex items-center justify-around px-8 z-0">
                    <div className="relative flex-1 h-[2px] bg-[#222222] mx-4">
                      {signalingPingActive && (
                        <motion.div
                          className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] absolute -top-1"
                          initial={{ left: "0%" }}
                          animate={{ left: "100%" }}
                          transition={{ duration: 0.45, ease: "easeInOut" }}
                        />
                      )}
                    </div>

                    <div className="relative flex-1 h-[2px] bg-[#222222] mx-4">
                      {signalingPingActive && (
                        <motion.div
                          className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] absolute -top-1"
                          initial={{ left: "0%" }}
                          animate={{ left: "100%" }}
                          transition={{ duration: 0.45, delay: 0.45, ease: "easeInOut" }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Bottom Peer Nodes */}
                  <div className="w-full flex items-center justify-between px-4 z-10">
                    {/* Peer A Node */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] border ${
                      signalingConnected
                        ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                        : "border-[#242424] bg-[#121212] text-[#777777]"
                    }`}>
                      <Laptop className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="text-left font-mono">
                        <div className="text-xs font-semibold text-[#ededed] flex items-center gap-1">
                          <span>💻 Peer A (Caller)</span>
                        </div>
                        <div className="text-xs text-[#666666]">192.168.1.15:51200</div>
                      </div>
                      <span
                        data-testid="peer-a-state"
                        className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/60 text-emerald-400 ml-1.5 border border-emerald-500/30 font-semibold"
                      >
                        {peerAConnectionState}
                      </span>
                    </div>

                    {/* Rendezvous Status */}
                    <div className="text-xs font-mono text-[#888888]">
                      {signalingPingDelivered ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>✅ Relay Ready</span>
                        </span>
                      ) : (
                        <span className="text-[#888888] flex items-center gap-1">
                          <span>⏳</span>
                          <span>Awaiting Ping</span>
                        </span>
                      )}
                    </div>

                    {/* Peer B Node */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] border ${
                      signalingConnected
                        ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-300"
                        : "border-[#242424] bg-[#121212] text-[#777777]"
                    }`}>
                      <Laptop className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div className="text-left font-mono">
                        <div className="text-xs font-semibold text-[#ededed] flex items-center gap-1">
                          <span>💻 Peer B (Callee)</span>
                        </div>
                        <div className="text-xs text-[#666666]">10.0.0.42:62400</div>
                      </div>
                      <span
                        data-testid="peer-b-state"
                        className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/60 text-cyan-400 ml-1.5 border border-cyan-500/30 font-semibold"
                      >
                        {peerBConnectionState}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#888888] border-t border-[#1e1e1e] pt-1">
                  <span>📡 Signaling Channel: WebSocket Full-Duplex</span>
                  <span>📦 Payload: JSON Text Control Frames</span>
                </div>
              </div>

              {/* BOTTOM: WEBSOCKET PROTOCOL STREAM + QUICK DATACHANNEL TEST DOCK */}
              <div className="flex-1 min-h-0 grid grid-cols-12 gap-2.5">
                {/* WebSocket Frames (Col 7) */}
                <div className="col-span-12 lg:col-span-7 h-full min-h-0 rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-2.5 flex flex-col justify-between overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed] flex items-center gap-1">
                        <span>📜</span>
                        <span>Live WebSocket Stream</span>
                      </span>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#161616] text-[#888888] border border-[#222222]">
                      {wsFrames.length} Frames
                    </span>
                  </div>

                  <div className="flex-1 min-h-0 my-1 overflow-y-auto rounded-[6px] bg-[#000000] p-2 space-y-2 border border-[#1a1a1a]">
                    {wsFrames.map((frame) => (
                      <div key={frame.id} className="rounded-[6px] border border-[#222222] bg-[#0c0c0c] p-2 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-sm">{frame.emoji || "✉️"}</span>
                            <span className={`px-2 py-0.5 rounded-[4px] text-xs font-bold border ${
                              frame.direction === "A ➔ SRV"
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
                                : frame.direction === "B ➔ SRV"
                                ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/40"
                                : frame.direction === "A ➔ SRV ➔ B"
                                ? "bg-purple-950/40 text-purple-300 border-purple-500/40"
                                : "bg-[#181818] text-amber-300 border-amber-500/30"
                            }`}>
                              {frame.direction}
                            </span>
                            <span className="font-semibold text-[#ededed] text-xs sm:text-sm">{frame.title}</span>
                          </div>
                          <span className="text-[#666666] font-mono text-xs">{frame.timestamp}</span>
                        </div>

                        <p className="text-xs text-[#a8a8a8] leading-relaxed pl-1.5 border-l-2 border-cyan-500/40">
                          {frame.explanation}
                        </p>

                        <div className="font-mono text-xs text-cyan-300 bg-black/80 px-2 py-1.5 rounded border border-[#202020] select-all overflow-x-auto whitespace-pre-wrap break-all">
                          {frame.payload}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs font-mono text-[#888888] pt-1.5 border-t border-[#1a1a1a] flex items-center gap-1">
                    <span>ℹ️</span>
                    <span>Server only forwards signaling metadata; media never flows here.</span>
                  </div>
                </div>

                {/* Quick DataChannel Verification Dock (Col 5) */}
                <div className="col-span-12 lg:col-span-5 h-full min-h-0 rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-2.5 flex flex-col justify-between overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs sm:text-sm font-semibold text-[#ededed] flex items-center gap-1">
                        <span>💬</span>
                        <span>P2P Data Channel</span>
                      </span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <span>⚡</span>
                      <span>Direct Pipe</span>
                    </span>
                  </div>

                  <div
                    data-testid="dc-log"
                    className="flex-1 min-h-0 my-1.5 overflow-y-auto rounded-[6px] bg-[#000000] p-2 text-xs font-mono text-[#ededed] space-y-1.5 border border-[#1a1a1a]"
                  >
                    {dataChannelMessages.length === 0 ? (
                      <div className="text-[#666666] italic flex items-center gap-1.5 py-4 justify-center text-xs">
                        <span>🔒</span>
                        <span>Direct wire activates once connected</span>
                      </div>
                    ) : (
                      dataChannelMessages.map((m, i) => (
                        <div key={i} className="text-xs leading-normal">
                          <span className="text-cyan-400 font-bold">[{m.from}]: </span>
                          <span className="text-[#ededed]">{m.text}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dual quick send controls */}
                  <div className="space-y-1.5 pt-1.5 border-t border-[#1e1e1e]">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="✉️ Send from A..."
                        value={messageInputA}
                        onChange={(e) => setMessageInputA(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendA()}
                        data-testid="input-msg-a"
                        className="h-7 flex-1 rounded border border-[#242424] bg-[#050505] px-2 text-xs font-mono text-[#ededed] outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleSendA}
                        data-testid="btn-send-a"
                        className="h-7 px-3 rounded border border-[#242424] bg-[#141414] text-xs font-medium text-[#ededed] hover:border-[#404040] transition-colors"
                      >
                        Send
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="✉️ Send from B..."
                        value={messageInputB}
                        onChange={(e) => setMessageInputB(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendB()}
                        data-testid="input-msg-b"
                        className="h-7 flex-1 rounded border border-[#242424] bg-[#050505] px-2 text-xs font-mono text-[#ededed] outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleSendB}
                        data-testid="btn-send-b"
                        className="h-7 px-3 rounded border border-[#242424] bg-[#141414] text-xs font-medium text-[#ededed] hover:border-[#404040] transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ============================================================== */
          /* STEPS 2-6: THE ACTIVE WEBRTC EXPERIMENTATION ARENA (BENTO) */
          /* ============================================================== */
          <motion.div
            key="steps-2-6-bento"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-h-0 w-full grid grid-cols-12 grid-rows-12 gap-2.5"
          >
            {/* CARD 1: PEER A - CALLER STUDIO (Left Flank) */}
            <div className="col-span-12 lg:col-span-3 row-span-12 rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Laptop className="h-4 w-4 text-[#a1a1a1]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#ededed]">Peer A (Caller)</span>
                  </div>
                  <span
                    data-testid="peer-a-state"
                    className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-medium border ${
                      peerAConnectionState === "connected"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-[#141414] text-[#a1a1a1] border-[#262626]"
                    }`}
                  >
                    {peerAConnectionState}
                  </span>
                </div>

                <div className="relative aspect-video w-full overflow-hidden rounded-[6px] border border-[#242424] bg-[#000000] flex items-center justify-center">
                  {localMediaStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-center p-3">
                      <Video className="h-6 w-6 text-[#404040]" />
                      <span className="text-[11px] font-mono text-[#666666]">Local Stream Inactive</span>
                      <span className="text-[10px] text-[#555555]">Step 5 attaches live or synthetic canvas feed</span>
                    </div>
                  )}
                  {mediaStatus !== "idle" && (
                    <span className="absolute top-1.5 right-1.5 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                      {mediaStatus === "live" ? "HD Camera" : "Synthetic 30fps"}
                    </span>
                  )}
                </div>

                <div className="rounded-[6px] border border-[#1e1e1e] bg-[#121212]/60 p-2.5 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[#888888]">
                    <span>Role:</span>
                    <span className="text-[#ededed]">Offerer (Initiator)</span>
                  </div>
                  <div className="flex justify-between text-[#888888]">
                    <span>DataChannel:</span>
                    <span className="text-[#ededed]">lab-channel (sctp:0)</span>
                  </div>
                  <div className="flex justify-between text-[#888888]">
                    <span>Local Offer:</span>
                    <span className="text-[#ededed]">{sdpOffer ? "42 lines (VP8/H264)" : "Pending"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-[#777777]">Gathered Candidates ({gatheredCandidates.filter(c => c.peer === 'A').length})</span>
                    <span className="text-[10px] font-mono text-[#555555]">RFC 8445</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {gatheredCandidates.filter(c => c.peer === 'A').length === 0 ? (
                      <span className="text-[11px] font-mono text-[#555555] italic">No local candidates gathered yet</span>
                    ) : (
                      gatheredCandidates.filter(c => c.peer === 'A').map((c) => (
                        <span
                          key={c.id}
                          className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[10px] font-mono border ${
                            c.type === "host"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : c.type === "srflx"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          }`}
                        >
                          <span>{c.type}</span>
                          <span className="text-[#888888]">{c.port}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1e1e1e] space-y-1.5">
                <span className="text-[11px] font-mono text-[#888888] block">Send to Peer B</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Message to B..."
                    value={messageInputA}
                    onChange={(e) => setMessageInputA(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendA()}
                    data-testid="input-msg-a"
                    className="h-7 flex-1 rounded-[4px] border border-[#242424] bg-[#050505] px-2 text-xs font-mono text-[#ededed] placeholder:text-[#555555] focus:border-[#404040] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendA}
                    data-testid="btn-send-a"
                    className="inline-flex h-7 items-center justify-center rounded-[4px] border border-[#242424] bg-[#141414] px-2.5 text-xs text-[#ededed] hover:border-[#404040] transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: CONCEPT + THE WIRE + PACKET X-RAY INSPECTOR */}
            <div className="col-span-12 lg:col-span-6 row-span-12 flex flex-col gap-2.5 h-full min-h-0">
              {/* CARD 2: CONCEPT & ACTION DECK */}
              <div className="h-[43%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3.5 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono tracking-wider uppercase text-[#a1a1a1]">
                      Step {currentStep} of 6 • Curriculum
                    </span>
                    <span className="text-[11px] font-mono text-[#666666]">
                      {currentStep === 2 && "RFC 8829 • JSEP"}
                      {currentStep === 3 && "RFC 8445 • ICE"}
                      {currentStep === 4 && "STUN & Firewall"}
                      {currentStep === 5 && "DTLS-SRTP Codecs"}
                      {currentStep === 6 && "SCTP Data Pipe"}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold tracking-tight text-[#ededed]">
                    {currentConfig.title}
                  </h2>

                  <p className="text-xs text-[#a1a1a1] leading-relaxed">
                    <strong className="text-[#ededed]">Mental Model & Analogy:</strong> {currentConfig.analogy}
                  </p>
                </div>

                {/* Step Dynamic Triggers */}
                <div className="py-2">
                  {currentStep === 2 && (
                    <SpecularButton
                      onClick={handleStartHandshake}
                      data-testid="btn-start-offer"
                      className="w-full h-8 text-xs font-semibold"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Generate SDP Business Card & Open Channels</span>
                    </SpecularButton>
                  )}

                  {currentStep === 3 && (
                    <div className="flex gap-2">
                      <SpecularButton
                        onClick={handleStartHandshake}
                        data-testid="btn-start-offer"
                        className="flex-1 h-8 text-xs font-semibold"
                      >
                        <Network className="h-3.5 w-3.5" />
                        <span>Gather All Candidate Routes</span>
                      </SpecularButton>
                      <button
                        type="button"
                        onClick={handleStepMessage}
                        disabled={mailbox.length === 0}
                        className="h-8 px-3 rounded-[6px] border border-[#242424] bg-[#121212] text-xs font-mono text-[#ededed] hover:border-[#404040] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Step Next ({mailbox.length})
                      </button>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-[#666666] block">[ILLUSTRATION: Educational Animation]</span>
                      <SpecularButton
                        onClick={handleTriggerNatSimulation}
                        className="w-full h-8 text-xs font-semibold"
                      >
                        <Radio className="h-3.5 w-3.5" />
                        <span>Send Outbound Packet through NAT</span>
                      </SpecularButton>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <SpecularButton
                      onClick={handleRequestMedia}
                      className="w-full h-8 text-xs font-semibold"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Request Camera / Synthetic Feed</span>
                    </SpecularButton>
                  )}

                  {currentStep === 6 && (
                    <div className="flex gap-2">
                      <SpecularButton
                        onClick={handleStartHandshake}
                        data-testid="btn-start-offer"
                        className="flex-1 h-8 text-xs font-semibold"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Establish Direct SCTP Data Wire</span>
                      </SpecularButton>
                    </div>
                  )}
                </div>

                <div className="rounded-[6px] border border-[#262626] bg-[#111111]/80 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[11px] font-semibold tracking-wide text-[#ededed]">
                        {lastReaction.title}
                      </span>
                    </div>
                    {lastReaction.badge && (
                      <span className="rounded-[3px] bg-[#1f1f1f] px-1.5 py-0.2 text-[9px] font-mono text-[#a1a1a1]">
                        {lastReaction.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#a1a1a1] leading-normal font-mono">
                    {lastReaction.detail}
                  </p>
                </div>
              </div>

              {/* CARD 3: THE LIVE WIRE & BUFFER STACK */}
              <div className="h-[25%] rounded-[8px] border border-[#242424] bg-[#0d0d0d] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#ededed]">Signaling Highway</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#888888]">Buffer Queue:</span>
                    <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold border ${
                      mailbox.length > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-[#141414] text-[#666666] border-[#222222]"
                    }`}>
                      {mailbox.length} in flight
                    </span>
                    {mailbox.length > 0 && (
                      <button
                        type="button"
                        onClick={handleStepMessage}
                        className="ml-1 px-2 py-0.5 rounded-[4px] border border-[#333333] bg-[#1a1a1a] text-[10px] text-[#ededed] hover:border-[#555555] transition-all"
                      >
                        Deliver Next ➔
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative my-auto flex items-center justify-between px-6 py-2">
                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-black ring-1 ring-emerald-500/50" />
                    <span className="text-[10px] font-mono text-[#888888]">Peer A</span>
                  </div>

                  <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-[2px] bg-[#222222]">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] -translate-y-1/2 top-1/2 absolute"
                      animate={{ left: ["5%", "95%"] }}
                      transition={{ duration: isPaused ? 0 : 2.4, repeat: isPaused ? 0 : Infinity, ease: "linear" }}
                    />
                  </div>

                  <div className="flex flex-col items-center gap-1 z-10 bg-[#0d0d0d] px-2">
                    <div className={`flex items-center gap-1 rounded-[6px] border px-2 py-1 text-[10px] font-mono ${
                      mailbox.length > 0 ? "border-amber-500/40 bg-amber-950/20 text-amber-300" : "border-[#262626] bg-[#141414] text-[#777777]"
                    }`}>
                      <Server className="h-3 w-3" />
                      <span>{mailbox.length > 0 ? `${mailbox.length} Queued` : "Mailbox Clear"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="h-3 w-3 rounded-full bg-cyan-500 border-2 border-black ring-1 ring-cyan-500/50" />
                    <span className="text-[10px] font-mono text-[#888888]">Peer B</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono text-[#777777]">
                  <span>Next up:</span>
                  {mailbox.length === 0 ? (
                    <span className="italic text-[#444444]">No pending signaling messages</span>
                  ) : (
                    mailbox.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 rounded-[4px] border border-[#2a2a2a] bg-[#141414] px-1.5 py-0.5 text-[#ededed]"
                      >
                        <span>{m.from}➔{m.to}</span>
                        <span className="text-amber-400 font-semibold">{m.type}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* CARD 4: PACKET X-RAY & PAYLOAD INSPECTOR */}
              <div className="h-[32%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#ededed]">Packet X-Ray & Gathered Candidates</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(["all", "sdp", "ice"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setPacketFilter(filter);
                          setSelectedPacketIndex(0);
                        }}
                        className={`rounded-[4px] px-2 py-0.5 text-[10px] font-mono uppercase transition-colors ${
                          packetFilter === filter
                            ? "bg-[#222222] text-[#ededed] font-semibold"
                            : "text-[#666666] hover:text-[#ededed]"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-12 gap-2 pt-2">
                  <div className="col-span-5 h-full overflow-y-auto space-y-1 pr-1 border-r border-[#1a1a1a]">
                    {filteredPackets.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[10px] font-mono text-[#444444] italic">
                        No packets recorded
                      </div>
                    ) : (
                      filteredPackets.map((pkt, idx) => (
                        <button
                          key={pkt.id}
                          type="button"
                          onClick={() => setSelectedPacketIndex(idx)}
                          className={`w-full text-left rounded-[4px] p-1.5 border text-[10px] font-mono transition-all flex items-center justify-between ${
                            (selectedPacketIndex === idx || (selectedPacketIndex === null && idx === 0))
                              ? "border-cyan-500/50 bg-[#141414] text-[#ededed]"
                              : "border-[#1e1e1e] bg-[#0a0a0a] text-[#888888] hover:border-[#333333]"
                          }`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <span className="text-[#555555]">{pkt.from}➔{pkt.to}</span>
                            <span className={`font-semibold ${
                              pkt.type === "offer" ? "text-purple-400" : pkt.type === "answer" ? "text-cyan-400" : "text-emerald-400"
                            }`}>
                              {pkt.type}
                            </span>
                          </div>
                          {pkt.candidate && (
                            <span className="text-[9px] text-[#666666] uppercase">{pkt.candidate.type}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="col-span-7 h-full overflow-y-auto rounded-[6px] border border-[#1e1e1e] bg-[#0d0d0d] p-2 text-[10px] font-mono text-[#a1a1a1] space-y-1">
                    {activePacket ? (
                      <>
                        <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-1 text-[#ededed]">
                          <span className="font-semibold uppercase tracking-wider">{activePacket.summary}</span>
                          <span className="rounded bg-[#1a1a1a] px-1 py-0.2 text-[9px] text-cyan-300">
                            {activePacket.from} ➔ {activePacket.to}
                          </span>
                        </div>

                        {activePacket.candidate && (
                          <div className="space-y-1 pt-1 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-[#666666]">Candidate Type:</span>
                              <span className="font-semibold text-emerald-400 uppercase">{activePacket.candidate.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#666666]">Socket:</span>
                              <span className="text-[#ededed]">{activePacket.candidate.address}:{activePacket.candidate.port}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#666666]">Transport:</span>
                              <span className="text-[#ededed]">{activePacket.candidate.protocol.toUpperCase()}</span>
                            </div>
                            <p className="text-[9px] text-[#777777] pt-1 leading-normal border-t border-[#1a1a1a]">
                              {activePacket.candidate.type === "host" && "Direct LAN interface (Local Wi-Fi). Fastest path between peers on same subnet."}
                              {activePacket.candidate.type === "srflx" && "Server Reflexive (STUN). Public IP discovered outside the local NAT firewall."}
                              {activePacket.candidate.type === "relay" && "TURN Relay. Tunnel used when direct peer-to-peer connection is blocked by firewall."}
                            </p>
                          </div>
                        )}

                        {activePacket.sdpSnippet && (
                          <div className="pt-1">
                            <span className="text-[#666666] block mb-1">SDP Body Preview:</span>
                            <pre className="text-[9px] leading-tight text-[#888888] whitespace-pre-wrap font-mono max-h-16 overflow-y-auto bg-black p-1.5 rounded border border-[#1a1a1a]">
                              {activePacket.sdpSnippet}
                            </pre>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#555555] italic">
                        Trigger an offer or gather candidates to inspect decoded payloads
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 5 & 6: PEER B MONITOR & DATACHANNEL PIPE (Right Flank) */}
            <div className="col-span-12 lg:col-span-3 row-span-12 flex flex-col gap-2.5 h-full min-h-0">
              {/* CARD 5: PEER B */}
              <div className="h-[50%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Server className="h-4 w-4 text-[#a1a1a1]" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#ededed]">Peer B (Callee)</span>
                    </div>
                    <span
                      data-testid="peer-b-state"
                      className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-medium border ${
                        peerBConnectionState === "connected"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-[#141414] text-[#a1a1a1] border-[#262626]"
                      }`}
                    >
                      {peerBConnectionState}
                    </span>
                  </div>

                  <div className="relative aspect-video w-full overflow-hidden rounded-[6px] border border-[#242424] bg-[#000000] flex items-center justify-center">
                    {remoteMediaStream ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 text-center p-3">
                        <Video className="h-5 w-5 text-[#404040]" />
                        <span className="text-[11px] font-mono text-[#666666]">Inbound Feed Inactive</span>
                      </div>
                    )}
                    {remoteMediaStream && (
                      <span className="absolute top-1.5 right-1.5 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400 border border-cyan-500/30">
                        Live Decoded
                      </span>
                    )}
                  </div>

                  <div className="rounded-[6px] border border-[#1e1e1e] bg-[#121212]/60 p-2 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[#888888]">
                      <span>Role:</span>
                      <span className="text-[#ededed]">Answerer</span>
                    </div>
                    <div className="flex justify-between text-[#888888]">
                      <span>Answer:</span>
                      <span className="text-[#ededed]">{sdpAnswer ? "Accepted (VP8)" : "Awaiting Offer"}</span>
                    </div>
                    <div className="flex justify-between text-[#888888]">
                      <span>Security:</span>
                      <span className="text-[#ededed]">DTLS-SRTP AES_128</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-[#1e1e1e] flex items-center justify-between text-[11px] font-mono text-[#777777]">
                  <span>Inbound Candidates:</span>
                  <span className="text-[#ededed] font-semibold">{gatheredCandidates.filter(c => c.peer === 'B').length} gathered</span>
                </div>
              </div>

              {/* CARD 6: LIVE DATACHANNEL PIPE */}
              <div className="h-[50%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#ededed]">DataChannel Pipe</span>
                  </div>
                  <span className="rounded bg-[#141414] px-1.5 py-0.5 text-[10px] font-mono text-cyan-400 border border-[#242424]">
                    SCTP over DTLS
                  </span>
                </div>

                <div
                  data-testid="dc-log"
                  className="flex-1 min-h-0 my-2 overflow-y-auto rounded-[6px] border border-[#1e1e1e] bg-[#000000] p-2 space-y-1.5 text-xs font-mono"
                >
                  {dataChannelMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-[#444444] italic">
                      DataChannel idle. Send a message below.
                    </div>
                  ) : (
                    dataChannelMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`rounded-[4px] p-1.5 text-[11px] border leading-tight ${
                          msg.from === "A"
                            ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-300 ml-4"
                            : "border-cyan-500/20 bg-cyan-950/20 text-cyan-300 mr-4"
                        }`}
                      >
                        <div className="flex justify-between text-[9px] text-[#666666] mb-0.5">
                          <span>Peer {msg.from}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <span>{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-1.5 border-t border-[#1e1e1e] space-y-1.5">
                  <span className="text-[11px] font-mono text-[#888888] block">Peer B Reply to Peer A</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Reply to Peer A..."
                      value={messageInputB}
                      onChange={(e) => setMessageInputB(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendB()}
                      data-testid="input-msg-b"
                      className="h-7 flex-1 rounded-[4px] border border-[#242424] bg-[#050505] px-2 text-xs font-mono text-[#ededed] placeholder:text-[#555555] focus:border-[#404040] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendB}
                      data-testid="btn-send-b"
                      className="inline-flex h-7 items-center justify-center rounded-[4px] border border-[#242424] bg-[#141414] px-2.5 text-xs text-[#ededed] hover:border-[#404040] transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
