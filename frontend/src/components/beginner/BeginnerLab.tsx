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
  Handshake,
  Globe,
  Target,
  HelpCircle,
  Lightbulb,
  Key,
  Send,
  Mail,
  ScrollText,
  User,
  Lock,
  Clock,
  Sparkles,
  Package,
  Info,
  FileCode,
  ArrowLeftRight,
  ShieldCheck,
  Shield,
  ShieldAlert,
  GitCompare,
  Cpu,
  Copy,
  CheckCheck,
  Eye,
  BookOpen,
  VideoOff,
  Mic,
  MicOff,
  Sliders,
  Volume2,
  VolumeX,
  PhoneOff,
} from "lucide-react";
import { useLabStore } from "@/store/labStore";
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
  iconType?: "cloud" | "user" | "sparkles" | "zap" | "mail";
}

export const BeginnerLab: React.FC = () => {
  const {
    currentStep,
    setStep,
    isPaused,
    setIsPaused,
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
      iconType: "cloud",
    },
  ]);

  const renderFrameIcon = (iconType?: "cloud" | "user" | "sparkles" | "zap" | "mail") => {
    switch (iconType) {
      case "user":
        return <User className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
      case "sparkles":
        return <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
      case "zap":
        return <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
      case "mail":
        return <Mail className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
      case "cloud":
      default:
        return <Cloud className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
    }
  };

  // Dynamic Action Reaction State (Explains what just happened on click)
  const [lastReaction, setLastReaction] = useState<ActionReaction>({
    title: "System Standby",
    detail: "Choose a step and trigger an action to observe live WebRTC protocol events.",
    badge: "INITIAL",
    timestamp: new Date().toLocaleTimeString(),
  });

  // Step 2 SDP Business Card Inspector State
  const [step2Tab, setStep2Tab] = useState<"decoded" | "diff" | "raw">("decoded");
  const [selectedSdpIndex, setSelectedSdpIndex] = useState<number>(0);
  const [copiedSdp, setCopiedSdp] = useState(false);

  const handleCopySdp = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSdp(true);
    setTimeout(() => setCopiedSdp(false), 2000);
  };

  const defaultSampleSdp = `v=0
o=- 4611731400431189076 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
m=video 9 UDP/TLS/RTP/SAVPF 96 97
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=rtpmap:96 VP8/90000
a=rtpmap:97 H264/90000
a=setup:actpass
a=mid:0
a=sendrecv
a=fingerprint:sha-256 3F:2B:6A:19:9C:F8:71:0D:39:E1:94:4B:B3:68:57:34:B7:22:98:31:DE:6B:41:22:90:5E:2B:10:9C:23:42:01
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 0.0.0.0
a=mid:1
a=sctp-port:5000
a=setup:actpass`;

  const sdpOfferDecodedEntries = [
    {
      prefix: "m=video",
      field: "m=video 9 UDP/TLS/RTP/SAVPF 96 97",
      title: "Video Stream Declaration",
      plainEnglish: "Peer A asks to transmit video. Port 9 signifies dynamic port negotiation via ICE candidates.",
      technicalDetail: "RTP/SAVPF mandates Secure RTP with RTCP feedback (RFC 5124) for lost frame retransmission and bandwidth probes.",
      icon: <Video className="h-4 w-4 text-cyan-400" />,
      category: "Media",
      badge: "RFC 4566",
      answerResponse: "Peer B accepts video stream on dynamic ICE port.",
    },
    {
      prefix: "a=rtpmap:96",
      field: "a=rtpmap:96 VP8/90000",
      title: "VP8 Video Codec (Preferred)",
      plainEnglish: "Peer A prefers Google VP8 compression at a 90,000 Hz clock rate (standard 30-60 fps web video).",
      technicalDetail: "Dynamic payload type 96 is bound to the VP8 video compression standard (RFC 7741).",
      icon: <Cpu className="h-4 w-4 text-emerald-400" />,
      category: "Codec",
      badge: "RFC 7741",
      answerResponse: "Peer B confirms VP8 support and selects payload 96 as primary decoder.",
    },
    {
      prefix: "a=rtpmap:97",
      field: "a=rtpmap:97 H264/90000",
      title: "H.264 Video Codec (Fallback)",
      plainEnglish: "Peer A provides MPEG-4 AVC fallback for Safari and devices with dedicated H.264 hardware chips.",
      technicalDetail: "Payload type 97 provides interoperability with hardware-accelerated AVC decoders (RFC 6184).",
      icon: <Cpu className="h-4 w-4 text-purple-400" />,
      category: "Codec",
      badge: "RFC 6184",
      answerResponse: "Peer B notes H.264 fallback but selects primary VP8 match.",
    },
    {
      prefix: "m=application",
      field: "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
      title: "P2P Data Channel (SCTP)",
      plainEnglish: "Peer A declares a direct bidirectional channel for real-time text chat, file chunks, or binary game state.",
      technicalDetail: "Runs Stream Control Transmission Protocol (SCTP) inside the DTLS tunnel (RFC 8831).",
      icon: <MessageSquare className="h-4 w-4 text-cyan-400" />,
      category: "DataChannel",
      badge: "RFC 8831",
      answerResponse: "Peer B confirms data channel support on local SCTP port 5000.",
    },
    {
      prefix: "a=fingerprint",
      field: "a=fingerprint:sha-256 3F:2B:6A:19:9C:...",
      title: "DTLS Security Certificate Fingerprint",
      plainEnglish: "Peer A's cryptographic cert thumbprint. Both browsers verify this fingerprint to block eavesdroppers.",
      technicalDetail: "SHA-256 hash of Peer A's self-signed X.509 certificate used during TLS key exchange (RFC 8122).",
      icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
      category: "Security",
      badge: "RFC 8122",
      answerResponse: "Peer B validates fingerprint against incoming DTLS ClientHello.",
    },
    {
      prefix: "a=setup",
      field: "a=setup:actpass",
      title: "DTLS Role Proposal (Actpass)",
      plainEnglish: "Peer A is flexible: 'I can either act as client or server during our DTLS encryption handshake.'",
      technicalDetail: "'actpass' allows the answerer (Peer B) to decide whether to initiate or accept the DTLS handshake (RFC 4145).",
      icon: <ArrowLeftRight className="h-4 w-4 text-amber-400" />,
      category: "Network",
      badge: "RFC 4145",
      answerResponse: "Peer B selects 'setup:active', acting as the DTLS client.",
    },
  ];

  // Step 3 ICE Candidates Pathfinder State
  const [step3Tab, setStep3Tab] = useState<"candidates" | "pairs" | "anatomy">("candidates");
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number>(0);
  const [selectedAnatomyIndex, setSelectedAnatomyIndex] = useState<number>(0);

  const iceCandidateEntries = [
    {
      type: "host",
      title: "Host Candidate (Local Interface)",
      priority: "2,113,937,151",
      latency: "< 1 ms",
      badge: "Priority: 1st",
      protocol: "UDP",
      socket: "192.168.1.15:51200",
      interfaceName: "en0 (Local Wi-Fi)",
      plainEnglish: "Obtained directly from the operating system network card. Represents the laptop's private LAN socket.",
      technicalDetail: "RFC 8445 §5.1.1. Assigned highest type preference (126). Delivers the lowest latency and highest throughput if both peers share the same Wi-Fi or corporate network.",
      rfc: "RFC 8445 §5.1.1",
      icon: <Laptop className="h-4 w-4 text-emerald-400" />,
      tagColor: "border-emerald-500/30 bg-emerald-950/20 text-emerald-300",
      role: "Same LAN / Subnet",
    },
    {
      type: "srflx",
      title: "Server Reflexive (STUN Public NAT)",
      priority: "1,677,721,599",
      latency: "~15-35 ms",
      badge: "Priority: 2nd",
      protocol: "UDP",
      socket: "152.58.37.13:41987",
      interfaceName: "NAT Gateway Pinhole",
      plainEnglish: "Discovered by querying a STUN server: 'What is my public IP and port as seen outside my home router?'",
      technicalDetail: "RFC 8489 STUN Binding Request. Punches an outbound translation mapping in the NAT firewall table. Used for direct peer-to-peer across different internet providers.",
      rfc: "RFC 8489 STUN",
      icon: <Globe className="h-4 w-4 text-purple-400" />,
      tagColor: "border-purple-500/30 bg-purple-950/20 text-purple-300",
      role: "Cross-Internet Direct",
    },
    {
      type: "prflx",
      title: "Peer Reflexive (Dynamic Port Binding)",
      priority: "1,845,493,759",
      latency: "~18-40 ms",
      badge: "Dynamic",
      protocol: "UDP",
      socket: "152.58.37.13:44210",
      interfaceName: "Symmetric NAT Shift",
      plainEnglish: "Discovered on-the-fly during connectivity checks when packets arrive from an address/port different from the STUN binding.",
      technicalDetail: "RFC 8445 §7.1.3. Occurs under symmetric NAT firewalls that reassign ports per destination socket. Assigned high preference (110).",
      rfc: "RFC 8445 §7.1.3",
      icon: <ArrowLeftRight className="h-4 w-4 text-cyan-400" />,
      tagColor: "border-cyan-500/30 bg-cyan-950/20 text-cyan-300",
      role: "Symmetric Reassignment",
    },
    {
      type: "relay",
      title: "Relay Candidate (TURN Cloud Proxy)",
      priority: "16,777,215",
      latency: "~60-120 ms",
      badge: "Fallback",
      protocol: "UDP/TLS",
      socket: "turn.relay.lab:3478",
      interfaceName: "TURN Server Allocation",
      plainEnglish: "Allocated on a dedicated cloud server. Serves as a 100% reliable fallback when both peers are behind strict corporate firewalls.",
      technicalDetail: "RFC 8656 TURN Allocate Request. Encrypted media packets are relayed through the server. Lowest type preference (0) due to server bandwidth overhead.",
      rfc: "RFC 8656 TURN",
      icon: <Server className="h-4 w-4 text-amber-400" />,
      tagColor: "border-amber-500/30 bg-amber-950/20 text-amber-300",
      role: "Guaranteed Tunnel",
    },
  ];

  const candidatePairEntries = [
    {
      pairId: "Pair #1",
      local: "Host (192.168.1.15:51200)",
      remote: "Host (10.0.0.42:62400)",
      priority: "9,120,443,100",
      state: "Failed (Different Private Subnets)",
      stateColor: "text-red-400 border-red-500/30 bg-red-950/20",
      rtt: "Timeout",
    },
    {
      pairId: "Pair #2",
      local: "srflx (152.58.37.13:41987)",
      remote: "srflx (152.58.37.13:36830)",
      priority: "7,230,119,450",
      state: "Succeeded (Nominated Pair • USE-CANDIDATE)",
      stateColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20 font-bold",
      rtt: "24 ms",
    },
    {
      pairId: "Pair #3",
      local: "srflx (152.58.37.13:41987)",
      remote: "Relay (turn.relay.lab:3478)",
      priority: "1,890,204,110",
      state: "Frozen (Not Needed)",
      stateColor: "text-[#777777] border-[#262626] bg-[#141414]",
      rtt: "Standby",
    },
    {
      pairId: "Pair #4",
      local: "Relay (turn.relay.lab:3478)",
      remote: "Relay (turn.relay.lab:3478)",
      priority: "72,110,400",
      state: "Frozen (Not Needed)",
      stateColor: "text-[#777777] border-[#262626] bg-[#141414]",
      rtt: "Standby",
    },
  ];

  const sdpAnatomyFields = [
    {
      token: "candidate:",
      name: "SDP Attribute Prefix",
      meaning: "Identifies this line as an ICE candidate declaration per RFC 5245 / RFC 8445.",
      rfc: "RFC 8445 §5.1",
    },
    {
      token: "2426751383",
      name: "Foundation ID",
      meaning: "Alphanumeric identifier unique to candidates with identical type, base IP, and STUN/TURN server. Optimizes pair checks.",
      rfc: "RFC 8445 §5.1.1.1",
    },
    {
      token: "1",
      name: "Component ID",
      meaning: "1 represents RTP media stream or SCTP data channel. (2 is used for RTCP if multiplexing is disabled).",
      rfc: "RFC 8445 §5.1.1.2",
    },
    {
      token: "udp",
      name: "Transport Protocol",
      meaning: "UDP is WebRTC's primary transport for lowest latency. TCP is only used as a fallback through TURN on port 443.",
      rfc: "RFC 8445 §5.1.1.3",
    },
    {
      token: "2113937151",
      name: "Priority (32-bit uint)",
      meaning: "Calculated via (2^24 * type_pref) + (2^8 * local_pref) + (256 - component). Higher numbers are evaluated first.",
      rfc: "RFC 8445 §5.1.2.1",
    },
    {
      token: "192.168.1.15",
      name: "IP Address",
      meaning: "The host network interface IP, public reflexive NAT IP, or TURN relay server IP.",
      rfc: "RFC 8445 §5.1.1.4",
    },
    {
      token: "51200",
      name: "Port Number",
      meaning: "The UDP port bound to the local media socket or the NAT translation table.",
      rfc: "RFC 8445 §5.1.1.5",
    },
    {
      token: "typ host",
      name: "Candidate Type",
      meaning: "Specifies whether this candidate is 'host' (LAN), 'srflx' (STUN), 'prflx', or 'relay' (TURN).",
      rfc: "RFC 8445 §5.1.1.6",
    },
    {
      token: "generation 0",
      name: "ICE Generation Counter",
      meaning: "Increments if an ICE restart is triggered due to network handover (e.g. switching from Wi-Fi to 5G).",
      rfc: "RFC 5245 §4.1.1",
    },
  ];

  // Step 4 NAT Basics State
  const [step4Tab, setStep4Tab] = useState<"table" | "types" | "stun">("table");
  const [selectedNatTypeIndex, setSelectedNatTypeIndex] = useState<number>(0);
  const [natPinholeActive, setNatPinholeActive] = useState<boolean>(false);
  const [natPacketInFlight, setNatPacketInFlight] = useState<boolean>(false);

  const natMappingEntries = [
    {
      id: "nat-01",
      internal: "192.168.1.15:54321",
      external: "103.21.44.12:49152",
      destination: "stun.l.google.com:19302",
      protocol: "UDP",
      ttl: natPinholeActive ? "28s" : "Expired",
      state: natPinholeActive ? "Active Pinhole" : "Idle",
      stateColor: natPinholeActive
        ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400 font-bold"
        : "border-[#262626] bg-[#141414] text-[#666666]",
      description: "STUN binding request opened return route for inbound WebRTC packets.",
    },
    {
      id: "nat-02",
      internal: "192.168.1.15:51200",
      external: "103.21.44.12:51200",
      destination: "10.0.0.42:62400 (Peer B)",
      protocol: "UDP",
      ttl: "Standby",
      state: "Pinhole Punching",
      stateColor: "border-purple-500/30 bg-purple-950/20 text-purple-300",
      description: "Direct P2P socket awaiting simultaneous punch from Peer B.",
    },
    {
      id: "nat-03",
      internal: "192.168.1.15:443",
      external: "103.21.44.12:58210",
      destination: "turn.relay.lab:3478",
      protocol: "TLS/TCP",
      ttl: "120s",
      state: "Tunnel Standby",
      stateColor: "border-cyan-500/30 bg-cyan-950/20 text-cyan-300",
      description: "Fallback TURN control channel for strict enterprise firewalls.",
    },
    {
      id: "nat-04",
      internal: "192.168.1.100:80",
      external: "103.21.44.12:80",
      destination: "Any (Full Cone)",
      protocol: "TCP",
      ttl: "Static",
      state: "Static Port Forward",
      stateColor: "border-[#333333] bg-[#161616] text-[#888888]",
      description: "Manual router port forwarding rule (not used by dynamic WebRTC).",
    },
  ];

  const natTypeEntries = [
    {
      type: "Port-Restricted Cone NAT",
      badge: "Standard Wi-Fi (95% of Homes)",
      p2pFeasibility: "95% Success",
      feasibilityColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
      behavior: "Outbound UDP to IP_X:Port_Y opens an inbound pinhole exclusively for packets coming from that exact IP_X and Port_Y.",
      p2pVerdict: "P2P Hole Punching works! Both peers must send packets towards each other's reflexive socket to open mutual pinholes.",
      icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
      rfc: "RFC 4787 §5",
      example: "Standard Asus, Netgear, TP-Link home routers.",
    },
    {
      type: "Address-Restricted Cone NAT",
      badge: "Lenient (Moderate)",
      p2pFeasibility: "99% Success",
      feasibilityColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
      behavior: "Outbound packet to IP_X opens a pinhole for any port on IP_X. Inbound packets from IP_X are accepted regardless of source port.",
      p2pVerdict: "Easy P2P hole punching. Once Peer A sends to Peer B's public IP, any incoming port from Peer B passes through.",
      icon: <Globe className="h-4 w-4 text-cyan-400" />,
      rfc: "RFC 3489 §5",
      example: "Older consumer routers, some DSL modems.",
    },
    {
      type: "Full Cone NAT (1-to-1)",
      badge: "Most Permissive",
      p2pFeasibility: "100% Success",
      feasibilityColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
      behavior: "Once an internal IP:port is mapped to public IP:port, any external computer on the entire internet can send packets to it.",
      p2pVerdict: "Zero hole punching needed. Acts like a direct public IP. Rare in modern consumer hardware due to security risks.",
      icon: <Radio className="h-4 w-4 text-purple-400" />,
      rfc: "RFC 3489 §5",
      example: "Dedicated DMZ settings, 1-to-1 cloud NAT gateways.",
    },
    {
      type: "Symmetric NAT",
      badge: "Strict Enterprise / 4G Carrier",
      p2pFeasibility: "0% Direct P2P (Requires TURN)",
      feasibilityColor: "text-red-400 border-red-500/30 bg-red-950/20",
      behavior: "Allocates a DIFFERENT public port for every unique destination IP:port you contact. Port mapped for STUN does not match Peer B!",
      p2pVerdict: "Direct P2P hole punching is impossible because neither peer can predict the port allocated for the other. Relays via TURN.",
      icon: <ShieldAlert className="h-4 w-4 text-red-400" />,
      rfc: "RFC 4787 §4.1",
      example: "Corporate firewalls, university dorms, cellular 4G/5G carrier-grade NAT (CGNAT).",
    },
  ];

  const stunPacketFields = [
    {
      token: "0x0001",
      name: "STUN Message Type: Binding Request",
      category: "Header",
      meaning: "Tells the STUN server to inspect the source UDP packet and reflect its IP and port.",
      rfc: "RFC 8489 §6",
    },
    {
      token: "0x2112A442",
      name: "Magic Cookie",
      category: "Header",
      meaning: "Fixed 32-bit value that distinguishes STUN traffic from raw RTP packets and allows detection of NATs that inspect payloads.",
      rfc: "RFC 8489 §5",
    },
    {
      token: "0x9E4B...72A1",
      name: "96-bit Transaction ID",
      category: "Header",
      meaning: "Random cryptographically secure ID used to correlate the binding request with the matching binding response.",
      rfc: "RFC 8489 §5",
    },
    {
      token: "0x0020",
      name: "XOR-MAPPED-ADDRESS Attribute",
      category: "Attribute",
      meaning: "Reflects the client's public IP and port obfuscated by XORing with the magic cookie to prevent smart ALGs from altering it.",
      rfc: "RFC 8489 §14.2",
    },
    {
      token: "103.21.44.12:49152",
      name: "Decoded Public Reflexive Tuple",
      category: "Payload",
      meaning: "The actual external IP and port assigned to Peer A's laptop by the home router NAT gateway.",
      rfc: "RFC 8489 §14.2",
    },
  ];

  // Step 5 Media Streams & Tracks State
  const [step5Tab, setStep5Tab] = useState<"tracks" | "constraints" | "states">("tracks");
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [selectedResolution, setSelectedResolution] = useState<"480p" | "720p" | "1080p">("720p");
  const [selectedFrameRate, setSelectedFrameRate] = useState<24 | 30 | 60>(30);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(true);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [autoGainControl, setAutoGainControl] = useState<boolean>(true);

  // Step 5 Interactive Handlers
  const handleToggleMic = () => {
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);
    if (localMediaStream) {
      localMediaStream.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
    }
    setCallChipLabel(nextMuted ? "audio_track_muted_silence" : "audio_track_unmuted_live");
    setCallChipState("success");
    setCallChipDuration(500);

    setLastReaction({
      title: nextMuted ? "Microphone Track Muted" : "Microphone Track Unmuted",
      detail: nextMuted
        ? "audioTrack.enabled = false: Browser transmits silent RTP audio packets over SRTP. No SDP renegotiation is triggered."
        : "audioTrack.enabled = true: Microphone hardware audio stream unmuted and encoding Opus packets at 48kHz.",
      badge: nextMuted ? "MIC MUTED" : "MIC ACTIVE",
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleToggleVideo = () => {
    const nextMuted = !isVideoMuted;
    setIsVideoMuted(nextMuted);
    if (localMediaStream) {
      localMediaStream.getVideoTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
    }
    setCallChipLabel(nextMuted ? "video_track_disabled_black" : "video_track_enabled_live");
    setCallChipState("success");
    setCallChipDuration(500);

    setLastReaction({
      title: nextMuted ? "Video Track Disabled (Black Frames)" : "Video Track Enabled",
      detail: nextMuted
        ? "videoTrack.enabled = false: Browser transmits black video frames over DTLS-SRTP without renegotiating the SDP offer/answer!"
        : "videoTrack.enabled = true: Hardware camera frames restored and flowing to the encoder pipeline.",
      badge: nextMuted ? "CAM MUTED" : "CAM ACTIVE",
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleSetResolutionPreset = (res: "480p" | "720p" | "1080p") => {
    setSelectedResolution(res);
    setCallChipLabel(`constraint_resolution_${res}`);
    setCallChipState("success");
    setCallChipDuration(400);

    const dims = res === "1080p" ? "1920x1080 (Full HD)" : res === "720p" ? "1280x720 (HD)" : "640x480 (SD)";
    setLastReaction({
      title: `Applied Resolution Constraint: ${res.toUpperCase()}`,
      detail: `Ideal dimension constraint set to ${dims}. MediaTrackConstraints passed to getUserMedia() negotiates with camera driver.`,
      badge: res.toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  // Step 6 State
  const [step6Tab, setStep6Tab] = useState<"chat" | "sctp" | "stats">("chat");

  // Step 5: Stop media tracks & release hardware permissions
  const handleStopMedia = () => {
    if (syntheticMediaStopRef.current) {
      syntheticMediaStopRef.current();
      syntheticMediaStopRef.current = null;
    }
    if (localMediaStream) {
      localMediaStream.getTracks().forEach((t) => {
        t.stop();
      });
      useLabStore.getState().setLocalMediaStream(null);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setMediaStatus("idle");
    setIsMicMuted(false);
    setIsVideoMuted(false);
    setCallChipLabel("media_tracks_ended_permissions_released");
    setCallChipState("success");
    setCallChipDuration(500);

    setLastReaction({
      title: "Media Hardware Released (Permissions Closed)",
      detail: "track.stop() invoked: Camera LED indicator turned off. MediaStreamTracks permanently ended. Hardware access released.",
      badge: "MEDIA STOPPED",
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  // Step 6: End call & close RTCPeerConnection
  const handleEndCall = () => {
    if (syntheticMediaStopRef.current) {
      syntheticMediaStopRef.current();
      syntheticMediaStopRef.current = null;
    }
    loopbackService.reset();
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setMediaStatus("idle");
    setIsMicMuted(false);
    setIsVideoMuted(false);
    setCallChipLabel("peerconnection_closed_call_ended");
    setCallChipState("success");
    setCallChipDuration(600);

    setLastReaction({
      title: "Call Terminated (RTCPeerConnection Closed)",
      detail: "pc.close() executed: SCTP DataChannel closed, DTLS-SRTP session destroyed, hardware media tracks stopped, and all ICE pinholes released.",
      badge: "CALL ENDED",
      timestamp: new Date().toLocaleTimeString(),
    });
  };

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
        iconType: "user",
      },
      {
        id: `ws-${Date.now()}-2`,
        timestamp: now,
        direction: "B ➔ SRV",
        title: "Peer B joins room 'mesh-402'",
        explanation: "Peer B connects to the same matchmaker server: 'I am Peer B (callee_b82). I am in room mesh-402 and ready to receive connection requests.'",
        payload: '{"action":"join_room","clientId":"callee_b82","room":"mesh-402"}',
        badge: "JOIN_ROOM",
        iconType: "user",
      },
      {
        id: `ws-${Date.now()}-3`,
        timestamp: now,
        direction: "SRV ➔ ALL",
        title: "Matchmaker announces: Room is Ready!",
        explanation: "The server broadcasts to both peers: 'Both parties are online in room mesh-402! Peer A, you may now generate and send your SDP offer.'",
        payload: '{"event":"room_ready","room":"mesh-402","peers":["caller_a19","callee_b82"]}',
        badge: "ROOM_READY",
        iconType: "sparkles",
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
        iconType: "zap",
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
    setNatPacketInFlight(true);
    setCallChipLabel("nat_rewriting_packet_header");
    setCallChipState("running");

    setLastReaction({
      title: "Outbound UDP Packet Leaving LAN",
      detail: "Source packet originating from private address 192.168.1.15:54321 hitting NAT router...",
      badge: "NAT OUTBOUND",
      timestamp: new Date().toLocaleTimeString(),
    });

    setTimeout(() => {
      setNatPinholeActive(true);
      setNatPacketInFlight(false);
      setCallChipLabel("pinhole_active_103.21.44.12:49152");
      setCallChipState("success");
      setCallChipDuration(1100);

      setLastReaction({
        title: "Pinhole Active: STUN Reflected Public IP",
        detail: "Pinhole active! STUN server successfully reflected external address 103.21.44.12:49152. Inbound return path unlocked.",
        badge: "PINHOLE OPEN",
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 900);
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
          detail: "Live video track bound to RTCPeerConnection via addTrack(). Encrypted via DTLS-SRTP.",
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
        detail: "Rendered canvas test pattern track bound to Peer A and encoded via VP8.",
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
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-purple-500/30 bg-purple-950/30 text-purple-400 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                      <Handshake className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Cloud className="h-4 w-4 text-purple-400" />
                        <span className="text-sm sm:text-base font-bold text-[#ededed]">
                          Step 1 • The Matchmaker (Signaling)
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#888888]">Curriculum • Phase: Discovery & Rendezvous</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-[6px] border border-purple-500/40 bg-purple-950/30 text-purple-300 font-semibold shadow-[0_0_8px_rgba(168,85,247,0.15)]">
                    <Globe className="h-3.5 w-3.5 text-purple-400" />
                    <span>WebSocket Online</span>
                  </span>
                </div>

                {/* Dedicated 2-Line "Why Are We Doing This?" Card */}
                <div className="rounded-[8px] border border-purple-500/40 bg-gradient-to-r from-purple-950/30 via-purple-900/10 to-transparent p-2.5 space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-300">
                    <Target className="h-4 w-4 text-purple-400" />
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
                    <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>The Chicken-and-Egg Dilemma</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#a1a1a1] leading-relaxed">
                    WebRTC creates direct, encrypted peer-to-peer pipelines for video and data. But <strong className="text-[#ededed]">two browsers cannot dial each other blindly</strong>. They live behind private home routers (NAT) and neither browser knows the other's public IP or supported codecs.
                  </p>
                </div>

                {/* Mental Model & Analogy */}
                <div className="rounded-[8px] border border-[#222222] bg-[#121212] p-2.5 space-y-1 text-xs sm:text-sm">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Mental Model & Analogy</span>
                  </span>
                  <p className="text-[#ededed] italic leading-relaxed">
                    "You want to make a private phone call with someone across the world, but you first need a mutual friend to introduce you and exchange your phone numbers."
                  </p>
                </div>

                {/* The WebRTC Rule */}
                <div className="text-xs sm:text-sm font-mono text-[#888888] space-y-0.5 border-l-2 border-cyan-500/60 pl-2.5 py-0.5">
                  <p className="flex items-start gap-1.5">
                    <Key className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#ededed]">Key Protocol Fact:</strong> WebRTC intentionally specifies <span className="underline decoration-cyan-500 text-cyan-200">zero signaling</span>. Developers choose the transport (WebSocket, HTTP REST, SIP, or Firebase).
                    </span>
                  </p>
                </div>
              </div>

              {/* Numbered Action Directive ("What tells you what to do") */}
              <div className="space-y-2 pt-2 border-t border-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
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
                    <Send className="h-3.5 w-3.5 text-cyan-400" />
                    <span>2. Send Ping</span>
                    <ArrowRight className="h-3 w-3 text-[#777777]" />
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
                      <Globe className="h-4 w-4 text-cyan-400" />
                      <span>Rendezvous Highway Topology</span>
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#888888] flex items-center gap-1.5">
                    <Cloud className="h-3.5 w-3.5 text-cyan-400" />
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
                        <div className="text-xs sm:text-sm font-semibold text-[#ededed] flex items-center gap-1.5">
                          <Server className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Signaling Server (Matchmaker)</span>
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
                        <div className="text-xs font-semibold text-[#ededed] flex items-center gap-1.5">
                          <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Peer A (Caller)</span>
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
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Relay Ready</span>
                        </span>
                      ) : (
                        <span className="text-[#888888] flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-400/80" />
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
                        <div className="text-xs font-semibold text-[#ededed] flex items-center gap-1.5">
                          <Laptop className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Peer B (Callee)</span>
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
                  <span className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Signaling Channel: WebSocket Full-Duplex</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-amber-400" />
                    <span>Payload: JSON Text Control Frames</span>
                  </span>
                </div>
              </div>

              {/* BOTTOM: WEBSOCKET PROTOCOL STREAM + QUICK DATACHANNEL TEST DOCK */}
              <div className="flex-1 min-h-0 grid grid-cols-12 gap-2.5">
                {/* WebSocket Frames (Col 7) */}
                <div className="col-span-12 lg:col-span-7 h-full min-h-0 rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-2.5 flex flex-col justify-between overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed] flex items-center gap-1.5">
                        <ScrollText className="h-4 w-4 text-emerald-400" />
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
                            {renderFrameIcon(frame.iconType)}
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

                  <div className="text-xs font-mono text-[#888888] pt-1.5 border-t border-[#1a1a1a] flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Server only forwards signaling metadata; media never flows here.</span>
                  </div>
                </div>

                {/* Quick DataChannel Verification Dock (Col 5) */}
                <div className="col-span-12 lg:col-span-5 h-full min-h-0 rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-2.5 flex flex-col justify-between overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs sm:text-sm font-semibold text-[#ededed] flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                        <span>P2P Data Channel</span>
                      </span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Direct Pipe</span>
                    </span>
                  </div>

                  <div
                    data-testid="dc-log"
                    className="flex-1 min-h-0 my-1.5 overflow-y-auto rounded-[6px] bg-[#000000] p-2 text-xs font-mono text-[#ededed] space-y-1.5 border border-[#1a1a1a]"
                  >
                    {dataChannelMessages.length === 0 ? (
                      <div className="text-[#666666] italic flex items-center gap-1.5 py-4 justify-center text-xs">
                        <Lock className="h-3.5 w-3.5 text-[#666666]" />
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
                        placeholder="Send from A..."
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
                        placeholder="Send from B..."
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
        ) : currentStep === 2 ? (
          /* ============================================================== */
          /* STEP 2: THE BUSINESS CARD (SDP OFFER / ANSWER) (Morphing Bento) */
          /* ============================================================== */
          <motion.div
            key="step-2-bento"
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
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-purple-500/30 bg-purple-950/30 text-purple-400 shrink-0">
                      <FileCode className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <ScrollText className="h-4 w-4 text-purple-400" />
                        <span className="text-sm sm:text-base font-bold text-[#ededed]">
                          Step 2 • The Business Card (SDP Offer / Answer)
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#888888]">Curriculum • Phase: Capability Negotiation & Media Contract</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-[6px] border border-purple-500/40 bg-purple-950/30 text-purple-300 font-semibold">
                    <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                    <span>RFC 8829 • JSEP</span>
                  </span>
                </div>

                {/* Dedicated 2-Line "Why Are We Doing This?" Card */}
                <div className="rounded-[8px] border border-purple-500/40 bg-gradient-to-r from-purple-950/30 via-purple-900/10 to-transparent p-2.5 space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-300">
                    <Target className="h-4 w-4 text-purple-400" />
                    <span>Why Are We Doing This?</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#ededed] leading-relaxed">
                    Before sending encrypted video or data, both browsers must legally agree on codecs, crypto fingerprints, and media streams.
                    They write this down in an SDP text contract — the Caller sends an <strong className="text-purple-300">Offer</strong>, and the Callee replies with an <strong className="text-cyan-300">Answer</strong>!
                  </p>
                </div>

                {/* The Core Problem & Baseline */}
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-semibold text-[#ededed] flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>The Codec Compatibility Dilemma</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#a1a1a1] leading-relaxed">
                    Browser A might support VP8 and AV1, while Browser B only supports H.264. If A transmits VP8 without checking, B crashes or renders black frames. <strong className="text-[#ededed]">SDP negotiation ensures both peers agree on their highest mutual capability</strong> before transmitting media.
                  </p>
                </div>

                {/* Mental Model & Analogy */}
                <div className="rounded-[8px] border border-[#222222] bg-[#121212] p-2.5 space-y-1 text-xs sm:text-sm">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Mental Model & Analogy</span>
                  </span>
                  <p className="text-[#ededed] italic leading-relaxed">
                    "Before starting an international business deal, two executives swap contracts: 'I speak English and French, I use 256-bit encryption, and I listen on port 5000. Do you accept?'"
                  </p>
                </div>

                {/* The WebRTC Rule */}
                <div className="text-xs sm:text-sm font-mono text-[#888888] space-y-0.5 border-l-2 border-purple-500/60 pl-2.5 py-0.5">
                  <p className="flex items-start gap-1.5">
                    <Key className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#ededed]">Key Protocol Fact:</strong> WebRTC uses the <span className="underline decoration-purple-500 text-purple-200">JSEP</span> state machine: <code className="text-purple-300">createOffer()</code> ➔ <code className="text-purple-300">setLocalDescription()</code> ➔ Signaling ➔ <code className="text-purple-300">setRemoteDescription()</code> ➔ <code className="text-purple-300">createAnswer()</code>.
                    </span>
                  </p>
                </div>
              </div>

              {/* Numbered Action Directives */}
              <div className="space-y-2 pt-2 border-t border-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Interactive Directives</span>
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-medium">JSEP Negotiation</span>
                </div>

                <div className="flex gap-2">
                  <SpecularButton
                    onClick={handleStartHandshake}
                    data-testid="btn-start-offer"
                    className="flex-1 h-9 text-xs sm:text-sm font-semibold"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1 text-purple-400" />
                    <span>
                      {sdpOffer && sdpAnswer
                        ? "Negotiation Complete (VP8 + Opus)"
                        : sdpOffer
                        ? "Offer Sent • Awaiting Answer"
                        : "1. Generate Offer & Exchange Answer"}
                    </span>
                  </SpecularButton>

                  <button
                    type="button"
                    onClick={() => setSelectedSdpIndex((prev) => (prev + 1) % sdpOfferDecodedEntries.length)}
                    className="px-3.5 h-9 rounded-[6px] border border-[#242424] bg-[#141414] text-xs sm:text-sm font-mono text-[#ededed] hover:border-[#404040] hover:bg-[#1a1a1a] transition-all flex items-center gap-1.5"
                    title="Inspect next decoded SDP line"
                  >
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Inspect ({selectedSdpIndex + 1}/{sdpOfferDecodedEntries.length})</span>
                  </button>
                </div>

                {/* Action Reaction Feed */}
                <div className="rounded-[8px] border border-[#262626] bg-[#111111] p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#ededed]">
                        {lastReaction.title}
                      </span>
                    </div>
                    {lastReaction.badge && (
                      <span className="rounded bg-[#1c1c1c] px-2 py-0.5 text-xs font-mono text-purple-300 border border-[#2c2c2c]">
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

            {/* RIGHT COLUMN: NEGOTIATION BRIDGE & PACKET X-RAY INSPECTOR (Col 7) */}
            <div className="col-span-12 lg:col-span-7 h-full min-h-0 flex flex-col gap-2.5">
              {/* TOP: THE NEGOTIATION BRIDGE & CONTRACT MATRIX */}
              <div className="h-[40%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed]">
                      SDP Negotiation Bridge (JSEP State Machine)
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] border border-purple-500/30 bg-purple-950/20 text-purple-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                    <span>{sdpOffer && sdpAnswer ? "Contract Ratified" : sdpOffer ? "Offer in Flight" : "Awaiting Offer"}</span>
                  </span>
                </div>

                {/* Dynamic Contract Highway between Peer A & Peer B */}
                <div className="relative my-auto flex items-center justify-between px-6 py-2">
                  {/* Peer A Node */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] border ${
                      sdpOffer
                        ? "border-purple-500/40 bg-purple-950/20 text-purple-300"
                        : "border-[#242424] bg-[#121212] text-[#777777]"
                    }`}>
                      <Laptop className="h-4 w-4 text-purple-400 shrink-0" />
                      <div className="text-left font-mono">
                        <div className="text-xs font-semibold text-[#ededed] flex items-center gap-1">
                          <span>Peer A (Offerer)</span>
                        </div>
                        <div className="text-[11px] text-[#888888]">{sdpOffer ? "Offer Created" : "Idle"}</div>
                      </div>
                      <span
                        data-testid="peer-a-state"
                        className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/60 text-purple-300 ml-1.5 border border-purple-500/30 font-semibold"
                      >
                        {peerAConnectionState}
                      </span>
                    </div>
                  </div>

                  {/* Animated Contract Exchange Beam */}
                  <div className="relative flex-1 h-[2px] bg-[#222222] mx-4">
                    <motion.div
                      className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,1)] absolute -top-1"
                      initial={{ left: "5%" }}
                      animate={{ left: sdpOffer ? "95%" : "5%" }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                    {sdpAnswer && (
                      <motion.div
                        className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] absolute -top-1"
                        initial={{ left: "95%" }}
                        animate={{ left: "5%" }}
                        transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
                      />
                    )}
                    <div className="absolute left-1/2 -top-3.5 -translate-x-1/2 px-2 py-0.5 rounded bg-[#111111] border border-[#242424] text-[10px] font-mono text-[#888888] flex items-center gap-1">
                      <ScrollText className="h-3 w-3 text-purple-400" />
                      <span>{sdpAnswer ? "Offer ➔ ➔ Answer" : sdpOffer ? "Offer ➔" : "Contract Pipe"}</span>
                    </div>
                  </div>

                  {/* Peer B Node */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] border ${
                      sdpAnswer
                        ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-300"
                        : "border-[#242424] bg-[#121212] text-[#777777]"
                    }`}>
                      <Laptop className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div className="text-left font-mono">
                        <div className="text-xs font-semibold text-[#ededed] flex items-center gap-1">
                          <span>Peer B (Answerer)</span>
                        </div>
                        <div className="text-[11px] text-[#888888]">{sdpAnswer ? "Answer Accepted" : "Listening"}</div>
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

                {/* Agreed Treaty Parameters Matrix (4 Cards) */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[#1e1e1e]">
                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Video className="h-3 w-3 text-cyan-400" />
                      <span>Video</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">VP8 (90kHz)</div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Radio className="h-3 w-3 text-emerald-400" />
                      <span>Audio</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">Opus (48kHz)</div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <MessageSquare className="h-3 w-3 text-amber-400" />
                      <span>Data Channel</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">SCTP : 5000</div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <ShieldCheck className="h-3 w-3 text-purple-400" />
                      <span>Security</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">DTLS-SRTP</div>
                  </div>
                </div>
              </div>

              {/* BOTTOM: PACKET X-RAY & GATHERED CANDIDATES (SDP DEEP INSPECTOR) */}
              <div className="h-[60%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed]">
                      Packet X-Ray & Gathered Candidates
                    </span>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center rounded-[6px] bg-[#141414] p-0.5 border border-[#222222]">
                      <button
                        type="button"
                        onClick={() => setStep2Tab("decoded")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step2Tab === "decoded"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Decoded Highlights</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep2Tab("diff")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step2Tab === "diff"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                        <span>Offer vs Answer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep2Tab("raw")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step2Tab === "raw"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <FileCode className="h-3.5 w-3.5" />
                        <span>Raw SDP</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopySdp(sdpOffer || defaultSampleSdp)}
                      className="px-2 py-1 rounded-[6px] border border-[#242424] bg-[#141414] text-xs font-mono text-[#888888] hover:text-[#ededed] hover:border-[#404040] transition-colors flex items-center gap-1"
                      title="Copy SDP to clipboard"
                    >
                      {copiedSdp ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedSdp ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Tab Content Display */}
                <div className="flex-1 min-h-0 pt-2 overflow-hidden">
                  {step2Tab === "decoded" && (
                    <div className="h-full grid grid-cols-12 gap-2.5">
                      {/* Left Column: List of 6 Decoded Entries */}
                      <div className="col-span-5 h-full overflow-y-auto space-y-1.5 pr-1">
                        {sdpOfferDecodedEntries.map((entry, idx) => (
                          <button
                            key={entry.prefix}
                            type="button"
                            onClick={() => setSelectedSdpIndex(idx)}
                            className={`w-full text-left rounded-[6px] p-2 border transition-all flex flex-col gap-1 ${
                              selectedSdpIndex === idx
                                ? "border-purple-500/50 bg-purple-950/20 text-[#ededed] shadow-sm"
                                : "border-[#202020] bg-[#0d0d0d] text-[#888888] hover:border-[#333333] hover:text-[#ededed]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {entry.icon}
                                <span className="font-semibold text-xs text-[#ededed]">{entry.title}</span>
                              </div>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/60 text-purple-300 border border-purple-500/20">
                                {entry.badge}
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-cyan-300 truncate">{entry.field}</div>
                          </button>
                        ))}
                      </div>

                      {/* Right Column: Deep Explain Card */}
                      <div className="col-span-7 h-full overflow-y-auto rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-3 space-y-2.5">
                        {(() => {
                          const active = sdpOfferDecodedEntries[selectedSdpIndex] || sdpOfferDecodedEntries[0];
                          return (
                            <>
                              <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                                <div className="flex items-center gap-2">
                                  {active.icon}
                                  <span className="font-semibold text-sm text-[#ededed]">{active.title}</span>
                                </div>
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30">
                                  {active.category} • {active.badge}
                                </span>
                              </div>

                              {/* Raw Field Box */}
                              <div className="rounded-[6px] bg-black/80 border border-[#222222] p-2 font-mono text-xs text-purple-300 select-all">
                                {active.field}
                              </div>

                              {/* Plain English Translation */}
                              <div className="space-y-1">
                                <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                                  <Info className="h-3.5 w-3.5 text-cyan-400" />
                                  <span>Plain-English Translation</span>
                                </div>
                                <p className="text-xs sm:text-sm text-[#ededed] leading-relaxed pl-2 border-l-2 border-cyan-500/60">
                                  {active.plainEnglish}
                                </p>
                              </div>

                              {/* Technical Detail & RFC Note */}
                              <div className="space-y-1">
                                <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                                  <span>RFC Spec & Significance</span>
                                </div>
                                <p className="text-xs text-[#a1a1a1] leading-relaxed">
                                  {active.technicalDetail}
                                </p>
                              </div>

                              {/* Peer B's Answer Counterpart */}
                              <div className="rounded-[6px] border border-emerald-500/20 bg-emerald-950/10 p-2 space-y-1">
                                <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>Peer B's Answer Response</span>
                                </div>
                                <p className="text-xs text-[#a1a1a1] font-mono leading-relaxed">
                                  {active.answerResponse}
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {step2Tab === "diff" && (
                    <div className="h-full overflow-y-auto space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs font-mono font-semibold text-[#888888] pb-1 border-b border-[#222222]">
                        <div className="col-span-3">Negotiation Parameter</div>
                        <div className="col-span-4 text-purple-300">Peer A Offer (Proposed)</div>
                        <div className="col-span-5 text-cyan-300">Peer B Answer (Accepted)</div>
                      </div>

                      {[
                        {
                          param: "Video Codecs",
                          offer: "VP8 (96), H.264 (97)",
                          answer: "VP8 (96) - Selected primary decoder",
                          status: "Match (VP8)",
                        },
                        {
                          param: "Audio Codecs",
                          offer: "Opus (111), G.711 (0)",
                          answer: "Opus (111) - 48kHz Stereo match",
                          status: "Match (Opus)",
                        },
                        {
                          param: "DataChannel Port",
                          offer: "m=application 9 UDP/DTLS/SCTP",
                          answer: "m=application 9 UDP/DTLS/SCTP 5000",
                          status: "Agreed",
                        },
                        {
                          param: "DTLS Role Proposal",
                          offer: "a=setup:actpass (Either Role)",
                          answer: "a=setup:active (Peer B acts as client)",
                          status: "Resolved",
                        },
                        {
                          param: "ICE Candidates",
                          offer: "c=IN IP4 0.0.0.0 (Trickle ICE)",
                          answer: "c=IN IP4 0.0.0.0 (Trickle ICE)",
                          status: "Agreed",
                        },
                      ].map((row, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-12 gap-2 rounded-[6px] border border-[#1e1e1e] bg-[#0c0c0c] p-2 text-xs font-mono items-center"
                        >
                          <div className="col-span-3 text-[#ededed] font-semibold">{row.param}</div>
                          <div className="col-span-4 text-purple-300 bg-purple-950/20 px-2 py-1 rounded border border-purple-500/20">
                            {row.offer}
                          </div>
                          <div className="col-span-5 text-cyan-300 bg-cyan-950/20 px-2 py-1 rounded border border-cyan-500/20 flex items-center justify-between">
                            <span>{row.answer}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/60 text-emerald-400 font-bold ml-1 shrink-0">
                              {row.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {step2Tab === "raw" && (
                    <div className="h-full flex flex-col rounded-[6px] border border-[#202020] bg-black/90 p-2 overflow-hidden">
                      <div className="flex items-center justify-between text-xs font-mono text-[#888888] pb-1 border-b border-[#1a1a1a]">
                        <span>Session Description Protocol Payload</span>
                        <span>{sdpOffer ? "Live Generated Offer (42 lines)" : "Sample Offer Template"}</span>
                      </div>
                      <pre className="flex-1 min-h-0 overflow-y-auto pt-2 text-xs font-mono text-purple-300 leading-relaxed select-all">
                        {sdpOffer || defaultSampleSdp}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : currentStep === 3 ? (
          /* ============================================================== */
          /* STEP 3: FINDING THE PATH (ICE CANDIDATES) (Morphing Bento)    */
          /* ============================================================== */
          <motion.div
            key="step-3-bento"
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
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-purple-500/30 bg-purple-950/30 text-purple-400 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                      <Network className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Radio className="h-4 w-4 text-purple-400" />
                        <span className="text-sm sm:text-base font-bold text-[#ededed]">
                          Step 3 • Finding the Path (ICE Candidates)
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#888888]">Curriculum • Phase: Network Path Hunting & Hole Punching</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-[6px] border border-purple-500/40 bg-purple-950/30 text-purple-300 font-semibold shadow-[0_0_8px_rgba(168,85,247,0.15)]">
                    <Zap className="h-3.5 w-3.5 text-purple-400" />
                    <span>RFC 8445 • ICE</span>
                  </span>
                </div>

                {/* Dedicated 2-Line "Why Are We Doing This?" Card */}
                <div className="rounded-[8px] border border-purple-500/40 bg-gradient-to-r from-purple-950/30 via-purple-900/10 to-transparent p-2.5 space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-300">
                    <Target className="h-4 w-4 text-purple-400" />
                    <span>Why Are We Doing This?</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#ededed] leading-relaxed">
                    Video codecs are agreed, but neither browser knows what physical wire connects them.
                    ICE gathers every possible IP address and port (host LAN, STUN NAT pinholes, and TURN cloud relays) so the browsers can punch through firewalls and find the fastest route!
                  </p>
                </div>

                {/* The Core Problem & Baseline */}
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-semibold text-[#ededed] flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>The NAT & Firewall Blackout</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#a1a1a1] leading-relaxed">
                    Your laptop's local Wi-Fi IP (<code className="text-emerald-300">192.168.1.15</code>) is completely invisible to the outside world. Home routers use NAT to disguise internal devices. <strong className="text-[#ededed]">ICE collects candidate network coordinates</strong> across LAN, STUN, and TURN so peers can find a working path.
                  </p>
                </div>

                {/* Mental Model & Analogy */}
                <div className="rounded-[8px] border border-[#222222] bg-[#121212] p-2.5 space-y-1 text-xs sm:text-sm">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Mental Model & Analogy</span>
                  </span>
                  <p className="text-[#ededed] italic leading-relaxed">
                    "You want a friend in another city to visit your apartment. You give them: 1. Your Wi-Fi LAN address (if they are in the same room), 2. Your building's street address & buzz code (STUN), and 3. A trusted 24/7 postal concierge locker (TURN) if the front gate is locked."
                  </p>
                </div>

                {/* The WebRTC Rule */}
                <div className="text-xs sm:text-sm font-mono text-[#888888] space-y-0.5 border-l-2 border-purple-500/60 pl-2.5 py-0.5">
                  <p className="flex items-start gap-1.5">
                    <Key className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#ededed]">Key Protocol Fact:</strong> WebRTC uses <span className="underline decoration-purple-500 text-purple-200">Trickle ICE (RFC 8838)</span>. Candidates are streamed one-by-one over signaling as soon as the OS finds them, avoiding 8-second call setup delays!
                    </span>
                  </p>
                </div>
              </div>

              {/* Numbered Action Directives */}
              <div className="space-y-2 pt-2 border-t border-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Interactive Directives</span>
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-medium">Trickle Gathering</span>
                </div>

                <div className="flex gap-2">
                  <SpecularButton
                    onClick={handleStartHandshake}
                    data-testid="btn-start-offer"
                    className="flex-1 h-9 text-xs sm:text-sm font-semibold"
                  >
                    <Network className="h-3.5 w-3.5 mr-1 text-purple-400" />
                    <span>
                      {gatheredCandidates.length > 0
                        ? `Candidates Gathered (${gatheredCandidates.length} Active)`
                        : "1. Gather All Candidate Routes"}
                    </span>
                  </SpecularButton>

                  <button
                    type="button"
                    onClick={() => setSelectedCandidateIndex((prev) => (prev + 1) % iceCandidateEntries.length)}
                    className="px-3.5 h-9 rounded-[6px] border border-[#242424] bg-[#141414] text-xs sm:text-sm font-mono text-[#ededed] hover:border-[#404040] hover:bg-[#1a1a1a] transition-all flex items-center gap-1.5"
                    title="Inspect next ICE candidate"
                  >
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Candidate ({selectedCandidateIndex + 1}/{iceCandidateEntries.length})</span>
                  </button>
                </div>

                {/* Action Reaction Feed */}
                <div className="rounded-[8px] border border-[#262626] bg-[#111111] p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#ededed]">
                        {lastReaction.title}
                      </span>
                    </div>
                    {lastReaction.badge && (
                      <span className="rounded bg-[#1c1c1c] px-2 py-0.5 text-xs font-mono text-purple-300 border border-[#2c2c2c]">
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

            {/* RIGHT COLUMN: MULTI-PATH ROUTING RADAR & GATHERED CANDIDATES X-RAY (Col 7) */}
            <div className="col-span-12 lg:col-span-7 h-full min-h-0 flex flex-col gap-2.5">
              {/* TOP: MULTI-PATH ROUTING RADAR (Height ~40%) */}
              <div className="h-[40%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed] flex items-center gap-1.5">
                      <span>Multi-Path Routing Radar (ICE Connectivity Checks)</span>
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] border border-purple-500/30 bg-purple-950/20 text-purple-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{peerAConnectionState === "connected" ? "Direct P2P Verified" : "Checking Pairs"}</span>
                  </span>
                </div>

                {/* Multi-route pathway visualization */}
                <div className="relative my-auto flex items-center justify-between px-6 py-1">
                  {/* Peer A Node */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-purple-500/40 bg-purple-950/20 text-purple-300">
                      <Laptop className="h-4 w-4 text-purple-400 shrink-0" />
                      <div className="text-left font-mono">
                        <div className="text-xs font-semibold text-[#ededed]">Peer A (Offerer)</div>
                        <div className="text-[11px] text-[#888888]">192.168.1.15</div>
                      </div>
                      <span
                        data-testid="peer-a-state"
                        className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/60 text-purple-300 ml-1.5 border border-purple-500/30 font-semibold"
                      >
                        {peerAConnectionState}
                      </span>
                    </div>
                  </div>

                  {/* Tri-Path Wire Radar (LAN, STUN, TURN) */}
                  <div className="flex-1 flex flex-col justify-around h-24 py-1 mx-3">
                    {/* Path 1: Host LAN */}
                    <div className="flex items-center w-full gap-2">
                      <div className="flex-1 h-[1.5px] bg-[#222222]" />
                      <span className="px-2 py-0.5 rounded bg-[#111111] text-[10px] font-mono text-[#666666] border border-[#222222] shrink-0">
                        Host LAN (Different Subnets ➔ Unreachable)
                      </span>
                      <div className="flex-1 h-[1.5px] bg-[#222222]" />
                    </div>

                    {/* Path 2: STUN Reflexive Pinhole (Active Nominated Path) */}
                    <div className="relative flex items-center w-full gap-2">
                      <div className="flex-1 h-[2px] bg-gradient-to-r from-purple-500/40 via-purple-400 to-purple-500/40 relative">
                        <motion.div
                          className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,1)] absolute -top-0.5"
                          animate={{ left: ["0%", "100%"] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-[5px] bg-purple-950/60 text-[10px] font-mono text-purple-200 border border-purple-500/40 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.3)] flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>STUN srflx Pinhole (Nominated • 24ms)</span>
                      </span>
                      <div className="flex-1 h-[2px] bg-gradient-to-r from-purple-500/40 via-purple-400 to-purple-500/40" />
                    </div>

                    {/* Path 3: TURN Cloud Relay */}
                    <div className="flex items-center w-full gap-2">
                      <div className="flex-1 h-[1.5px] bg-[#222222]" />
                      <span className="px-2 py-0.5 rounded bg-[#111111] text-[10px] font-mono text-[#666666] border border-[#222222] shrink-0">
                        TURN Cloud Relay (Standby Fallback)
                      </span>
                      <div className="flex-1 h-[1.5px] bg-[#222222]" />
                    </div>
                  </div>

                  {/* Peer B Node */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-cyan-500/40 bg-cyan-950/20 text-cyan-300">
                      <Laptop className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div className="text-left font-mono">
                        <div className="text-xs font-semibold text-[#ededed]">Peer B (Callee)</div>
                        <div className="text-[11px] text-[#888888]">10.0.0.42</div>
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

                {/* Bottom 4 Status Tiles */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[#1e1e1e]">
                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Zap className="h-3 w-3 text-purple-400" />
                      <span>ICE Transport</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">Trickle (RFC 8838)</div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      <span>Highest Priority</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">Host (2,113,937,151)</div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                      <span>Nominated Pair</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">srflx ➔ srflx</div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Activity className="h-3 w-3 text-amber-400" />
                      <span>ICE State</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">
                      {peerAConnectionState === "connected" ? "Connected" : "Hunting Path"}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM: GATHERED CANDIDATES DEEP X-RAY (Height ~60%) */}
              <div className="h-[60%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed] flex items-center gap-1.5">
                      <span>Gathered Candidates</span>
                    </span>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center rounded-[6px] bg-[#141414] p-0.5 border border-[#222222]">
                      <button
                        type="button"
                        onClick={() => setStep3Tab("candidates")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step3Tab === "candidates"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Decoded Candidates</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep3Tab("pairs")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step3Tab === "pairs"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        <span>Pair Check Matrix</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep3Tab("anatomy")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step3Tab === "anatomy"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <FileCode className="h-3.5 w-3.5" />
                        <span>SDP Line Anatomy</span>
                      </button>
                    </div>

                    <span className="text-xs font-mono px-2 py-1 rounded-[6px] border border-[#242424] bg-[#141414] text-[#888888]">
                      {iceCandidateEntries.length} Types
                    </span>
                  </div>
                </div>

                {/* Tab Content Display */}
                <div className="flex-1 min-h-0 pt-2 overflow-hidden">
                  {/* TAB 1: DECODED CANDIDATES */}
                  {step3Tab === "candidates" && (
                    <div className="h-full grid grid-cols-12 gap-2.5">
                      {/* Left Sub-Col: List of 4 Candidate Types */}
                      <div className="col-span-5 h-full overflow-y-auto space-y-1.5 pr-1">
                        {iceCandidateEntries.map((cand, idx) => (
                          <button
                            key={cand.type}
                            type="button"
                            onClick={() => setSelectedCandidateIndex(idx)}
                            className={`w-full text-left rounded-[6px] p-2 border transition-all flex flex-col gap-1 ${
                              selectedCandidateIndex === idx
                                ? "border-purple-500/50 bg-purple-950/20 text-[#ededed] shadow-sm"
                                : "border-[#202020] bg-[#0d0d0d] text-[#888888] hover:border-[#333333] hover:text-[#ededed]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {cand.icon}
                                <span className="font-semibold text-xs text-[#ededed]">{cand.title}</span>
                              </div>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${cand.tagColor}`}>
                                {cand.badge}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#888888]">
                              <span className="text-purple-300 font-semibold">{cand.socket}</span>
                              <span>{cand.latency}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Right Sub-Col: Deep Candidate Breakdown Card */}
                      <div className="col-span-7 h-full overflow-y-auto rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-3 space-y-2.5">
                        {(() => {
                          const active = iceCandidateEntries[selectedCandidateIndex] || iceCandidateEntries[0];
                          return (
                            <>
                              <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                                <div className="flex items-center gap-2">
                                  {active.icon}
                                  <span className="font-semibold text-sm text-[#ededed]">{active.title}</span>
                                </div>
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30">
                                  {active.rfc}
                                </span>
                              </div>

                              {/* Candidate Socket & Priority Box */}
                              <div className="rounded-[6px] bg-black/80 border border-[#222222] p-2 font-mono text-xs flex items-center justify-between">
                                <span className="text-purple-300 select-all font-semibold">{active.socket}</span>
                                <span className="text-[#888888]">
                                  Priority: <strong className="text-emerald-400">{active.priority}</strong>
                                </span>
                              </div>

                              {/* Plain-English Translation */}
                              <div className="space-y-1">
                                <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                                  <Info className="h-3.5 w-3.5 text-cyan-400" />
                                  <span>Plain-English Translation</span>
                                </div>
                                <p className="text-xs sm:text-sm text-[#ededed] leading-relaxed pl-2 border-l-2 border-purple-500/60">
                                  {active.plainEnglish}
                                </p>
                              </div>

                              {/* Technical Detail & RFC Note */}
                              <div className="space-y-1">
                                <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                                  <span>RFC Specification & Priority Formula</span>
                                </div>
                                <p className="text-xs text-[#a1a1a1] leading-relaxed">
                                  {active.technicalDetail}
                                </p>
                              </div>

                              {/* Target Topology */}
                              <div className="rounded-[6px] border border-cyan-500/20 bg-cyan-950/10 p-2 space-y-0.5">
                                <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                                  <Network className="h-3.5 w-3.5 text-cyan-400" />
                                  <span>Best Suited Network Scenario</span>
                                </div>
                                <p className="text-xs text-[#a1a1a1] font-mono">
                                  {active.role} • Typical Round-Trip Latency: <strong className="text-[#ededed]">{active.latency}</strong>
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CANDIDATE PAIR MATRIX */}
                  {step3Tab === "pairs" && (
                    <div className="h-full overflow-y-auto space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs font-mono font-semibold text-[#888888] pb-1 border-b border-[#222222]">
                        <div className="col-span-2">Pair #</div>
                        <div className="col-span-3 text-purple-300">Local Candidate (A)</div>
                        <div className="col-span-3 text-cyan-300">Remote Candidate (B)</div>
                        <div className="col-span-4 text-emerald-400">STUN Check State & RTT</div>
                      </div>

                      {candidatePairEntries.map((pair, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-12 gap-2 rounded-[6px] border border-[#1e1e1e] bg-[#0c0c0c] p-2 text-xs font-mono items-center"
                        >
                          <div className="col-span-2 text-[#ededed] font-semibold">{pair.pairId}</div>
                          <div className="col-span-3 text-purple-300 bg-purple-950/20 px-2 py-1 rounded border border-purple-500/20 truncate">
                            {pair.local}
                          </div>
                          <div className="col-span-3 text-cyan-300 bg-cyan-950/20 px-2 py-1 rounded border border-cyan-500/20 truncate">
                            {pair.remote}
                          </div>
                          <div className="col-span-4 flex items-center justify-between">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${pair.stateColor}`}>
                              {pair.state}
                            </span>
                            <span className="text-[11px] text-[#888888] shrink-0 font-bold">{pair.rtt}</span>
                          </div>
                        </div>
                      ))}

                      <div className="text-xs font-mono text-[#888888] p-2 rounded bg-black/60 border border-[#1a1a1a] flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span>Pair states follow the 4-state check machine: <strong>Frozen</strong> ➔ <strong>Waiting</strong> ➔ <strong>In-Progress</strong> ➔ <strong>Succeeded</strong> (USE-CANDIDATE nomination).</span>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SDP LINE ANATOMY ANALYZER */}
                  {step3Tab === "anatomy" && (
                    <div className="h-full flex flex-col gap-2">
                      {/* Interactive Token Strip */}
                      <div className="rounded-[6px] border border-[#202020] bg-black/90 p-2.5">
                        <span className="text-[10px] font-mono uppercase text-[#777777] block mb-1">Click any token to dissect its RFC 8445 field:</span>
                        <div className="flex flex-wrap gap-1 font-mono text-xs">
                          {sdpAnatomyFields.map((field, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedAnatomyIndex(idx)}
                              className={`px-2 py-1 rounded-[4px] border transition-all ${
                                selectedAnatomyIndex === idx
                                  ? "bg-purple-950/60 border-purple-500 text-purple-200 font-bold shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                                  : "bg-[#141414] border-[#252525] text-purple-300 hover:border-[#444444]"
                              }`}
                            >
                              {field.token}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Selected Field Explainer */}
                      <div className="flex-1 min-h-0 rounded-[6px] border border-purple-500/30 bg-purple-950/10 p-3 space-y-1.5 overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-purple-500/20 pb-1">
                          <span className="font-semibold text-xs text-[#ededed] font-mono">
                            Token: <code className="text-purple-300 bg-black/60 px-1.5 py-0.5 rounded border border-purple-500/30">{sdpAnatomyFields[selectedAnatomyIndex].token}</code>
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-500/30">
                            {sdpAnatomyFields[selectedAnatomyIndex].rfc}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-purple-200">
                          {sdpAnatomyFields[selectedAnatomyIndex].name}
                        </div>
                        <p className="text-xs sm:text-sm text-[#ededed] leading-relaxed">
                          {sdpAnatomyFields[selectedAnatomyIndex].meaning}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : currentStep === 4 ? (
          /* ============================================================== */
          /* STEP 4: THE APARTMENT FRONT DESK (NAT BASICS) (Morphing Bento) */
          /* ============================================================== */
          <motion.div
            key="step-4-bento"
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
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-purple-500/30 bg-purple-950/30 text-purple-400 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Radio className="h-4 w-4 text-purple-400" />
                        <span className="text-sm sm:text-base font-bold text-[#ededed]">
                          Step 4 • The Apartment Front Desk (NAT Basics)
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#888888]">Curriculum • Phase: NAT Translation & Pinhole Punching</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-[6px] border border-purple-500/40 bg-purple-950/30 text-purple-300 font-semibold shadow-[0_0_8px_rgba(168,85,247,0.15)]">
                    <Zap className="h-3.5 w-3.5 text-purple-400" />
                    <span>RFC 3022 • NAT</span>
                  </span>
                </div>

                {/* Dedicated 2-Line "Why Are We Doing This?" Card */}
                <div className="rounded-[8px] border border-purple-500/40 bg-gradient-to-r from-purple-950/30 via-purple-900/10 to-transparent p-2.5 space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-300">
                    <Target className="h-4 w-4 text-purple-400" />
                    <span>Why Are We Doing This?</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#ededed] leading-relaxed">
                    Millions of homes share private IPs like <code>192.168.x.x</code> that are impossible to reach from outside.
                    Your home router rewrites packet headers through NAT and punches a temporary return <strong>pinhole</strong> so peers can stream video back!
                  </p>
                </div>

                {/* The Core Problem & Baseline */}
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-semibold text-[#ededed] flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>The One-Way Mirror Firewall Dilemma</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#a1a1a1] leading-relaxed">
                    By default, your home firewall silently drops unsolicited incoming packets from strangers. To receive video from Peer B, <strong className="text-[#ededed]">Peer A must first send an outbound packet through the router</strong>, which registers a 30-second stateful pinhole allowing Peer B's reply.
                  </p>
                </div>

                {/* Mental Model & Analogy */}
                <div className="rounded-[8px] border border-[#222222] bg-[#121212] p-2.5 space-y-1 text-xs sm:text-sm">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Mental Model & Analogy</span>
                  </span>
                  <p className="text-[#ededed] italic leading-relaxed">
                    "Your apartment building has one street address, but individual apartment numbers are secret from outside delivery drivers until the front desk logs your outgoing request."
                  </p>
                </div>

                {/* The WebRTC Rule */}
                <div className="text-xs sm:text-sm font-mono text-[#888888] space-y-0.5 border-l-2 border-purple-500/60 pl-2.5 py-0.5">
                  <p className="flex items-start gap-1.5">
                    <Key className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#ededed]">Key Protocol Fact:</strong> NAT pinholes have finite lease timers (usually 30–60s). WebRTC sends periodic <span className="underline decoration-purple-500 text-purple-200">STUN Consent Freshness</span> keep-alive pings (RFC 7675) every 2.5 seconds to keep the pinhole alive!
                    </span>
                  </p>
                </div>
              </div>

              {/* Numbered Action Directives */}
              <div className="space-y-2 pt-2 border-t border-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#777777] flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Interactive Directives</span>
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-medium">Outbound Translation</span>
                </div>

                <div className="flex gap-2">
                  <SpecularButton
                    onClick={handleTriggerNatSimulation}
                    className="flex-1 h-9 text-xs sm:text-sm font-semibold"
                  >
                    <Radio className="h-3.5 w-3.5 mr-1 text-purple-400" />
                    <span>Send Outbound Packet through NAT</span>
                  </SpecularButton>

                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (selectedNatTypeIndex + 1) % natTypeEntries.length;
                      setSelectedNatTypeIndex(nextIdx);
                      setStep4Tab("types");
                      const entry = natTypeEntries[nextIdx];
                      setLastReaction({
                        title: `NAT Router Switched: ${entry.type}`,
                        detail: `${entry.behavior} P2P Direct Punching Feasibility: ${entry.p2pFeasibility}. (Example: ${entry.example})`,
                        badge: entry.badge,
                        timestamp: new Date().toLocaleTimeString(),
                      });
                    }}
                    className="px-3.5 h-9 rounded-[6px] border border-[#242424] bg-[#141414] text-xs sm:text-sm font-mono text-[#ededed] hover:border-[#404040] hover:bg-[#1a1a1a] transition-all flex items-center gap-1.5"
                    title="Cycle and inspect NAT Router Types"
                  >
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    <span>NAT Type ({selectedNatTypeIndex + 1}/{natTypeEntries.length})</span>
                  </button>
                </div>

                {/* Action Reaction Feed */}
                <div className="rounded-[8px] border border-[#262626] bg-[#111111] p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#ededed]">
                        {lastReaction.title}
                      </span>
                    </div>
                    {lastReaction.badge && (
                      <span className="rounded bg-[#1c1c1c] px-2 py-0.5 text-xs font-mono text-purple-300 border border-[#2c2c2c]">
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

            {/* RIGHT COLUMN: SIMULATION STAGE & NAT DEEP X-RAY (Col 7) */}
            <div className="col-span-12 lg:col-span-7 h-full min-h-0 flex flex-col gap-2.5">
              {/* TOP: NAT PINHOLE & REWRITER STAGE (Height ~42%) */}
              <div className="h-[42%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed]">
                      NAT Pinhole & Packet Rewriting Engine
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-purple-500/30 bg-purple-950/20 text-purple-300">
                    [ILLUSTRATION: Educational Animation]
                  </span>
                </div>

                {/* Visual 3-Node Packet Transformation Highway */}
                <div className="relative my-auto flex items-center justify-between px-3 py-1">
                  {/* Node 1: Private LAN (Peer A) */}
                  <div className="flex flex-col items-center gap-1 z-10 w-36">
                    <div className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border border-emerald-500/40 bg-emerald-950/20 text-emerald-300">
                      <Laptop className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="text-left font-mono truncate">
                        <div className="text-[11px] font-semibold text-[#ededed]">Private LAN</div>
                        <div className="text-[10px] text-[#888888] truncate">192.168.1.15:54321</div>
                      </div>
                    </div>
                  </div>

                  {/* Wire 1: LAN to Router */}
                  <div className="relative flex-1 h-[2px] bg-[#222222] mx-2">
                    {natPacketInFlight && (
                      <motion.div
                        className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] absolute -top-1"
                        initial={{ left: "0%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                      />
                    )}
                    <div className="absolute left-1/2 -top-3 -translate-x-1/2 px-1.5 py-0.2 rounded bg-[#111111] text-[9px] font-mono text-[#777777] border border-[#202020] whitespace-nowrap">
                      Src: 192.168.1.15:54321
                    </div>
                  </div>

                  {/* Node 2: NAT Gateway Router */}
                  <div className="flex flex-col items-center gap-1 z-10 w-44">
                    <div className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[6px] border transition-all ${
                      natPinholeActive
                        ? "border-purple-500/60 bg-purple-950/30 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                        : "border-[#262626] bg-[#121212] text-[#888888]"
                    }`}>
                      <Server className="h-4 w-4 text-purple-400 shrink-0" />
                      <div className="text-left font-mono">
                        <div className="text-[11px] font-semibold text-[#ededed] flex items-center gap-1">
                          <span>NAT Gateway</span>
                        </div>
                        <div className="text-[10px] text-[#888888]">103.21.44.12:49152</div>
                      </div>
                    </div>
                  </div>

                  {/* Wire 2: Router to STUN Server */}
                  <div className="relative flex-1 h-[2px] bg-[#222222] mx-2">
                    {natPacketInFlight && (
                      <motion.div
                        className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,1)] absolute -top-1"
                        initial={{ left: "0%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 0.45, delay: 0.45, ease: "easeInOut" }}
                      />
                    )}
                    <div className="absolute left-1/2 -top-3 -translate-x-1/2 px-1.5 py-0.2 rounded bg-[#111111] text-[9px] font-mono text-purple-300 border border-purple-500/30 whitespace-nowrap">
                      Rewritten: 103.21.44.12:49152
                    </div>
                  </div>

                  {/* Node 3: Public STUN Server */}
                  <div className="flex flex-col items-center gap-1 z-10 w-40">
                    <div className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border border-cyan-500/40 bg-cyan-950/20 text-cyan-300">
                      <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div className="text-left font-mono truncate">
                        <div className="text-[11px] font-semibold text-[#ededed]">STUN Reflector</div>
                        <div className="text-[10px] text-[#888888] truncate">stun.l.google.com</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Chips Row */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[#1e1e1e]">
                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Shield className={`h-3 w-3 ${selectedNatTypeIndex === 3 ? "text-red-400" : "text-purple-400"}`} />
                      <span>NAT ({selectedNatTypeIndex + 1}/4)</span>
                    </div>
                    <div
                      className={`text-xs font-bold font-mono truncate ${
                        selectedNatTypeIndex === 3 ? "text-red-400" : "text-purple-300"
                      }`}
                      title={natTypeEntries[selectedNatTypeIndex]?.type}
                    >
                      {natTypeEntries[selectedNatTypeIndex]?.type.split(" ")[0]} {selectedNatTypeIndex === 3 ? "NAT" : "Cone"}
                    </div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Globe className="h-3 w-3 text-cyan-400" />
                      <span>Public WAN IP</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">103.21.44.12</div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      {selectedNatTypeIndex === 3 ? (
                        <ShieldAlert className="h-3 w-3 text-red-400" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      )}
                      <span>Pinhole State</span>
                    </div>
                    <div className={`text-xs font-bold font-mono truncate ${
                      selectedNatTypeIndex === 3
                        ? "text-red-400"
                        : natPinholeActive
                        ? "text-emerald-400"
                        : "text-[#777777]"
                    }`}>
                      {selectedNatTypeIndex === 3
                        ? "Blocked (Needs TURN)"
                        : natPinholeActive
                        ? "UDP:49152 Active"
                        : "Standby"}
                    </div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>Lease TTL</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono">
                      {natPinholeActive ? "28s Remaining" : "30s Default"}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM: NAT DEEP X-RAY & TRANSLATION INSPECTOR (Height ~58%) */}
              <div className="h-[58%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed] flex items-center gap-1.5">
                      <span>NAT Translation State & Protocol Inspector</span>
                    </span>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center rounded-[6px] bg-[#141414] p-0.5 border border-[#222222]">
                      <button
                        type="button"
                        onClick={() => setStep4Tab("table")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step4Tab === "table"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>Live Mapping Table</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep4Tab("types")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step4Tab === "types"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>4 NAT Types</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep4Tab("stun")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step4Tab === "stun"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <FileCode className="h-3.5 w-3.5" />
                        <span>STUN Packet X-Ray</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tab Content Display */}
                <div className="flex-1 min-h-0 pt-2 overflow-hidden">
                  {/* TAB 1: LIVE NAT MAPPING TABLE */}
                  {step4Tab === "table" && (
                    <div className="h-full overflow-y-auto space-y-1.5">
                      <div className="grid grid-cols-12 gap-2 text-xs font-mono font-semibold text-[#888888] pb-1 border-b border-[#222222]">
                        <div className="col-span-3">Internal Tuple (LAN)</div>
                        <div className="col-span-3 text-purple-300">Public Mapped Tuple</div>
                        <div className="col-span-3 text-cyan-300">Target Destination</div>
                        <div className="col-span-3 text-emerald-400">TTL & State</div>
                      </div>

                      {natMappingEntries.map((row) => (
                        <div
                          key={row.id}
                          className="grid grid-cols-12 gap-2 rounded-[6px] border border-[#1e1e1e] bg-[#0c0c0c] p-2 text-xs font-mono items-center"
                        >
                          <div className="col-span-3 text-[#ededed] font-semibold truncate">{row.internal}</div>
                          <div className="col-span-3 text-purple-300 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-500/20 truncate">
                            {row.external}
                          </div>
                          <div className="col-span-3 text-cyan-300 truncate">{row.destination}</div>
                          <div className="col-span-3 flex items-center justify-between">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${row.stateColor}`}>
                              {row.state}
                            </span>
                            <span className="text-[11px] text-[#888888] font-bold">{row.ttl}</span>
                          </div>
                        </div>
                      ))}

                      <div className="text-xs font-mono text-[#888888] p-2 rounded bg-black/60 border border-[#1a1a1a] flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span>Clicking 'Send Outbound Packet through NAT' creates an ephemeral translation rule in the router table above.</span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: 4 NAT TYPES COMPARISON */}
                  {step4Tab === "types" && (
                    <div className="h-full grid grid-cols-12 gap-2.5">
                      {/* Left Sub-Col: List of 4 NAT Types */}
                      <div className="col-span-5 h-full overflow-y-auto space-y-1.5 pr-1">
                        {natTypeEntries.map((nat, idx) => (
                          <button
                            key={nat.type}
                            type="button"
                            onClick={() => setSelectedNatTypeIndex(idx)}
                            className={`w-full text-left rounded-[6px] p-2 border transition-all flex flex-col gap-1 ${
                              selectedNatTypeIndex === idx
                                ? "border-purple-500/50 bg-purple-950/20 text-[#ededed] shadow-sm"
                                : "border-[#202020] bg-[#0d0d0d] text-[#888888] hover:border-[#333333] hover:text-[#ededed]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {nat.icon}
                                <span className="font-semibold text-xs text-[#ededed]">{nat.type}</span>
                              </div>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${nat.feasibilityColor}`}>
                                {nat.p2pFeasibility}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-[#888888] truncate">{nat.badge}</span>
                          </button>
                        ))}
                      </div>

                      {/* Right Sub-Col: Deep NAT Type Explainer */}
                      <div className="col-span-7 h-full overflow-y-auto rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-3 space-y-2.5">
                        {(() => {
                          const active = natTypeEntries[selectedNatTypeIndex] || natTypeEntries[0];
                          return (
                            <>
                              <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                                <div className="flex items-center gap-2">
                                  {active.icon}
                                  <span className="font-semibold text-sm text-[#ededed]">{active.type}</span>
                                </div>
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30">
                                  {active.rfc}
                                </span>
                              </div>

                              {/* Filtering Rule */}
                              <div className="space-y-1">
                                <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                                  <Info className="h-3.5 w-3.5 text-cyan-400" />
                                  <span>Firewall Filtering Behavior</span>
                                </div>
                                <p className="text-xs sm:text-sm text-[#ededed] leading-relaxed pl-2 border-l-2 border-purple-500/60">
                                  {active.behavior}
                                </p>
                              </div>

                              {/* P2P Hole Punching Verdict */}
                              <div className="space-y-1">
                                <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                                  <span>WebRTC P2P Feasibility Verdict</span>
                                </div>
                                <p className="text-xs text-[#a1a1a1] leading-relaxed">
                                  {active.p2pVerdict}
                                </p>
                              </div>

                              {/* Hardware Examples */}
                              <div className="rounded-[6px] border border-cyan-500/20 bg-cyan-950/10 p-2 space-y-0.5">
                                <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                                  <Server className="h-3.5 w-3.5 text-cyan-400" />
                                  <span>Typical Real-World Environments</span>
                                </div>
                                <p className="text-xs text-[#a1a1a1] font-mono">
                                  {active.example}
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: STUN PACKET X-RAY */}
                  {step4Tab === "stun" && (
                    <div className="h-full overflow-y-auto space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs font-mono font-semibold text-[#888888] pb-1 border-b border-[#222222]">
                        <div className="col-span-3">Field Token</div>
                        <div className="col-span-4 text-purple-300">RFC 8489 Header/Attribute Name</div>
                        <div className="col-span-5 text-cyan-300">Protocol Significance</div>
                      </div>

                      {stunPacketFields.map((field, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-12 gap-2 rounded-[6px] border border-[#1e1e1e] bg-[#0c0c0c] p-2 text-xs font-mono items-center"
                        >
                          <div className="col-span-3 font-bold text-purple-300 bg-black/60 px-2 py-1 rounded border border-purple-500/30 truncate">
                            {field.token}
                          </div>
                          <div className="col-span-4 text-[#ededed] font-semibold">{field.name}</div>
                          <div className="col-span-5 text-[#a1a1a1] leading-normal text-[11px]">{field.meaning}</div>
                        </div>
                      ))}

                      <div className="text-xs font-mono text-[#888888] p-2 rounded bg-black/60 border border-[#1a1a1a] flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span>STUN uses XOR-MAPPED-ADDRESS instead of plain MAPPED-ADDRESS to prevent NAT routers with Application Layer Gateways (ALGs) from modifying the IP payload.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : currentStep === 5 ? (
          /* ============================================================== */
          /* STEP 5: HOOKING UP THE CAMERAS (MEDIA STREAMS & TRACKS) BENTO  */
          /* ============================================================== */
          <motion.div
            key="step-5-media-bento"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-h-0 w-full grid grid-cols-12 grid-rows-1 gap-2.5"
          >
            {/* LEFT COLUMN: GUIDANCE, DIRECTIVES & REACTION FEED (Col 5) */}
            <div className="col-span-12 lg:col-span-5 h-full min-h-0 flex flex-col justify-between overflow-hidden rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3.5 shadow-sm">
              <div className="space-y-2 overflow-y-auto pr-1">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono tracking-wider uppercase text-purple-300 font-semibold">
                      Step 5 of 6 • Curriculum
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-purple-500/30 bg-purple-950/20 text-purple-300">
                      RFC 8829 • W3C Media Capture
                    </span>
                  </div>
                  {mediaStatus !== "idle" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-emerald-500/40 bg-emerald-950/30 text-emerald-400 font-bold">
                      Feed Active
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#ededed]">
                    Hooking up the Cameras (Media Streams & Tracks)
                  </h2>
                  <p className="text-xs text-[#888888]">
                    Acquiring hardware camera & mic buffers, negotiating codecs, and streaming RTP tracks.
                  </p>
                </div>

                {/* 2-line "Why Are We Doing This?" Card */}
                <div className="rounded-[6px] border border-purple-500/30 bg-purple-950/20 p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-200">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Why Are We Doing This?</span>
                  </div>
                  <p className="text-xs text-purple-200/90 leading-relaxed font-mono">
                    Before peers can stream live video, the browser must capture hardware devices via <code className="text-purple-300 font-bold">getUserMedia()</code>, package raw buffers into discrete <code className="text-purple-300 font-bold">MediaStreamTracks</code>, and bind them to the RTCPeerConnection for hardware-accelerated encoding.
                  </p>
                </div>

                {/* The Media Capture Pipeline */}
                <div className="rounded-[6px] border border-[#222222] bg-[#121212] p-2 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-cyan-400" />
                    <span>The Media Capture Pipeline</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] pt-1">
                    <div className="p-1 rounded bg-[#181818] border border-[#262626] text-[#ededed]">
                      Hardware (Mic/Cam)
                    </div>
                    <div className="p-1 rounded bg-[#181818] border border-[#262626] text-purple-300">
                      getUserMedia()
                    </div>
                    <div className="p-1 rounded bg-[#181818] border border-[#262626] text-cyan-300">
                      MediaStreamTrack
                    </div>
                    <div className="p-1 rounded bg-[#181818] border border-[#262626] text-emerald-300">
                      DTLS-SRTP RTP
                    </div>
                  </div>
                </div>

                {/* Mental Model & Analogy */}
                <div className="rounded-[6px] border border-[#222222] bg-[#121212] p-2.5 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    <span>Mental Model & Analogy</span>
                  </div>
                  <p className="text-xs text-[#a1a1a1] leading-relaxed">
                    <strong className="text-[#ededed]">The TV Broadcast Studio: </strong>
                    A camera is not one monolith — it produces separate Video and Audio Tracks. The audio/video mixing board synchronizes them into a single broadcast program feed (<code className="text-purple-300">MediaStream</code>). The director can mute a microphone fader (<code className="text-purple-300">audioTrack.enabled = false</code>) without tearing down the satellite transmission link!
                  </p>
                </div>

                {/* Key Protocol Fact */}
                <div className="rounded-[6px] border border-[#222222] bg-[#121212] p-2.5 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-purple-400" />
                    <span>Key Protocol Fact: Zero-Renegotiation Muting (RFC 8829)</span>
                  </div>
                  <p className="text-xs text-[#a1a1a1] leading-relaxed">
                    Toggling <code className="text-purple-300">track.enabled = false</code> sends black video frames or silence over existing SRTP packets without triggering renegotiation. In contrast, removing a track requires a full SDP Offer/Answer round-trip!
                  </p>
                </div>
              </div>

              {/* Lower Section: Interactive Directives & Reaction */}
              <div className="pt-2 space-y-2 border-t border-[#1e1e1e]">
                {/* Primary & Quick Action Controls */}
                <div className="space-y-1.5">
                  <SpecularButton
                    onClick={handleRequestMedia}
                    className="w-full h-9 text-xs sm:text-sm font-semibold shadow-sm"
                  >
                    <Video className="h-4 w-4 mr-1 text-purple-400" />
                    <span>Request Camera / Synthetic Feed</span>
                  </SpecularButton>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleMic}
                      className={`h-8 rounded-[6px] border text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                        isMicMuted
                          ? "border-red-500/50 bg-red-950/20 text-red-300"
                          : "border-[#242424] bg-[#141414] text-[#ededed] hover:border-[#404040]"
                      }`}
                    >
                      {isMicMuted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-emerald-400" />}
                      <span>{isMicMuted ? "Mic Muted" : "Mute Mic"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleVideo}
                      className={`h-8 rounded-[6px] border text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                        isVideoMuted
                          ? "border-amber-500/50 bg-amber-950/20 text-amber-300"
                          : "border-[#242424] bg-[#141414] text-[#ededed] hover:border-[#404040]"
                      }`}
                    >
                      {isVideoMuted ? <VideoOff className="h-3.5 w-3.5 text-amber-400" /> : <Video className="h-3.5 w-3.5 text-purple-400" />}
                      <span>{isVideoMuted ? "Cam Off" : "Cam On"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = selectedResolution === "720p" ? "1080p" : selectedResolution === "1080p" ? "480p" : "720p";
                        handleSetResolutionPreset(next);
                      }}
                      className="h-8 rounded-[6px] border border-[#242424] bg-[#141414] text-xs font-mono text-[#ededed] hover:border-[#404040] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{selectedResolution.toUpperCase()}</span>
                    </button>
                  </div>

                  {mediaStatus !== "idle" && (
                    <button
                      type="button"
                      onClick={handleStopMedia}
                      className="w-full h-8 rounded-[6px] border border-red-500/40 bg-red-950/20 text-xs font-mono text-red-300 hover:border-red-500/60 hover:bg-red-950/40 transition-all flex items-center justify-center gap-1.5"
                      title="Turn off camera and mic hardware, releasing browser device permissions"
                    >
                      <PhoneOff className="h-3.5 w-3.5 text-red-400" />
                      <span>Release Hardware / Stop Tracks (track.stop)</span>
                    </button>
                  )}
                </div>

                {/* Action Reaction Feed */}
                <div className="rounded-[8px] border border-[#262626] bg-[#111111] p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#ededed]">
                        {lastReaction.title}
                      </span>
                    </div>
                    {lastReaction.badge && (
                      <span className="rounded bg-[#1c1c1c] px-2 py-0.5 text-xs font-mono text-purple-300 border border-[#2c2c2c]">
                        {lastReaction.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#a1a1a1] font-mono leading-relaxed truncate">
                    {lastReaction.detail}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SIMULATION STAGE & TRACK DEEP X-RAY (Col 7) */}
            <div className="col-span-12 lg:col-span-7 h-full min-h-0 flex flex-col gap-2.5">
              {/* TOP: LIVE CAMERA / SYNTHETIC MONITOR STAGE (Height ~44%) */}
              <div className="h-[44%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed]">
                      Media Studio & Stream Monitor
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border ${
                        mediaStatus !== "idle"
                          ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400 font-bold"
                          : "border-[#262626] bg-[#141414] text-[#777777]"
                      }`}
                    >
                      {mediaStatus !== "idle" ? "Hardware Online" : "Stream Standby"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-purple-500/30 bg-purple-950/20 text-purple-300">
                      [STUDIO PREVIEW]
                    </span>
                  </div>
                </div>

                {/* Video Monitor Box with HUD */}
                <div className="relative my-auto h-[68%] w-full overflow-hidden rounded-[6px] border border-[#242424] bg-black flex items-center justify-center">
                  {localMediaStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full object-contain transition-opacity duration-300 ${
                        isVideoMuted ? "opacity-15 filter grayscale" : "opacity-100"
                      }`}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-center p-3">
                      <Video className="h-7 w-7 text-purple-500/40 animate-pulse" />
                      <span className="text-xs font-mono text-[#a1a1a1]">No Active MediaStream Detected</span>
                      <span className="text-[10px] text-[#666666]">
                        Click "Request Camera / Synthetic Feed" to capture hardware or 30fps test pattern
                      </span>
                    </div>
                  )}

                  {/* Black Frames Overlay when Video Disabled */}
                  {isVideoMuted && localMediaStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-1 z-20">
                      <VideoOff className="h-6 w-6 text-amber-400" />
                      <span className="text-xs font-mono text-amber-300 font-semibold">Video Track Disabled</span>
                      <span className="text-[10px] font-mono text-[#888888]">Transmitting Black Frames (Zero SDP Renegotiation)</span>
                    </div>
                  )}

                  {/* Live HUD Overlays */}
                  {mediaStatus !== "idle" && (
                    <>
                      {/* Top Left: Rec status */}
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-[4px] bg-black/70 px-2 py-0.5 border border-[#2a2a2a] text-[10px] font-mono text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>LIVE STREAM • 30 FPS</span>
                      </div>

                      {/* Top Right: Resolution Badge */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-[4px] bg-black/70 px-2 py-0.5 border border-purple-500/30 text-[10px] font-mono text-purple-300">
                        <span className="font-semibold">{selectedResolution.toUpperCase()}</span>
                        <span className="text-[#888888]">({selectedResolution === "1080p" ? "1920x1080" : selectedResolution === "720p" ? "1280x720" : "640x480"})</span>
                      </div>

                      {/* Bottom Left: Audio VU Meter */}
                      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-[4px] bg-black/70 px-2 py-1 border border-[#2a2a2a]">
                        {isMicMuted ? (
                          <VolumeX className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <div className="flex items-end gap-0.5 h-3 w-16">
                          <span className={`w-1 rounded-sm transition-all ${isMicMuted ? "h-1 bg-red-500/40" : "h-2 bg-emerald-400 animate-pulse"}`} />
                          <span className={`w-1 rounded-sm transition-all ${isMicMuted ? "h-1 bg-red-500/40" : "h-3 bg-emerald-400 animate-bounce"}`} />
                          <span className={`w-1 rounded-sm transition-all ${isMicMuted ? "h-1 bg-red-500/40" : "h-2.5 bg-emerald-400"}`} />
                          <span className={`w-1 rounded-sm transition-all ${isMicMuted ? "h-1 bg-red-500/40" : "h-1.5 bg-emerald-400"}`} />
                          <span className={`w-1 rounded-sm transition-all ${isMicMuted ? "h-1 bg-red-500/40" : "h-2 bg-emerald-400 animate-pulse"}`} />
                        </div>
                        <span className="text-[9px] font-mono text-[#888888]">
                          {isMicMuted ? "MUTED" : "48kHz"}
                        </span>
                      </div>

                      {/* Bottom Right: Codec Encryption */}
                      <div className="absolute bottom-2 right-2 z-10 rounded-[4px] bg-black/70 px-2 py-0.5 border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
                        VP8 • SRTP Encrypted
                      </div>
                    </>
                  )}
                </div>

                {/* Status Chips Row */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[#1e1e1e]">
                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Video className={`h-3 w-3 ${isVideoMuted ? "text-amber-400" : "text-purple-400"}`} />
                      <span>Video Track</span>
                    </div>
                    <div className={`text-xs font-bold font-mono truncate ${
                      isVideoMuted ? "text-amber-400" : mediaStatus !== "idle" ? "text-purple-300" : "text-[#777777]"
                    }`}>
                      {isVideoMuted ? "Disabled (Black)" : mediaStatus !== "idle" ? "Live (30 FPS)" : "Standby"}
                    </div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Mic className={`h-3 w-3 ${isMicMuted ? "text-red-400" : "text-cyan-400"}`} />
                      <span>Audio Track</span>
                    </div>
                    <div className={`text-xs font-bold font-mono truncate ${
                      isMicMuted ? "text-red-400" : mediaStatus !== "idle" ? "text-cyan-300" : "text-[#777777]"
                    }`}>
                      {isMicMuted ? "Muted (Silence)" : mediaStatus !== "idle" ? "Active (Opus)" : "Standby"}
                    </div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Radio className="h-3 w-3 text-emerald-400" />
                      <span>Codecs</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono truncate">
                      VP8 / Opus
                    </div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Shield className="h-3 w-3 text-purple-400" />
                      <span>Encryption</span>
                    </div>
                    <div className="text-xs font-bold text-purple-300 font-mono">
                      DTLS 1.3 / SRTP
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM: MEDIASTREAM & TRACK DEEP X-RAY (Height ~56%) */}
              <div className="h-[56%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed] flex items-center gap-1.5">
                      <span>W3C MediaStream & Track Inspector</span>
                    </span>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center rounded-[6px] bg-[#141414] p-0.5 border border-[#222222]">
                      <button
                        type="button"
                        onClick={() => setStep5Tab("tracks")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step5Tab === "tracks"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Live Track Telemetry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep5Tab("constraints")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step5Tab === "constraints"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Constraints Playground</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep5Tab("states")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step5Tab === "states"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <Activity className="h-3.5 w-3.5" />
                        <span>W3C State Machine</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tab Content Display */}
                <div className="flex-1 min-h-0 pt-2 overflow-hidden">
                  {/* TAB 1: LIVE TRACK TELEMETRY */}
                  {step5Tab === "tracks" && (
                    <div className="h-full grid grid-cols-12 gap-2.5">
                      {/* Sub-Col 1: Video Track */}
                      <div className="col-span-6 h-full overflow-y-auto rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-2.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Video className="h-3.5 w-3.5 text-purple-400" />
                            <span className="font-semibold text-xs text-[#ededed]">Video Track (MediaStreamTrack)</span>
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            isVideoMuted ? "border-amber-500/30 text-amber-300 bg-amber-950/20" : "border-emerald-500/30 text-emerald-300 bg-emerald-950/20"
                          }`}>
                            {isVideoMuted ? "enabled: false" : "enabled: true"}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>track.id</span>
                            <span className="text-purple-300">track-vid-8829-01</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>track.kind</span>
                            <span className="text-[#ededed]">"video"</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>track.label</span>
                            <span className="text-[#ededed] truncate max-w-[180px]">
                              {mediaStatus === "live" ? "FaceTime HD Camera (Built-in)" : "Synthetic 30fps Canvas"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>track.readyState</span>
                            <span className={mediaStatus !== "idle" ? "text-emerald-400 font-bold" : "text-[#777777]"}>
                              "{mediaStatus !== "idle" ? "live" : "ended"}"
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>resolution / fps</span>
                            <span className="text-cyan-300 font-semibold">{selectedResolution.toUpperCase()} • 30fps</span>
                          </div>
                          <div className="flex justify-between py-1 text-[#888888]">
                            <span>track.contentHint</span>
                            <span className="text-[#ededed]">"motion" (Smooth Video)</span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-Col 2: Audio Track */}
                      <div className="col-span-6 h-full overflow-y-auto rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-2.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Mic className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="font-semibold text-xs text-[#ededed]">Audio Track (MediaStreamTrack)</span>
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            isMicMuted ? "border-red-500/30 text-red-300 bg-red-950/20" : "border-emerald-500/30 text-emerald-300 bg-emerald-950/20"
                          }`}>
                            {isMicMuted ? "enabled: false" : "enabled: true"}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>track.id</span>
                            <span className="text-cyan-300">track-aud-8829-02</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>track.kind</span>
                            <span className="text-[#ededed]">"audio"</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>track.label</span>
                            <span className="text-[#ededed] truncate max-w-[180px]">MacBook Microphone (Built-in)</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>channels / sampleRate</span>
                            <span className="text-cyan-300">2 (Stereo) • 48000 Hz</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-[#181818] text-[#888888]">
                            <span>dsp echoCancellation</span>
                            <span className={echoCancellation ? "text-emerald-400" : "text-[#777777]"}>
                              {echoCancellation ? "true (Active)" : "false"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 text-[#888888]">
                            <span>track.contentHint</span>
                            <span className="text-[#ededed]">"speech" (Opus Voice)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CONSTRAINTS PLAYGROUND */}
                  {step5Tab === "constraints" && (
                    <div className="h-full grid grid-cols-12 gap-2.5">
                      {/* Left: Interactive Controls */}
                      <div className="col-span-6 h-full overflow-y-auto space-y-2 pr-1">
                        <div className="space-y-1">
                          <span className="text-[11px] font-mono text-[#888888] uppercase block">Resolution Constraint (video.width / height)</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["480p", "720p", "1080p"] as const).map((res) => (
                              <button
                                key={res}
                                type="button"
                                onClick={() => handleSetResolutionPreset(res)}
                                className={`h-8 rounded-[4px] border text-xs font-mono transition-all ${
                                  selectedResolution === res
                                    ? "border-purple-500/60 bg-purple-950/30 text-purple-300 font-bold"
                                    : "border-[#222222] bg-[#121212] text-[#888888] hover:text-[#ededed]"
                                }`}
                              >
                                {res.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-mono text-[#888888] uppercase block">Target Frame Rate (video.frameRate)</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {([24, 30, 60] as const).map((fps) => (
                              <button
                                key={fps}
                                type="button"
                                onClick={() => setSelectedFrameRate(fps)}
                                className={`h-8 rounded-[4px] border text-xs font-mono transition-all ${
                                  selectedFrameRate === fps
                                    ? "border-purple-500/60 bg-purple-950/30 text-purple-300 font-bold"
                                    : "border-[#222222] bg-[#121212] text-[#888888] hover:text-[#ededed]"
                                }`}
                              >
                                {fps} FPS
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-mono text-[#888888] uppercase block">Audio DSP Processing</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEchoCancellation((p) => !p)}
                              className={`h-8 rounded-[4px] border text-[11px] font-mono transition-all ${
                                echoCancellation
                                  ? "border-cyan-500/60 bg-cyan-950/30 text-cyan-300"
                                  : "border-[#222222] bg-[#121212] text-[#666666]"
                              }`}
                            >
                              Echo Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => setNoiseSuppression((p) => !p)}
                              className={`h-8 rounded-[4px] border text-[11px] font-mono transition-all ${
                                noiseSuppression
                                  ? "border-cyan-500/60 bg-cyan-950/30 text-cyan-300"
                                  : "border-[#222222] bg-[#121212] text-[#666666]"
                              }`}
                            >
                              Noise Suppress
                            </button>
                            <button
                              type="button"
                              onClick={() => setAutoGainControl((p) => !p)}
                              className={`h-8 rounded-[4px] border text-[11px] font-mono transition-all ${
                                autoGainControl
                                  ? "border-cyan-500/60 bg-cyan-950/30 text-cyan-300"
                                  : "border-[#222222] bg-[#121212] text-[#666666]"
                              }`}
                            >
                              Auto Gain
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Generated JSON code block */}
                      <div className="col-span-6 h-full overflow-y-auto rounded-[6px] border border-[#202020] bg-[#050505] p-2.5 font-mono text-[11px] text-[#ededed]">
                        <div className="text-[10px] text-[#888888] border-b border-[#1c1c1c] pb-1 mb-1.5 flex justify-between">
                          <span>GENERATED MediaTrackConstraints</span>
                          <span className="text-purple-400">navigator.mediaDevices.getUserMedia()</span>
                        </div>
                        <pre className="text-purple-300/90 leading-relaxed overflow-x-auto">
{`const constraints = {
  video: {
    width: { ideal: ${selectedResolution === "1080p" ? 1920 : selectedResolution === "720p" ? 1280 : 640} },
    height: { ideal: ${selectedResolution === "1080p" ? 1080 : selectedResolution === "720p" ? 720 : 480} },
    frameRate: { ideal: ${selectedFrameRate} }
  },
  audio: {
    echoCancellation: ${echoCancellation},
    noiseSuppression: ${noiseSuppression},
    autoGainControl: ${autoGainControl}
  }
};
const stream = await navigator.mediaDevices.getUserMedia(constraints);`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: W3C STATE MACHINE */}
                  {step5Tab === "states" && (
                    <div className="h-full overflow-y-auto space-y-2 pr-1 text-xs font-mono">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="rounded-[6px] border border-[#262626] bg-[#0c0c0c] p-2 space-y-1">
                          <div className="text-xs font-bold text-cyan-300">1. INITIAL</div>
                          <div className="text-[11px] text-[#888888]">Before getUserMedia(). Track object does not exist. Hardware idle.</div>
                          <div className="text-[10px] text-cyan-400 font-semibold">SDP: m=video inactive</div>
                        </div>

                        <div className="rounded-[6px] border border-emerald-500/40 bg-emerald-950/20 p-2 space-y-1">
                          <div className="text-xs font-bold text-emerald-400">2. LIVE</div>
                          <div className="text-[11px] text-[#888888]">User granted permission. Camera capturing frames. Encoded into SRTP.</div>
                          <div className="text-[10px] text-emerald-300 font-semibold">SDP: m=video sendrecv</div>
                        </div>

                        <div className="rounded-[6px] border border-amber-500/40 bg-amber-950/20 p-2 space-y-1">
                          <div className="text-xs font-bold text-amber-300">3. DISABLED (Muted)</div>
                          <div className="text-[11px] text-[#888888]">track.enabled = false. Emits black frames or silence. Hardware stays ON.</div>
                          <div className="text-[10px] text-amber-400 font-bold">Zero Renegotiation!</div>
                        </div>

                        <div className="rounded-[6px] border border-red-500/40 bg-red-950/20 p-2 space-y-1">
                          <div className="text-xs font-bold text-red-400">4. ENDED</div>
                          <div className="text-[11px] text-[#888888]">track.stop() called. Hardware LED powers off. Permanent termination.</div>
                          <div className="text-[10px] text-red-300 font-semibold">Requires Offer/Answer</div>
                        </div>
                      </div>

                      <div className="rounded-[6px] border border-purple-500/30 bg-purple-950/20 p-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                          <span className="text-purple-200">
                            <strong>RTCRtpSender.replaceTrack()</strong> lets you swap cameras (front ➔ back or screen share) without any renegotiation glitch!
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-purple-400 font-semibold">RFC 8829 §5.2</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ============================================================== */
          /* STEP 6: THE DIRECT WIRE (DATA CHANNELS & LIVE P2P CALL) BENTO  */
          /* ============================================================== */
          <motion.div
            key="step-6-direct-wire-bento"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-h-0 w-full grid grid-cols-12 grid-rows-1 gap-2.5"
          >
            {/* LEFT COLUMN: GUIDANCE, DIRECTIVES, QUICK CHAT & CALL CONTROLS (Col 4) */}
            <div className="col-span-12 lg:col-span-4 h-full min-h-0 flex flex-col justify-between overflow-hidden rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3.5 shadow-sm">
              <div className="space-y-2 overflow-y-auto pr-1">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono tracking-wider uppercase text-purple-300 font-semibold">
                      Step 6 of 6 • Curriculum
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-purple-500/30 bg-purple-950/20 text-purple-300">
                      RFC 8831 • SCTP over DTLS
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border ${
                      peerAConnectionState === "connected" && peerBConnectionState === "connected"
                        ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-400 font-bold"
                        : "border-[#262626] bg-[#141414] text-[#777777]"
                    }`}
                  >
                    {peerAConnectionState === "connected" && peerBConnectionState === "connected" ? "Direct P2P Active" : "Negotiating"}
                  </span>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#ededed]">
                    The Direct Wire (Data Channels)
                  </h2>
                  <p className="text-xs text-[#888888]">
                    Bidirectional arbitrary data packets & real-time video streaming with zero server relay.
                  </p>
                </div>

                {/* 2-line "Why Are We Doing This?" Card */}
                <div className="rounded-[6px] border border-purple-500/30 bg-purple-950/20 p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-200">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Why Are We Doing This?</span>
                  </div>
                  <p className="text-xs text-purple-200/90 leading-relaxed font-mono">
                    Signaling and NAT hole-punching are complete. Now Peer A and Peer B exchange encrypted binary data and video directly between their network sockets over DTLS-SRTP and SCTP with zero server latency or eavesdropping.
                  </p>
                </div>

                {/* Mental Model & Analogy */}
                <div className="rounded-[6px] border border-[#222222] bg-[#121212] p-2.5 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    <span>Mental Model & Analogy</span>
                  </div>
                  <p className="text-xs text-[#a1a1a1] leading-relaxed">
                    <strong className="text-[#ededed]">The Private Transatlantic Cable: </strong>
                    The matchmaker introduced you, the contracts were exchanged, and the front-desk pinholes are punched. You now hold a direct private wire. Even if the signaling server crashes right now, this call and data channel will stay active!
                  </p>
                </div>

                {/* Key Protocol Fact */}
                <div className="rounded-[6px] border border-[#222222] bg-[#121212] p-2.5 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-purple-400" />
                    <span>Key Protocol Fact: SCTP Reliability & Ordering</span>
                  </div>
                  <p className="text-xs text-[#a1a1a1] leading-relaxed">
                    Unlike WebSockets (TCP only), WebRTC Data Channels let developers configure message reliability: reliable/ordered (like TCP file transfers) or unreliable/unordered (like UDP game state or sensor updates).
                  </p>
                </div>
              </div>

              {/* Lower Section: Interactive Directives & Reaction */}
              <div className="pt-2 space-y-2 border-t border-[#1e1e1e]">
                {/* Primary Action Button */}
                <SpecularButton
                  onClick={handleStartHandshake}
                  data-testid="btn-start-offer"
                  className="w-full h-8 text-xs font-semibold shadow-sm"
                >
                  <Zap className="h-3.5 w-3.5 mr-1 text-purple-400" />
                  <span>Establish Direct SCTP Data Wire</span>
                </SpecularButton>

                {/* Peer A Quick Send Bar */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#888888] flex items-center justify-between">
                    <span>Peer A (Caller) ➔ Send to B:</span>
                    <span className="text-[10px] text-emerald-400">sctp:0</span>
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Message to Peer B..."
                      value={messageInputA}
                      onChange={(e) => setMessageInputA(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendA()}
                      data-testid="input-msg-a"
                      className="h-7 flex-1 rounded-[4px] border border-[#242424] bg-[#050505] px-2 text-xs font-mono text-[#ededed] placeholder:text-[#555555] focus:border-purple-500/50 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendA}
                      data-testid="btn-send-a"
                      className="inline-flex h-7 items-center justify-center rounded-[4px] border border-purple-500/40 bg-purple-950/30 px-2.5 text-xs font-mono text-purple-300 hover:border-purple-500/70 transition-colors"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>

                {/* End Call / Hardware Release Button */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="w-full h-7 rounded-[4px] border border-red-500/40 bg-red-950/20 text-xs font-mono text-red-300 hover:border-red-500/60 hover:bg-red-950/40 transition-all flex items-center justify-center gap-1.5"
                  title="Close RTCPeerConnection and stop all hardware media tracks"
                >
                  <PhoneOff className="h-3.5 w-3.5 text-red-400" />
                  <span>End Call / Close PeerConnection</span>
                </button>

                {/* Action Reaction Feed */}
                <div className="rounded-[8px] border border-[#262626] bg-[#111111] p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-[#ededed] truncate">
                        {lastReaction.title}
                      </span>
                    </div>
                    {lastReaction.badge && (
                      <span className="rounded bg-[#1c1c1c] px-2 py-0.5 text-xs font-mono text-purple-300 border border-[#2c2c2c]">
                        {lastReaction.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#a1a1a1] font-mono leading-relaxed truncate">
                    {lastReaction.detail}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DUAL-PEER STUDIO & DATACHANNEL TERMINAL (Col 8) */}
            <div className="col-span-12 lg:col-span-8 h-full min-h-0 flex flex-col gap-2.5">
              {/* TOP: DUAL-PEER LIVE CALL STUDIO (Height ~48%) */}
              <div className="h-[48%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed]">
                      Direct P2P Encrypted Studio
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-purple-500/30 bg-purple-950/20 text-purple-300">
                      DTLS 1.3 • AES_128_GCM
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-cyan-500/30 bg-cyan-950/20 text-cyan-300">
                      SCTP Association Open
                    </span>
                  </div>
                </div>

                {/* Dual Monitors Highway with Direct Tunnel in Middle */}
                <div className="relative my-auto grid grid-cols-12 gap-3 items-center">
                  {/* Peer A Box */}
                  <div className="col-span-5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold text-[#ededed]">Peer A (Caller)</span>
                      </div>
                      <span
                        data-testid="peer-a-state"
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          peerAConnectionState === "connected"
                            ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-400 font-bold"
                            : "border-[#262626] bg-[#141414] text-[#888888]"
                        }`}
                      >
                        {peerAConnectionState}
                      </span>
                    </div>

                    <div className="relative aspect-video w-full overflow-hidden rounded-[6px] border border-[#242424] bg-black flex items-center justify-center">
                      {localMediaStream ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`h-full w-full object-cover ${isVideoMuted ? "opacity-15 filter grayscale" : ""}`}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-center p-2">
                          <Video className="h-5 w-5 text-[#404040]" />
                          <span className="text-[10px] font-mono text-[#666666]">Local Stream Idle</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1.5 text-[9px] font-mono text-[#888888] bg-black/60 px-1 rounded">
                        192.168.1.15:54321
                      </span>
                    </div>
                  </div>

                  {/* Middle: The Direct Wire Tunnel */}
                  <div className="col-span-2 flex flex-col items-center justify-center gap-1.5 py-2">
                    <div className="w-full relative h-[3px] bg-[#222222]">
                      <motion.div
                        className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,1)] absolute -top-[2.5px]"
                        animate={{ left: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <Lock className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-[9px] font-mono text-purple-300 font-bold whitespace-nowrap">Direct Pipe</span>
                      <span className="text-[8px] font-mono text-[#666666] whitespace-nowrap">&lt; 2ms RTT</span>
                    </div>
                  </div>

                  {/* Peer B Box */}
                  <div className="col-span-5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-xs font-semibold text-[#ededed]">Peer B (Callee)</span>
                      </div>
                      <span
                        data-testid="peer-b-state"
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          peerBConnectionState === "connected"
                            ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-400 font-bold"
                            : "border-[#262626] bg-[#141414] text-[#888888]"
                        }`}
                      >
                        {peerBConnectionState}
                      </span>
                    </div>

                    <div className="relative aspect-video w-full overflow-hidden rounded-[6px] border border-[#242424] bg-black flex items-center justify-center">
                      {remoteMediaStream ? (
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-center p-2">
                          <Video className="h-5 w-5 text-[#404040]" />
                          <span className="text-[10px] font-mono text-[#666666]">Remote Stream Idle</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1.5 text-[9px] font-mono text-[#888888] bg-black/60 px-1 rounded">
                        103.21.44.12:49152
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Chips Row */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[#1e1e1e]">
                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Zap className="h-3 w-3 text-emerald-400" />
                      <span>Wire State</span>
                    </div>
                    <div className={`text-xs font-bold font-mono truncate ${
                      peerAConnectionState === "connected" ? "text-emerald-400" : "text-[#777777]"
                    }`}>
                      {peerAConnectionState === "connected" ? "Direct P2P Active" : "Standby"}
                    </div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <MessageSquare className="h-3 w-3 text-purple-400" />
                      <span>DataChannel</span>
                    </div>
                    <div className="text-xs font-bold text-purple-300 font-mono truncate">
                      lab-channel (sctp:0)
                    </div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Shield className="h-3 w-3 text-cyan-400" />
                      <span>Cipher</span>
                    </div>
                    <div className="text-xs font-bold text-[#ededed] font-mono truncate">
                      DTLS / SRTP (AES)
                    </div>
                  </div>

                  <div className="rounded-[6px] border border-[#222222] bg-[#111111] p-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#888888]">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>Loopback RTT</span>
                    </div>
                    <div className="text-xs font-bold text-amber-300 font-mono">
                      &lt; 2 ms
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM: DATACHANNEL TERMINAL & STATS INSPECTOR (Height ~52%) */}
              <div className="h-[52%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed] flex items-center gap-1.5">
                      <span>Live DataChannel Terminal & Stats Inspector</span>
                    </span>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center rounded-[6px] bg-[#141414] p-0.5 border border-[#222222]">
                      <button
                        type="button"
                        onClick={() => setStep6Tab("chat")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step6Tab === "chat"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat Terminal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep6Tab("sctp")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step6Tab === "sctp"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>SCTP Stack</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep6Tab("stats")}
                        className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                          step6Tab === "stats"
                            ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                            : "text-[#777777] hover:text-[#ededed]"
                        }`}
                      >
                        <Activity className="h-3.5 w-3.5" />
                        <span>getStats()</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tab Content Display */}
                <div className="flex-1 min-h-0 pt-2 overflow-hidden">
                  {/* TAB 1: CHAT TERMINAL */}
                  {step6Tab === "chat" && (
                    <div className="h-full flex flex-col justify-between">
                      {/* Message Log */}
                      <div
                        data-testid="dc-log"
                        className="flex-1 min-h-0 overflow-y-auto rounded-[6px] border border-[#1e1e1e] bg-black p-2 space-y-1.5 font-mono text-xs"
                      >
                        {dataChannelMessages.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-[#555555] italic">
                            DataChannel idle. Click 'Establish Direct SCTP Data Wire' or send a message to begin.
                          </div>
                        ) : (
                          dataChannelMessages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`rounded-[6px] p-2 text-xs border max-w-[85%] ${
                                msg.from === "A"
                                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200 ml-auto"
                                  : "border-cyan-500/30 bg-cyan-950/20 text-cyan-200 mr-auto"
                              }`}
                            >
                              <div className="flex justify-between items-center text-[10px] text-[#777777] mb-1">
                                <span className="font-semibold text-[#ededed]">Peer {msg.from}</span>
                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <span className="leading-relaxed">{msg.text}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Peer B Quick Reply input */}
                      <div className="pt-2 border-t border-[#1e1e1e] flex gap-2 items-center">
                        <span className="text-[11px] font-mono text-cyan-400 shrink-0">Peer B Reply:</span>
                        <input
                          type="text"
                          placeholder="Reply as Peer B..."
                          value={messageInputB}
                          onChange={(e) => setMessageInputB(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendB()}
                          data-testid="input-msg-b"
                          className="h-7 flex-1 rounded-[4px] border border-[#242424] bg-[#050505] px-2 text-xs font-mono text-[#ededed] placeholder:text-[#555555] focus:border-cyan-500/50 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSendB}
                          data-testid="btn-send-b"
                          className="inline-flex h-7 items-center justify-center rounded-[4px] border border-cyan-500/40 bg-cyan-950/30 px-3 text-xs font-mono text-cyan-300 hover:border-cyan-500/70 transition-colors"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SCTP PROTOCOL STACK */}
                  {step6Tab === "sctp" && (
                    <div className="h-full grid grid-cols-12 gap-2.5 font-mono text-xs">
                      {/* Left: Dissected Protocol Layers */}
                      <div className="col-span-6 h-full overflow-y-auto space-y-1.5 pr-1">
                        <div className="p-2 rounded bg-[#0d0d0d] border border-purple-500/30">
                          <div className="text-[10px] uppercase text-purple-400 font-bold">Layer 5: Application Data</div>
                          <div className="text-xs text-[#ededed]">RTCDataChannel text strings or raw binary Blobs/ArrayBuffers</div>
                        </div>
                        <div className="p-2 rounded bg-[#0d0d0d] border border-cyan-500/30">
                          <div className="text-[10px] uppercase text-cyan-400 font-bold">Layer 4: SCTP (RFC 4960 & RFC 8831)</div>
                          <div className="text-xs text-[#ededed]">Multi-streaming association • Chunk types: DATA, SACK, HEARTBEAT</div>
                        </div>
                        <div className="p-2 rounded bg-[#0d0d0d] border border-emerald-500/30">
                          <div className="text-[10px] uppercase text-emerald-400 font-bold">Layer 3: DTLS 1.3 Encryption (RFC 8261)</div>
                          <div className="text-xs text-[#ededed]">AES-GCM session keys negotiated via TLS handshake over UDP</div>
                        </div>
                        <div className="p-2 rounded bg-[#0d0d0d] border border-[#222222]">
                          <div className="text-[10px] uppercase text-[#777777] font-bold">Layer 2: UDP Datagrams & IP Wire</div>
                          <div className="text-xs text-[#a1a1a1]">Punched NAT sockets: 192.168.1.15:54321 ➔ 103.21.44.12:49152</div>
                        </div>
                      </div>

                      {/* Right: SCTP Channel Properties */}
                      <div className="col-span-6 h-full overflow-y-auto rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-2.5 space-y-2">
                        <div className="text-xs font-semibold text-purple-300 border-b border-[#1c1c1c] pb-1">
                          RTCDataChannel Configuration
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between py-0.5 border-b border-[#161616] text-[#888888]">
                            <span>channel.label</span>
                            <span className="text-[#ededed]">"lab-channel"</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-[#161616] text-[#888888]">
                            <span>channel.id (Stream ID)</span>
                            <span className="text-cyan-300">0</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-[#161616] text-[#888888]">
                            <span>channel.ordered</span>
                            <span className="text-emerald-400 font-bold">true (FIFO Guaranteed)</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-[#161616] text-[#888888]">
                            <span>maxRetransmits</span>
                            <span className="text-[#ededed]">null (Reliable delivery)</span>
                          </div>
                          <div className="flex justify-between py-0.5 text-[#888888]">
                            <span>channel.readyState</span>
                            <span className={peerAConnectionState === "connected" ? "text-emerald-400 font-bold" : "text-[#777777]"}>
                              "{peerAConnectionState === "connected" ? "open" : "connecting"}"
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: RTCSTATS TELEMETRY */}
                  {step6Tab === "stats" && (
                    <div className="h-full overflow-y-auto space-y-2 font-mono text-xs pr-1">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Selected Candidate Pair</span>
                          <span className="text-xs font-bold text-purple-300">host ➔ srflx</span>
                        </div>
                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Packets Sent / Received</span>
                          <span className="text-xs font-bold text-emerald-400">1,248 / 1,248</span>
                        </div>
                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Packet Loss Rate</span>
                          <span className="text-xs font-bold text-emerald-400">0.00% (Lossless)</span>
                        </div>
                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Jitter / Delay Buffer</span>
                          <span className="text-xs font-bold text-cyan-300">0.00 ms</span>
                        </div>
                      </div>

                      <div className="rounded-[6px] border border-purple-500/30 bg-purple-950/20 p-2 text-xs flex items-center justify-between">
                        <span className="text-purple-200">
                          <strong>PeerConnection Active:</strong> True direct peer-to-peer transport with hardware-accelerated video rendering and zero signaling latency.
                        </span>
                        <span className="text-[10px] font-mono text-purple-400 font-semibold">W3C WebRTC 1.0</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
