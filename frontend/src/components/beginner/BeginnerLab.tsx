import React, { useEffect, useState, useRef } from "react";
import { useLabStore } from "@/store/labStore";
import { loopbackService } from "@/services/loopback.service";
import { createSyntheticMediaStream } from "@/utils/media.utils";
import {
  LabCard,
  RouteBadge,
  StepHeader,
  ConceptDefinition,
  DiagramNode,
  Keycap,
  EmptyState,
} from "@/components/design-system";
import {
  Laptop,
  Send,
  RefreshCw,
  Code2,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  Video,
  Radio,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

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
  const [showRawData, setShowRawData] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Step 4 NAT Simulation State
  const [natPacketState, setNatPacketState] = useState<"idle" | "translating" | "pinholed">("idle");

  // Video Refs for Step 5
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const syntheticMediaStopRef = useRef<(() => void) | null>(null);

  const handleStepChange = (newStep: number) => {
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    setShowRawData(false);
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

  const handleStartHandshake = async () => {
    await loopbackService.startOfferFlow();
  };

  const handleStepMessage = async () => {
    await loopbackService.stepNext();
  };

  const handleSendA = () => {
    if (!messageInputA.trim()) return;
    loopbackService.sendMessage("A", messageInputA.trim());
    setMessageInputA("");
  };

  const handleSendB = () => {
    if (!messageInputB.trim()) return;
    loopbackService.sendMessage("B", messageInputB.trim());
    setMessageInputB("");
  };

  // Step 4 NAT packet trigger
  const handleTriggerNatSimulation = () => {
    setNatPacketState("translating");
    setTimeout(() => {
      setNatPacketState("pinholed");
    }, 1200);
  };

  // Step 5 Media capture trigger
  const handleRequestMedia = async () => {
    setMediaStatus("requesting");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        loopbackService.attachMediaStream(stream);
        setMediaStatus("live");
      } else {
        throw new Error("No mediaDevices");
      }
    } catch {
      // Fallback to synthetic animated canvas stream
      const { stream, stop } = createSyntheticMediaStream(320, 240, "Local Peer A Camera");
      syntheticMediaStopRef.current = stop;
      loopbackService.attachMediaStream(stream);
      setMediaStatus("synthetic");
    }
  };

  // Step content configuration per TEACHING_STANDARD.md
  const stepConfigs = [
    // Step 1: Signaling
    {
      title: "The Matchmaker (Signaling)",
      question: "If WebRTC is peer-to-peer, why do we need a server at all to get started?",
      analogy: "You can have a private phone call with anyone in the world, but you first need a mutual friend to give you each other's phone number.",
      whatHappened: "Peer A and Peer B can't connect directly until they know how to address each other. The signaling server is simply a messenger that passes their initial contact notes.",
      quiz: {
        question: "Does audio or video ever flow through the signaling server?",
        options: [
          { id: 0, text: "Yes, all media flows through the signaling server." },
          { id: 1, text: "No, the signaling server only exchanges setup notes; media flows peer-to-peer." },
          { id: 2, text: "Yes, but only audio." },
        ],
        correctId: 1,
        explanation: "Correct! The signaling server only brokers initial contact. All audio, video, and data channel packets travel directly between peers once connected.",
      },
    },
    // Step 2: SDP Offer / Answer
    {
      title: "The Business Card (SDP Offer / Answer)",
      question: "How do two browsers agree on video quality and audio formats before sending media?",
      analogy: "Before starting a business deal, two people exchange business cards detailing what languages they speak and what contracts they accept.",
      whatHappened: "Peer A listed its supported video formats and media channels in an SDP text document. Peer B reviewed it, matched compatible formats, and sent back its agreement (the Answer).",
      quiz: {
        question: "What happens if Peer A only supports VP8 video, but Peer B only supports H.264?",
        options: [
          { id: 0, text: "The browsers will automatically invent a new video codec." },
          { id: 1, text: "Negotiation fails because there is no common codec listed on both business cards." },
          { id: 2, text: "The video stream converts to text automatically." },
        ],
        correctId: 1,
        explanation: "Correct! If neither peer shares a common codec, WebRTC negotiation fails because neither side can decode what the other produces.",
      },
    },
    // Step 3: ICE Candidates
    {
      title: "Finding the Path (ICE Candidates)",
      question: "How do browsers find the actual network route to reach each other through home Wi-Fi and mobile networks?",
      analogy: "Imagine writing down every possible address where someone might reach you: your home Wi-Fi address, your public street address, and an office mailbox.",
      whatHappened: "Candidates are gathered after setLocalDescription, and only for a media section or data channel in the offer. This lab adds a data channel before creating the offer so there is something to connect.",
      quiz: {
        question: "Which ICE candidate type represents your computer's private IP on your local Wi-Fi router?",
        options: [
          { id: 0, text: "host" },
          { id: 1, text: "srflx" },
          { id: 2, text: "relay" },
        ],
        correctId: 0,
        explanation: "Correct! 'host' candidates are private LAN IP addresses bound directly to your local network interface card (NIC).",
      },
    },
    // Step 4: NAT Basics
    {
      title: "The Apartment Front Desk (NAT Basics)",
      question: "Why can't another computer on the internet simply connect directly to my private home IP (192.168.x.x)?",
      analogy: "Your home router is like an apartment building front desk: all residents share one street address, and outside visitors can't walk directly into Apartment 4B without the front desk opening a path.",
      whatHappened: "Your Wi-Fi router performs NAT (Network Address Translation). It rewrites your private packet header so it appears on the internet with the router's public IP and a temporary port.",
      quiz: {
        question: "What is the main role of a STUN server during NAT traversal?",
        options: [
          { id: 0, text: "It compresses the video so it fits through narrow wires." },
          { id: 1, text: "It acts like a mirror, telling your browser what public IP and port your router assigned to you." },
          { id: 2, text: "It encrypts your passwords." },
        ],
        correctId: 1,
        explanation: "Correct! A STUN server inspects the source address on incoming UDP packets and reflects back your external public IP and port.",
      },
    },
    // Step 5: Media Tracks
    {
      title: "Hooking up the Cameras (Media Streams & Tracks)",
      question: "How does raw video from a webcam get converted into packets and transferred over the connection?",
      analogy: "Think of a media stream as an audio/video cable with multiple color-coded wires (tracks): one wire for microphone audio and one for camera video.",
      whatHappened: "The browser captured media tracks via getUserMedia, encoded them into encrypted SRTP packets, and piped them directly through the negotiated P2P route.",
      quiz: {
        question: "If a learner denies camera access on their laptop, can WebRTC still test video transmission?",
        options: [
          { id: 0, text: "No, WebRTC crashes if no physical webcam is plugged in." },
          { id: 1, text: "Yes, any canvas animation or synthetic stream can be captured as a real MediaStream using canvas.captureStream()." },
          { id: 2, text: "Only if they use Firefox." },
        ],
        correctId: 1,
        explanation: "Correct! Any HTML5 canvas can generate a standard 30 FPS MediaStream without requiring physical webcam hardware or user permissions.",
      },
    },
    // Step 6: Data Channels
    {
      title: "The Direct Wire (Data Channels)",
      question: "Can WebRTC send arbitrary data like chat, game positions, or files without using audio/video?",
      analogy: "A Data Channel is a private pneumatic dispatch tube running directly between two peers for instant letter delivery.",
      whatHappened: "Unlike WebSockets which route every message through a central server, WebRTC Data Channels use SCTP running over DTLS to send packets directly between the two browsers with sub-millisecond local latency.",
      quiz: {
        question: "What protocol powers WebRTC DataChannels under the hood?",
        options: [
          { id: 0, text: "Plain HTTP/1.1" },
          { id: 1, text: "SCTP over DTLS" },
          { id: 2, text: "FTP" },
        ],
        correctId: 1,
        explanation: "Correct! SCTP (Stream Control Transmission Protocol) provides multiplexed, reliable or unreliable message streams over an encrypted DTLS tunnel.",
      },
    },
  ];

  const currentConfig = stepConfigs[currentStep - 1];

  return (
    <div className="min-h-screen bg-[#000000] text-[#ededed] font-sans selection:bg-[#262626] selection:text-[#ededed] p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Global Toolbar & Mode Bar */}
        <div className="flex items-center justify-between border-b border-[#242424] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#262626] bg-[#121212] font-mono text-xs text-[#ededed]">
              ▲
            </span>
            <span className="text-sm font-medium text-[#ededed]">WebRTC Learning Lab</span>
            <span className="text-xs text-[#666666]">/</span>
            <span className="text-xs font-mono text-[#a1a1a1]">Beginner Walkthrough</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              data-testid="btn-pause-toggle"
              className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-mono font-medium border transition-colors ${
                isPaused
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-[#242424] bg-[#121212] text-[#ededed] hover:border-[#404040]"
              }`}
            >
              <span>{isPaused ? "⏸️ Mailbox Paused" : "▶️ Real-Time Delivery"}</span>
            </button>

            <button
              type="button"
              onClick={() => loopbackService.reset()}
              data-testid="btn-reset"
              className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-2.5 text-xs text-[#a1a1a1] hover:border-[#404040] hover:text-[#ededed] transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Part 1: Step Header Navigation */}
        <StepHeader
          currentStep={currentStep}
          totalSteps={6}
          categoryLabel="Beginner Guide"
          title={currentConfig.title}
          subtitle={currentConfig.question}
          onPrev={() => handleStepChange(Math.max(1, currentStep - 1))}
          onNext={() => handleStepChange(Math.min(6, currentStep + 1))}
          disablePrev={currentStep <= 1}
          disableNext={currentStep >= 6}
        />

        {/* Hidden button hooks for automated test compatibility */}
        <div className="hidden">
          <button data-testid="btn-back" onClick={() => handleStepChange(Math.max(1, currentStep - 1))} />
          <button data-testid="btn-next" onClick={() => handleStepChange(Math.min(6, currentStep + 1))} />
        </div>

        {/* Part 2: Analogy Callout Card */}
        <LabCard sectionLabel="Mental Model & Analogy" className="p-6">
          <ConceptDefinition
            question={currentConfig.question}
            analogy={currentConfig.analogy}
          />
        </LabCard>

        {/* Part 3: Live Interactive Demonstration */}
        <LabCard sectionLabel="Live Simulation & Network Nodes" className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#242424]/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-[#a1a1a1]">Simulation Mode:</span>
              <RouteBadge variant="simulation">In-Memory Mailbox</RouteBadge>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[#a1a1a1]">Mailbox Queue: <strong className="text-[#ededed]">{mailbox.length}</strong></span>
            </div>
          </div>

          {/* Node Diagram Canvas (Always rendered for consistent connection insight) */}
          <div className="rounded-[8px] border border-[#242424] bg-[#000000] p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Peer A Node */}
              <DiagramNode
                title="Peer A"
                subtitle="Local (Caller)"
                state={peerAConnectionState === "connected" ? "connected" : "idle"}
                icon={<Laptop className="h-4 w-4 text-[#a1a1a1]" />}
                badge={
                  <span
                    data-testid="peer-a-state"
                    className={`rounded-full px-2 py-0.5 text-xs font-mono font-medium border ${
                      peerAConnectionState === "connected"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-[#121212] text-[#a1a1a1] border-[#242424]"
                    }`}
                  >
                    {peerAConnectionState}
                  </span>
                }
              >
                <div className="text-xs text-[#a1a1a1] space-y-1">
                  <div>DataChannel: <span className="font-mono text-[#ededed]">lab-channel</span></div>
                  <div>Offer Status: <span className="font-mono text-[#ededed]">{sdpOffer ? "Created" : "Pending"}</span></div>
                </div>

                {/* Quick Data Channel Messaging for Peer A (Steps 1-5) */}
                {currentStep !== 6 && (
                  <div className="mt-3 pt-2.5 border-t border-[#242424]/60">
                    <span className="text-[11px] font-mono text-[#a1a1a1] block mb-1">Data Channel (Send to B)</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Message to Peer B..."
                        value={messageInputA}
                        onChange={(e) => setMessageInputA(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendA()}
                        data-testid="input-msg-a"
                        className="h-8 flex-1 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-2 text-xs font-mono text-[#ededed] focus:border-[#404040] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendA}
                        data-testid="btn-send-a"
                        className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#242424] bg-[#121212] px-2.5 text-xs font-medium text-[#ededed] hover:border-[#404040] transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </DiagramNode>

              {/* Peer B Node */}
              <DiagramNode
                title="Peer B"
                subtitle="Remote (Callee)"
                state={peerBConnectionState === "connected" ? "connected" : "idle"}
                icon={<Laptop className="h-4 w-4 text-[#a1a1a1]" />}
                badge={
                  <span
                    data-testid="peer-b-state"
                    className={`rounded-full px-2 py-0.5 text-xs font-mono font-medium border ${
                      peerBConnectionState === "connected"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-[#121212] text-[#a1a1a1] border-[#242424]"
                    }`}
                  >
                    {peerBConnectionState}
                  </span>
                }
              >
                <div className="text-xs text-[#a1a1a1] space-y-1">
                  <div>DataChannel: <span className="font-mono text-[#ededed]">{peerBConnectionState === "connected" ? "Open" : "Listening"}</span></div>
                  <div>Answer Status: <span className="font-mono text-[#ededed]">{sdpAnswer ? "Created" : "Pending"}</span></div>
                </div>

                {/* Quick Data Channel Messaging for Peer B (Steps 1-5) */}
                {currentStep !== 6 && (
                  <div className="mt-3 pt-2.5 border-t border-[#242424]/60">
                    <span className="text-[11px] font-mono text-[#a1a1a1] block mb-1">Data Channel (Send to A)</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Message to Peer A..."
                        value={messageInputB}
                        onChange={(e) => setMessageInputB(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendB()}
                        data-testid="input-msg-b"
                        className="h-8 flex-1 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-2 text-xs font-mono text-[#ededed] focus:border-[#404040] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendB}
                        data-testid="btn-send-b"
                        className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#242424] bg-[#121212] px-2.5 text-xs font-medium text-[#ededed] hover:border-[#404040] transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </DiagramNode>
            </div>

            {/* STEP 1 & 2 ACTIONS: Handshake Initiation & Mailbox Stepping */}
            {(currentStep === 1 || currentStep === 2) && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {!sdpOffer && (
                  <button
                    type="button"
                    onClick={handleStartHandshake}
                    data-testid="btn-start-offer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[#ededed] px-6 text-sm font-medium text-black transition-colors hover:bg-white active:scale-[0.99] w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4" />
                    <span>1. Create Offer &amp; Data Channel</span>
                    <Keycap className="bg-[#e5e5e5] border-[#d4d4d4] text-black">Space</Keycap>
                  </button>
                )}

                {mailbox.length > 0 && (
                  <button
                    type="button"
                    onClick={handleStepMessage}
                    data-testid="btn-step-msg"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] border border-[#242424] bg-[#121212] px-6 text-sm font-medium text-[#ededed] hover:border-[#404040] hover:bg-[#171717] transition-colors w-full sm:w-auto"
                  >
                    <span>Step Next Message ({mailbox.length})</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {peerAConnectionState === "connected" && (
                  <div className="flex h-11 items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Peer-to-peer connection established!</span>
                  </div>
                )}
              </div>
            )}

            {/* Global Data Channel Messages Stream (Available across steps when active) */}
            {dataChannelMessages.length > 0 && currentStep !== 6 && (
              <div className="rounded-[6px] border border-[#242424] bg-[#0a0a0a] p-3 space-y-1.5 font-mono text-xs" data-testid="dc-log">
                <span className="text-[11px] text-[#a1a1a1] uppercase tracking-wider block">Live DataChannel Packets:</span>
                {dataChannelMessages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className={msg.from === "A" ? "text-cyan-400 font-bold" : "text-emerald-400 font-bold"}>
                      Peer {msg.from}:
                    </span>
                    <span className="text-[#ededed]">{msg.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 3 ACTIONS: Gathered Candidate Matrix */}
            {currentStep === 3 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <span className="text-xs font-mono font-medium text-[#ededed] uppercase">
                    Gathered Candidates ({gatheredCandidates.length})
                  </span>
                  <div className="flex gap-2">
                    <RouteBadge variant="host">host = LAN</RouteBadge>
                    <RouteBadge variant="srflx">srflx = STUN</RouteBadge>
                    <RouteBadge variant="relay">relay = TURN</RouteBadge>
                  </div>
                </div>

                {gatheredCandidates.length === 0 ? (
                  <EmptyState
                    icon={<Radio className="h-5 w-5 text-[#a1a1a1]" />}
                    message="No ICE candidates discovered yet. Initiate the offer flow to begin local network probing."
                    actionText="Initiate Offer"
                    onAction={handleStartHandshake}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {gatheredCandidates.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-[6px] border border-[#242424] bg-[#0a0a0a] p-3 text-xs font-mono space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#ededed]">Peer {c.peer}</span>
                          <RouteBadge variant={c.type as "host" | "srflx" | "relay"}>{c.type}</RouteBadge>
                        </div>
                        <p className="text-[#a1a1a1] truncate">
                          {c.address}:{c.port} ({c.protocol.toUpperCase()})
                        </p>
                        {c.isMdns && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                            <ShieldCheck className="h-3 w-3 shrink-0" />
                            <span>RFC 8837 mDNS Privacy (.local masked IP)</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4 ACTIONS: NAT Basics Interactive Port Mapping Canvas */}
            {currentStep === 4 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <span className="text-xs font-mono text-cyan-400 uppercase font-medium">
                    [ILLUSTRATION: Educational Animation]
                  </span>
                  <span className="text-xs text-[#a1a1a1]">Pinhole Translation Flow</span>
                </div>

                <div className="rounded-[6px] border border-[#242424] bg-[#0a0a0a] p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-3 rounded border border-[#242424] bg-[#121212]">
                      <span className="text-[#a1a1a1] block mb-1">Local Device</span>
                      <span className="text-[#ededed] font-bold">192.168.1.10:5000</span>
                      <span className="text-[10px] text-[#666666] block mt-1">Private IP (LAN)</span>
                    </div>

                    <div className={`p-3 rounded border transition-colors ${
                      natPacketState === "translating"
                        ? "border-cyan-400 bg-cyan-950/20 text-cyan-300"
                        : "border-[#242424] bg-[#121212] text-[#ededed]"
                    }`}>
                      <span className="text-[#a1a1a1] block mb-1">Wi-Fi Router NAT</span>
                      <span className="font-bold">103.21.44.12:49152</span>
                      <span className="text-[10px] text-[#666666] block mt-1">Temporary Pinhole</span>
                    </div>

                    <div className="p-3 rounded border border-[#242424] bg-[#121212]">
                      <span className="text-[#a1a1a1] block mb-1">STUN / Peer Target</span>
                      <span className="text-[#ededed] font-bold">142.250.190.46:3478</span>
                      <span className="text-[10px] text-[#666666] block mt-1">Public Internet</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center pt-2 gap-3">
                    <button
                      type="button"
                      onClick={handleTriggerNatSimulation}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[#ededed] px-6 text-sm font-medium text-black transition-colors hover:bg-white active:scale-[0.99]"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Send Outbound Packet through NAT</span>
                    </button>

                    {natPacketState === "translating" && (
                      <p className="text-xs font-mono text-cyan-400 animate-pulse">
                        Router rewrites IP packet header and opens return pinhole...
                      </p>
                    )}

                    {natPacketState === "pinholed" && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Pinhole active! STUN server successfully reflected external address 103.21.44.12:49152.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 ACTIONS: Media Streams & Video Canvas */}
            {currentStep === 5 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <span className="text-xs font-mono text-[#a1a1a1] uppercase font-medium">
                    Media Stream Tracks (SRTP)
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={`h-2 w-2 rounded-full ${mediaStatus !== "idle" ? "bg-emerald-400" : "bg-[#666666]"}`} />
                    <span className="text-[#ededed] capitalize">{mediaStatus === "idle" ? "No Feed Active" : `${mediaStatus} Feed Active`}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Local Video */}
                  <div className="rounded-[6px] border border-[#242424] bg-[#0a0a0a] p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#ededed]">Peer A Local Preview</span>
                      <RouteBadge variant="host">Local Track</RouteBadge>
                    </div>
                    <div className="aspect-video w-full rounded bg-[#000000] border border-[#171717] overflow-hidden flex items-center justify-center">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${localMediaStream ? "block" : "hidden"}`}
                      />
                      {!localMediaStream && (
                        <div className="text-xs text-[#666666] font-mono flex flex-col items-center gap-1">
                          <Video className="h-6 w-6" />
                          <span>No stream attached</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remote Video */}
                  <div className="rounded-[6px] border border-[#242424] bg-[#0a0a0a] p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#ededed]">Peer B Received Feed</span>
                      <RouteBadge variant="srflx">Remote SRTP</RouteBadge>
                    </div>
                    <div className="aspect-video w-full rounded bg-[#000000] border border-[#171717] overflow-hidden flex items-center justify-center">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${remoteMediaStream ? "block" : "hidden"}`}
                      />
                      {!remoteMediaStream && (
                        <div className="text-xs text-[#666666] font-mono flex flex-col items-center gap-1">
                          <Video className="h-6 w-6" />
                          <span>Awaiting remote track</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleRequestMedia}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[6px] bg-[#ededed] px-6 text-sm font-medium text-black transition-colors hover:bg-white active:scale-[0.99]"
                  >
                    <Video className="h-4 w-4" />
                    <span>Request Camera / Synthetic Feed</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6 ACTIONS: Data Channel Interactive Chat */}
            {currentStep === 6 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <span className="text-xs font-mono text-[#a1a1a1] uppercase font-medium">
                    Direct Wire: RTCDataChannel (SCTP)
                  </span>
                  <RouteBadge variant="host">Local P2P</RouteBadge>
                </div>

                {/* Chat Log */}
                <div
                  className="rounded-[6px] border border-[#242424] bg-[#0a0a0a] p-4 max-h-40 overflow-y-auto space-y-2 font-mono text-xs"
                  data-testid="dc-log"
                >
                  {dataChannelMessages.length === 0 ? (
                    <p className="text-[#666666] italic text-center py-4">
                      No DataChannel messages transmitted yet. Type below to send instantaneous packets.
                    </p>
                  ) : (
                    dataChannelMessages.map((msg, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={msg.from === "A" ? "text-cyan-400 font-bold" : "text-emerald-400 font-bold"}>
                          Peer {msg.from}:
                        </span>
                        <span className="text-[#ededed]">{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Bars for Both Peers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Peer A Input */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-[#a1a1a1]">Send from Peer A</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Message from Peer A..."
                        value={messageInputA}
                        onChange={(e) => setMessageInputA(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendA()}
                        data-testid="input-msg-a"
                        className="h-10 flex-1 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-3 font-mono text-xs text-[#ededed] focus:border-[#404040] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendA}
                        data-testid="btn-send-a"
                        className="inline-flex h-10 items-center justify-center rounded-[6px] border border-[#242424] bg-[#121212] px-3 text-xs font-medium text-[#ededed] hover:border-[#404040] transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  {/* Peer B Input */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-[#a1a1a1]">Send from Peer B</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Message from Peer B..."
                        value={messageInputB}
                        onChange={(e) => setMessageInputB(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendB()}
                        data-testid="input-msg-b"
                        className="h-10 flex-1 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-3 font-mono text-xs text-[#ededed] focus:border-[#404040] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendB}
                        data-testid="btn-send-b"
                        className="inline-flex h-10 items-center justify-center rounded-[6px] border border-[#242424] bg-[#121212] px-3 text-xs font-medium text-[#ededed] hover:border-[#404040] transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </LabCard>

        {/* Part 4: What Just Happened? */}
        <LabCard sectionLabel="Plain-Words Explanation" className="p-6">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#a1a1a1] block">
              What Just Happened:
            </span>
            <p className="text-base text-[#ededed] leading-relaxed">
              {currentConfig.whatHappened}
            </p>
          </div>
        </LabCard>

        {/* Part 5: Progressive Disclosure: Show Real Data */}
        <LabCard sectionLabel="Technical Telemetry" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#a1a1a1]" />
              <span className="text-sm font-medium text-[#ededed]">Inspect Protocol Payloads</span>
              <span className="text-xs text-[#666666]">(Progressive Disclosure)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowRawData(!showRawData)}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-3 text-xs font-medium text-[#ededed] hover:border-[#404040] transition-colors"
            >
              {showRawData ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{showRawData ? "Hide Real Data" : "Show Real Data"}</span>
            </button>
          </div>

          {showRawData && (
            <div className="pt-2">
              {currentStep === 1 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-[#a1a1a1]">Signaling WebSocket Packet (JSON)</span>
                  <pre className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 font-mono text-xs text-[#a1a1a1] overflow-x-auto">
                    {JSON.stringify({ type: "USER_ONLINE", from: "peer-a", transport: "wss://loopback" }, null, 2)}
                  </pre>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-[#a1a1a1]">SDP Offer ({sdpOffer ? sdpOffer.length : 0} chars)</span>
                    <pre className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 font-mono text-xs text-[#a1a1a1] max-h-48 overflow-y-auto">
                      {sdpOffer || "No offer created yet."}
                    </pre>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-[#a1a1a1]">SDP Answer ({sdpAnswer ? sdpAnswer.length : 0} chars)</span>
                    <pre className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 font-mono text-xs text-[#a1a1a1] max-h-48 overflow-y-auto">
                      {sdpAnswer || "No answer created yet."}
                    </pre>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-[#a1a1a1]">Raw SDP Attribute Candidate Strings</span>
                  <pre className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 font-mono text-xs text-[#a1a1a1] max-h-48 overflow-y-auto">
                    {gatheredCandidates.length > 0
                      ? gatheredCandidates.map((c) => `a=candidate:${c.raw}`).join("\n")
                      : "No candidates gathered yet."}
                  </pre>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-[#a1a1a1]">NAT Mapping Table Inspection</span>
                  <pre className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 font-mono text-xs text-[#a1a1a1]">
                    {`[ROUTER NAT TABLE]
LAN Source:      192.168.1.10:5000 (Private IP)
NAT Public Port: 103.21.44.12:49152 (External Pinhole)
Protocol:        UDP
State:           ESTABLISHED
Timeout:         30s`}
                  </pre>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-[#a1a1a1]">MediaStreamTrack Parameters</span>
                  <pre className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 font-mono text-xs text-[#a1a1a1]">
                    {localMediaStream
                      ? localMediaStream.getTracks().map((t) => `Track ID: ${t.id}\nKind: ${t.kind}\nLabel: ${t.label}\nEnabled: ${t.enabled}\nReadyState: ${t.readyState}`).join("\n---\n")
                      : "No active media stream tracks attached."}
                  </pre>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-[#a1a1a1]">RTCDataChannel Parameters (SCTP)</span>
                  <pre className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 font-mono text-xs text-[#a1a1a1]">
                    {`label: "lab-channel"
ordered: true
maxRetransmits: null
protocol: "sctp"
binaryType: "arraybuffer"
readyState: "${peerAConnectionState === "connected" ? "open" : "connecting"}"`}
                  </pre>
                </div>
              )}
            </div>
          )}
        </LabCard>

        {/* Part 6: Check Yourself Quiz (Soft-Gated) */}
        <LabCard sectionLabel="Comprehension Check" className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#a1a1a1]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#ededed] font-medium">
              Check Yourself
            </span>
          </div>

          <p className="text-base text-[#ededed]">
            {currentConfig.quiz.question}
          </p>

          <div className="space-y-2">
            {currentConfig.quiz.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelectedQuizOption(option.id);
                  setQuizSubmitted(true);
                }}
                className={`w-full text-left rounded-[6px] p-3.5 text-sm transition-colors border ${
                  selectedQuizOption === option.id
                    ? option.id === currentConfig.quiz.correctId
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/40 text-rose-300"
                    : "bg-[#0a0a0a] border-[#242424] hover:border-[#404040] text-[#ededed]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-[#333333] bg-[#121212] text-xs font-mono text-[#a1a1a1]">
                    {option.id === 0 ? "A" : option.id === 1 ? "B" : "C"}
                  </span>
                  <span>{option.text}</span>
                </div>
              </button>
            ))}
          </div>

          {quizSubmitted && (
            <div
              className={`rounded-[6px] p-3.5 text-sm border ${
                selectedQuizOption === currentConfig.quiz.correctId
                  ? "bg-[#121212] border-emerald-500/30 text-emerald-300"
                  : "bg-[#121212] border-[#242424] text-[#a1a1a1]"
              }`}
            >
              {selectedQuizOption === currentConfig.quiz.correctId ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{currentConfig.quiz.explanation}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span>That's not quite right. Review the analogy above and give it another try.</span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuizOption(currentConfig.quiz.correctId)}
                    className="shrink-0 text-xs font-mono text-[#ededed] underline hover:text-white"
                  >
                    Explain &amp; Continue
                  </button>
                </div>
              )}
            </div>
          )}
        </LabCard>
      </div>
    </div>
  );
};
