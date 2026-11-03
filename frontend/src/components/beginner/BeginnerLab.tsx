import React, { useEffect, useState, useRef } from "react";
import { useLabStore } from "@/store/labStore";
import { loopbackService } from "@/services/loopback.service";
import { createSyntheticMediaStream } from "@/utils/media.utils";
import {
  Stepper,
  type StepItem,
  SpecularButton,
  MagicBentoGrid,
  MagicBentoCard,
  CallChip,
  type CallChipState,
} from "@/components/react-bits";
import {
  LabCard,
  RouteBadge,
  ConceptDefinition,
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
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

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

  // CallChip Live Action Timer State
  const [callChipLabel, setCallChipLabel] = useState("ready_for_handshake");
  const [callChipState, setCallChipState] = useState<CallChipState>("idle");
  const [callChipDuration, setCallChipDuration] = useState<number | undefined>(undefined);

  // In-flight moving packet animation state
  const [inFlightPacket, setInFlightPacket] = useState<{
    type: string;
    from: string;
    to: string;
  } | null>(null);

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

  // Handle Offer Creation with CallChip feedback and in-flight animation
  const handleStartHandshake = async () => {
    setCallChipLabel("generating_sdp_offer_and_datachannel");
    setCallChipState("running");

    setInFlightPacket({ type: "OFFER", from: "Peer A", to: "Mailbox" });

    setTimeout(async () => {
      await loopbackService.startOfferFlow();
      setInFlightPacket(null);
      setCallChipLabel("offer_queued_in_mailbox");
      setCallChipState("success");
      setCallChipDuration(800);
    }, 700);
  };

  // Handle Stepping Next Message through Mailbox
  const handleStepMessage = async () => {
    if (mailbox.length === 0) return;
    const nextMsg = mailbox[0];

    setCallChipLabel(`delivering_${nextMsg.type}_to_peer_${nextMsg.to}`);
    setCallChipState("running");
    setInFlightPacket({ type: nextMsg.type.toUpperCase(), from: "Mailbox", to: `Peer ${nextMsg.to}` });

    setTimeout(async () => {
      await loopbackService.stepNext();
      setInFlightPacket(null);
      setCallChipLabel(`${nextMsg.type}_delivered_to_peer_${nextMsg.to}`);
      setCallChipState("success");
      setCallChipDuration(650);
    }, 600);
  };

  const handleSendA = () => {
    if (!messageInputA.trim()) return;
    loopbackService.sendMessage("A", messageInputA.trim());
    setMessageInputA("");
    setCallChipLabel("sctp_packet_sent_to_peer_b");
    setCallChipState("success");
    setCallChipDuration(120);
  };

  const handleSendB = () => {
    if (!messageInputB.trim()) return;
    loopbackService.sendMessage("B", messageInputB.trim());
    setMessageInputB("");
    setCallChipLabel("sctp_packet_sent_to_peer_a");
    setCallChipState("success");
    setCallChipDuration(120);
  };

  // Step 4 NAT packet trigger with CallChip feedback
  const handleTriggerNatSimulation = () => {
    setNatPacketState("translating");
    setCallChipLabel("nat_rewriting_packet_header");
    setCallChipState("running");

    setTimeout(() => {
      setNatPacketState("pinholed");
      setCallChipLabel("pinhole_active_103.21.44.12:49152");
      setCallChipState("success");
      setCallChipDuration(1100);
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

  // Step curriculum configuration per TEACHING_STANDARD.md
  const stepConfigs = [
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
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Global Toolbar & Mode Bar */}
        <div className="flex items-center justify-between border-b border-[#242424] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#262626] bg-[#121212] font-mono text-xs text-[#ededed]">
              ▲
            </span>
            <span className="text-sm font-medium text-[#ededed]">WebRTC Learning Lab</span>
            <span className="text-xs text-[#666666]">/</span>
            <span className="text-xs font-mono text-[#a1a1a1]">Interactive Simulator</span>
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

        {/* 1. REACT BITS STEPPER & HEADER */}
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <Stepper
              steps={stepperItems}
              currentStep={currentStep}
              onStepChange={handleStepChange}
            />

            <div className="flex items-center gap-1.5 ml-3 shrink-0">
              <button
                type="button"
                data-testid="btn-back"
                onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
                disabled={currentStep <= 1}
                aria-label="Back"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#242424] bg-[#0a0a0a] text-[#ededed] hover:border-[#404040] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <button
                type="button"
                data-testid="btn-next"
                onClick={() => handleStepChange(Math.min(6, currentStep + 1))}
                disabled={currentStep >= 6}
                aria-label="Next"
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-[6px] border border-[#242424] bg-[#ededed] text-[#000000] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 2. REACT BITS CALL CHIP (Real-Time Operation Indicator) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#666666] uppercase">Telemetry:</span>
              <CallChip
                label={callChipLabel}
                state={callChipState}
                durationMs={callChipDuration}
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1a1]">
              <span>In-Memory Mailbox:</span>
              <RouteBadge variant={mailbox.length > 0 ? "checking" : "neutral"}>
                {mailbox.length} Queued
              </RouteBadge>
            </div>
          </div>
        </header>

        {/* Step Title & Guiding Question */}
        <div className="pt-1">
          <h1 className="text-2xl font-medium tracking-tight text-[#ededed] sm:text-3xl">
            {currentConfig.title}
          </h1>
          <p className="mt-2 text-base text-[#a1a1a1]">
            {currentConfig.question}
          </p>
        </div>

        {/* Analogy Callout Card */}
        <LabCard sectionLabel="Mental Model & Analogy" className="p-6">
          <ConceptDefinition
            question={currentConfig.question}
            analogy={currentConfig.analogy}
          />
        </LabCard>

        {/* 3. REACT BITS MAGIC BENTO GRID (Interactive Live Simulation) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium tracking-wider text-[#a1a1a1] uppercase">
              Live Simulation Stage (Magic Bento Deck)
            </span>
            <span className="text-xs font-mono text-[#666666]">
              Move cursor across cards to test dynamic edge light
            </span>
          </div>

          <MagicBentoGrid>
            {/* Bento 1: PEER A NODE (4 cols) */}
            <MagicBentoCard
              className="md:col-span-4"
              sectionLabel="Peer A (Caller)"
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
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#ededed]">
                  <Laptop className="h-4 w-4 text-[#a1a1a1]" />
                  <span>Local Browser Engine</span>
                </div>

                <div className="space-y-1 text-[#a1a1a1] font-mono text-[11px]">
                  <div>Channel: <span className="text-[#ededed]">lab-channel</span></div>
                  <div>Offer: <span className="text-[#ededed]">{sdpOffer ? "Created" : "Pending"}</span></div>
                  <div>Role: <span className="text-[#ededed]">Offerer</span></div>
                </div>

                {/* SpecularButton: Trigger Handshake from Peer A */}
                {(currentStep === 1 || currentStep === 2) && !sdpOffer && (
                  <div className="pt-2">
                    <SpecularButton
                      variant="primary"
                      onClick={handleStartHandshake}
                      data-testid="btn-start-offer"
                      className="w-full"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Create Offer</span>
                      <Keycap className="bg-[#e5e5e5] border-[#d4d4d4] text-black">Space</Keycap>
                    </SpecularButton>
                  </div>
                )}

                {/* Quick DataChannel Input for Peer A (Steps 1-5) */}
                {currentStep !== 6 && (
                  <div className="mt-3 pt-2.5 border-t border-[#242424]/60">
                    <span className="text-[11px] font-mono text-[#a1a1a1] block mb-1">Send to Peer B</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Message to B..."
                        value={messageInputA}
                        onChange={(e) => setMessageInputA(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendA()}
                        data-testid="input-msg-a"
                        className="h-8 flex-1 rounded-[6px] border border-[#242424] bg-[#000000] px-2 text-xs font-mono text-[#ededed] focus:border-[#404040] outline-none"
                      />
                      <SpecularButton
                        variant="secondary"
                        onClick={handleSendA}
                        data-testid="btn-send-a"
                        className="h-8 px-2.5"
                      >
                        Send
                      </SpecularButton>
                    </div>
                  </div>
                )}
              </div>
            </MagicBentoCard>

            {/* Bento 2: WIRE & MAILBOX HUB (4 cols - Dynamic Moving Visuals) */}
            <MagicBentoCard
              className="md:col-span-4 flex flex-col justify-between"
              sectionLabel="Signaling Hub & Wire"
              badge={
                <RouteBadge variant="simulation">In-Memory</RouteBadge>
              }
            >
              <div className="space-y-3">
                {/* Visual Moving Packet Beam Track */}
                <div className="relative rounded-[6px] border border-[#242424] bg-[#000000] p-4 text-center overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#666666] mb-3">
                    <span>Peer A</span>
                    <span className="text-[#ededed] flex items-center gap-1">
                      <Mail className="h-3 w-3 text-cyan-400" /> Mailbox Hub
                    </span>
                    <span>Peer B</span>
                  </div>

                  {/* Wire Track Line */}
                  <div className="relative h-[2px] w-full bg-[#171717] rounded-full my-4">
                    {/* In-Flight Moving Packet animation */}
                    {inFlightPacket ? (
                      <motion.div
                        className="absolute -top-2 h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] flex items-center justify-center text-[8px] font-bold text-black"
                        initial={{ left: inFlightPacket.from === "Peer A" ? "0%" : "50%" }}
                        animate={{ left: inFlightPacket.to === "Mailbox" ? "50%" : "100%" }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      >
                        ✉
                      </motion.div>
                    ) : (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#333333]" />
                    )}
                  </div>

                  {/* Status Banner */}
                  <div className="text-xs font-mono">
                    {inFlightPacket ? (
                      <span className="text-cyan-400 animate-pulse">
                        In-Flight: {inFlightPacket.type} ➔ {inFlightPacket.to}
                      </span>
                    ) : mailbox.length > 0 ? (
                      <span className="text-amber-400">
                        {mailbox.length} message(s) awaiting delivery
                      </span>
                    ) : peerAConnectionState === "connected" ? (
                      <span className="text-emerald-400 flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Direct Wire Established
                      </span>
                    ) : (
                      <span className="text-[#666666]">Signaling Wire Dormant</span>
                    )}
                  </div>
                </div>

                {/* Stepping SpecularButton */}
                {mailbox.length > 0 && (
                  <SpecularButton
                    variant="primary"
                    onClick={handleStepMessage}
                    data-testid="btn-step-msg"
                    className="w-full"
                  >
                    <span>Step In-Flight ({mailbox.length})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </SpecularButton>
                )}
              </div>

              {/* In-Flight Message Preview */}
              {mailbox.length > 0 && (
                <div className="mt-3 p-2 rounded bg-[#121212] border border-[#242424] text-[11px] font-mono text-[#a1a1a1] flex items-center justify-between">
                  <span className="text-[#ededed] font-medium">Next: {mailbox[0].type.toUpperCase()}</span>
                  <span>{mailbox[0].from} ➔ {mailbox[0].to}</span>
                </div>
              )}
            </MagicBentoCard>

            {/* Bento 3: PEER B NODE (4 cols) */}
            <MagicBentoCard
              className="md:col-span-4"
              sectionLabel="Peer B (Callee)"
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
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#ededed]">
                  <Laptop className="h-4 w-4 text-[#a1a1a1]" />
                  <span>Remote Peer Engine</span>
                </div>

                <div className="space-y-1 text-[#a1a1a1] font-mono text-[11px]">
                  <div>Channel: <span className="text-[#ededed]">{peerBConnectionState === "connected" ? "Open" : "Listening"}</span></div>
                  <div>Answer: <span className="text-[#ededed]">{sdpAnswer ? "Created" : "Pending"}</span></div>
                  <div>Role: <span className="text-[#ededed]">Answerer</span></div>
                </div>

                {/* Quick DataChannel Input for Peer B (Steps 1-5) */}
                {currentStep !== 6 && (
                  <div className="mt-3 pt-2.5 border-t border-[#242424]/60">
                    <span className="text-[11px] font-mono text-[#a1a1a1] block mb-1">Send to Peer A</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Message to A..."
                        value={messageInputB}
                        onChange={(e) => setMessageInputB(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendB()}
                        data-testid="input-msg-b"
                        className="h-8 flex-1 rounded-[6px] border border-[#242424] bg-[#000000] px-2 text-xs font-mono text-[#ededed] focus:border-[#404040] outline-none"
                      />
                      <SpecularButton
                        variant="secondary"
                        onClick={handleSendB}
                        data-testid="btn-send-b"
                        className="h-8 px-2.5"
                      >
                        Send
                      </SpecularButton>
                    </div>
                  </div>
                )}
              </div>
            </MagicBentoCard>

            {/* Bento 4: GENERATIVE TELEMETRY & STEP INTERACTION DECK (12 cols) */}
            <MagicBentoCard
              className="md:col-span-12"
              sectionLabel={`Step ${currentStep} Active Experiment Deck`}
            >
              {/* STEP 1: Signaling Packet Insight */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-[#a1a1a1]">
                    Before browsers can talk peer-to-peer, they pass initial setup notes through a matchmaker. Click below or press Space to package the offer envelope.
                  </p>
                  {!sdpOffer && (
                    <SpecularButton
                      variant="primary"
                      onClick={handleStartHandshake}
                      className="h-10"
                    >
                      <Send className="h-4 w-4" />
                      <span>Initiate Offer &amp; Queue in Mailbox</span>
                    </SpecularButton>
                  )}
                </div>
              )}

              {/* STEP 2: SDP Offer / Answer Business Cards */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#ededed]">SDP Negotiation Telemetry</span>
                    <div className="flex gap-2">
                      <RouteBadge variant={sdpOffer ? "host" : "neutral"}>Offer: {sdpOffer ? `${sdpOffer.length} bytes` : "Pending"}</RouteBadge>
                      <RouteBadge variant={sdpAnswer ? "host" : "neutral"}>Answer: {sdpAnswer ? `${sdpAnswer.length} bytes` : "Pending"}</RouteBadge>
                    </div>
                  </div>
                  <p className="text-sm text-[#a1a1a1]">
                    Each peer describes its video codecs, audio rates, and data channels. The offer and answer must agree on compatible formats.
                  </p>
                </div>
              )}

              {/* STEP 3: ICE Candidates Matrix */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                    <span className="text-xs font-mono font-medium text-[#ededed]">
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
                      message="No ICE candidates discovered yet. Initiate the offer flow to begin local network interface probing."
                      actionText="Initiate Offer"
                      onAction={handleStartHandshake}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {gatheredCandidates.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 text-xs font-mono space-y-1.5"
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
                              <span>RFC 8837 mDNS Privacy (.local masked)</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: NAT Basics & Pinhole Animation */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                    <span className="text-xs font-mono text-cyan-400 uppercase font-medium">
                      [ILLUSTRATION: Educational Animation]
                    </span>
                    <span className="text-xs text-[#a1a1a1]">Pinhole Translation Flow</span>
                  </div>

                  <div className="rounded-[6px] border border-[#242424] bg-[#000000] p-4 space-y-4">
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
                      <SpecularButton
                        variant="primary"
                        onClick={handleTriggerNatSimulation}
                        className="h-11 px-6 text-sm"
                      >
                        <Zap className="h-4 w-4" />
                        <span>Send Outbound Packet through NAT</span>
                      </SpecularButton>

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

              {/* STEP 5: Media Tracks & Live Video Preview */}
              {currentStep === 5 && (
                <div className="space-y-4">
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
                    {/* Local Video Preview */}
                    <div className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#ededed]">Peer A Local Preview</span>
                        <RouteBadge variant="host">Local Track</RouteBadge>
                      </div>
                      <div className="aspect-video w-full rounded bg-[#0a0a0a] border border-[#171717] overflow-hidden flex items-center justify-center">
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

                    {/* Remote Video Received */}
                    <div className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#ededed]">Peer B Received Feed</span>
                        <RouteBadge variant="srflx">Remote SRTP</RouteBadge>
                      </div>
                      <div className="aspect-video w-full rounded bg-[#0a0a0a] border border-[#171717] overflow-hidden flex items-center justify-center">
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
                    <SpecularButton
                      variant="primary"
                      onClick={handleRequestMedia}
                      className="h-11 px-6 text-sm"
                    >
                      <Video className="h-4 w-4" />
                      <span>Request Camera / Synthetic Feed</span>
                    </SpecularButton>
                  </div>
                </div>
              )}

              {/* STEP 6: Data Channels & Interactive Chat Interface */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                    <span className="text-xs font-mono text-[#a1a1a1] uppercase font-medium">
                      Direct Wire: RTCDataChannel (SCTP)
                    </span>
                    <RouteBadge variant="host">Local P2P</RouteBadge>
                  </div>

                  {/* Chat Log */}
                  <div
                    className="rounded-[6px] border border-[#242424] bg-[#000000] p-4 max-h-40 overflow-y-auto space-y-2 font-mono text-xs"
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
                          className="h-10 flex-1 rounded-[6px] border border-[#242424] bg-[#000000] px-3 font-mono text-xs text-[#ededed] focus:border-[#404040] outline-none"
                        />
                        <SpecularButton
                          variant="secondary"
                          onClick={handleSendA}
                          data-testid="btn-send-a"
                          className="h-10 px-3"
                        >
                          Send
                        </SpecularButton>
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
                          className="h-10 flex-1 rounded-[6px] border border-[#242424] bg-[#000000] px-3 font-mono text-xs text-[#ededed] focus:border-[#404040] outline-none"
                        />
                        <SpecularButton
                          variant="secondary"
                          onClick={handleSendB}
                          data-testid="btn-send-b"
                          className="h-10 px-3"
                        >
                          Send
                        </SpecularButton>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </MagicBentoCard>
          </MagicBentoGrid>
        </div>

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

        {/* Plain-Words Explanation */}
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

        {/* Progressive Disclosure: Show Real Data */}
        <LabCard sectionLabel="Technical Telemetry" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#a1a1a1]" />
              <span className="text-sm font-medium text-[#ededed]">Inspect Protocol Payloads</span>
              <span className="text-xs text-[#666666]">(Progressive Disclosure)</span>
            </div>
            <SpecularButton
              variant="secondary"
              onClick={() => setShowRawData(!showRawData)}
              className="h-8 px-3"
            >
              {showRawData ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{showRawData ? "Hide Real Data" : "Show Real Data"}</span>
            </SpecularButton>
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

        {/* Check Yourself Quiz (Soft-Gated) */}
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
