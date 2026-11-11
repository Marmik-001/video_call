import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Laptop,
  Radio,
  Server,
  Layers,
  Activity,
  RefreshCw,
  Zap,
  Network,
  Sliders,
  SlidersHorizontal,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
  AlertTriangle,
  BarChart2,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  Video,
  Flame,
  Info,
  Play,
  Square,
  Globe,
} from "lucide-react";
import { SpecularButton } from "@/components/react-bits/SpecularButton";
import { CallChip, type CallChipState } from "@/components/react-bits/CallChip";
import {
  proLiveService,
  type ProLiveStats,
  type InterceptedCandidate,
  type ProCandidateStats,
} from "@/services/proLive.service";
import { createSyntheticMediaStream } from "@/utils/media.utils";

export type NatType = "Full Cone" | "Restricted Cone" | "Port Restricted" | "Symmetric";

export interface ProSimulatorLabProps {
  onBackToBeginner?: () => void;
}

export interface SimulationResult {
  status: "connected" | "failed";
  routeType: "Direct LAN" | "Direct P2P (STUN)" | "TURN Relay" | "ICE Connection Failed";
  selectedPair: string;
  rttMs: number;
  packetLossPercent: number;
  serverBandwidthCostPerGb: number;
  summary: string;
  explanation: string;
  checksLog: Array<{
    pair: string;
    protocol: "UDP" | "TCP";
    priority: number;
    result: "SUCCESS (NOMINATED)" | "FALLBACK SUCCESS" | "DROPPED (POLICY)" | "DROPPED (NAT BLOCKED)";
  }>;
}

export const ProSimulatorLab: React.FC<ProSimulatorLabProps> = ({ onBackToBeginner }) => {
  // Pro Mode View Switcher: "simulation" (RFC 8445 Theory) vs "live" (Real Dual RTCPeerConnection)
  const [engineMode, setEngineMode] = useState<"simulation" | "live">("simulation");

  // Candidate Filter Switches (Applies to both Simulation and Live Wire)
  const [blockHost, setBlockHost] = useState(false);
  const [blockSrflx, setBlockSrflx] = useState(false);
  const [blockRelay, setBlockRelay] = useState(false);

  // NAT Configuration
  const [natA, setNatA] = useState<NatType>("Port Restricted");
  const [natB, setNatB] = useState<NatType>("Port Restricted");

  // Injected Network Chaos (Simulation mode)
  const [injectedLoss, setInjectedLoss] = useState(0);
  const [injectedJitter, setInjectedJitter] = useState(0);

  // Tab State for Bottom Panel
  const [proTab, setProTab] = useState<"telemetry" | "matrix" | "diagnosis">("telemetry");

  // CallChip State
  const [chipLabel, setChipLabel] = useState("pro_engine_standby");
  const [chipState, setChipState] = useState<CallChipState>("idle");
  const [chipDuration, setChipDuration] = useState<number | undefined>(undefined);

  // Simulation Active / In-Flight State
  const [isSimulating, setIsSimulating] = useState(false);

  // -------------------------------------------------------------
  // Live Wire State & Refs
  // -------------------------------------------------------------
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveStats, setLiveStats] = useState<ProLiveStats | null>(null);
  const [interceptedCandidates, setInterceptedCandidates] = useState<InterceptedCandidate[]>([]);
  const [candidateStats, setCandidateStats] = useState<ProCandidateStats>({
    total: 0,
    admitted: 0,
    blocked: 0,
    host: 0,
    srflx: 0,
    relay: 0,
  });
  const [iceFailedDueToHairpinning, setIceFailedDueToHairpinning] = useState(false);
  const [useHardwareCamera, setUseHardwareCamera] = useState(true);
  const [mediaActive, setMediaActive] = useState(false);

  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);
  const syntheticStopRef = useRef<(() => void) | null>(null);

  // Sync candidate firewall policy to proLiveService whenever toggles change
  useEffect(() => {
    proLiveService.updatePolicy({ blockHost, blockSrflx, blockRelay });
  }, [blockHost, blockSrflx, blockRelay]);

  // Attach video stream helpers
  useEffect(() => {
    proLiveService.onLocalStream = (stream) => {
      if (videoRefA.current) {
        videoRefA.current.srcObject = stream;
        videoRefA.current.play().catch(() => {});
      }
    };

    proLiveService.onRemoteStream = (stream) => {
      if (videoRefB.current) {
        videoRefB.current.srcObject = stream;
        videoRefB.current.play().catch(() => {});
      }
    };

    proLiveService.onCandidateIntercepted = (cand) => {
      setInterceptedCandidates((prev) => [cand, ...prev.slice(0, 49)]);
    };

    proLiveService.onCandidateStatsChange = (stats) => {
      setCandidateStats(stats);
    };

    proLiveService.onStatsUpdated = (stats) => {
      setLiveStats(stats);
    };

    proLiveService.onConnectionStateChange = (stateA, stateB, iceStateA, iceStateB) => {
      if (stateA === "connected" && stateB === "connected") {
        setChipLabel("live_webrtc_wire_connected");
        setChipState("success");
        setIceFailedDueToHairpinning(false);
      } else if (
        stateA === "failed" ||
        stateB === "failed" ||
        iceStateA === "failed" ||
        iceStateB === "failed" ||
        iceStateA === "disconnected" ||
        iceStateB === "disconnected"
      ) {
        if (blockHost) {
          setIceFailedDueToHairpinning(true);
          setChipLabel("stun_hairpinning_failed_router_blocked");
          setChipState("error");
        } else {
          setChipLabel("live_webrtc_wire_failed");
          setChipState("error");
        }
      }
    };

    return () => {
      proLiveService.stop();
      if (syntheticStopRef.current) {
        syntheticStopRef.current();
      }
    };
  }, []);

  // Handle starting the Live Dual Peer Wire
  const handleStartLiveWire = async () => {
    setChipLabel("initializing_dual_peer_wire");
    setChipState("running");
    setInterceptedCandidates([]);

    let activeStream: MediaStream | undefined;

    if (useHardwareCamera && navigator.mediaDevices?.getUserMedia) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMediaActive(true);
      } catch {
        // Fallback to animated canvas stream
        const syn = createSyntheticMediaStream(320, 240, "Live Peer A Video");
        syntheticStopRef.current = syn.stop;
        activeStream = syn.stream;
        setMediaActive(true);
      }
    } else {
      const syn = createSyntheticMediaStream(320, 240, "Synthetic Test Pattern (30FPS)");
      syntheticStopRef.current = syn.stop;
      activeStream = syn.stream;
      setMediaActive(true);
    }

    try {
      await proLiveService.start(activeStream);
      setLiveConnected(true);
      setChipLabel(
        blockHost
          ? "live_wire_testing_public_ip_stun"
          : "live_wire_established_direct_lan"
      );
      setChipState("success");
      setChipDuration(800);
    } catch {
      setChipLabel("live_wire_error");
      setChipState("error");
    }
  };

  const handleStopLiveWire = () => {
    proLiveService.stop();
    if (syntheticStopRef.current) {
      syntheticStopRef.current();
      syntheticStopRef.current = null;
    }
    if (videoRefA.current) videoRefA.current.srcObject = null;
    if (videoRefB.current) videoRefB.current.srcObject = null;
    setLiveConnected(false);
    setMediaActive(false);
    setLiveStats(null);
    setChipLabel("live_wire_disconnected");
    setChipState("idle");
  };

  // Compute Theoretical Simulation Outcome
  const simulationResult = useMemo<SimulationResult>(() => {
    const checks: SimulationResult["checksLog"] = [];

    // Check 1: Direct Host (LAN)
    if (!blockHost) {
      checks.push({
        pair: "192.168.1.15:54321 ➔ 192.168.1.42:58210 (host)",
        protocol: "UDP",
        priority: 2122260223,
        result: "SUCCESS (NOMINATED)",
      });

      return {
        status: "connected",
        routeType: "Direct LAN",
        selectedPair: "192.168.1.15:54321 ➔ 192.168.1.42:58210 (host)",
        rttMs: Math.round((1.2 + injectedJitter * 0.1) * 10) / 10,
        packetLossPercent: injectedLoss,
        serverBandwidthCostPerGb: 0,
        summary: "Optimal Direct LAN route selected. Unimpeded local network connectivity.",
        explanation:
          "Because Host candidates were allowed, Peer A and Peer B found a direct intra-subnet link. NAT traversal and cloud relaying were completely bypassed.",
        checksLog: checks,
      };
    }

    checks.push({
      pair: "192.168.1.15:54321 ➔ 192.168.1.42:58210 (host)",
      protocol: "UDP",
      priority: 2122260223,
      result: "DROPPED (POLICY)",
    });

    // Check 2: STUN Reflexive (srflx)
    const isSymmetricCollision = natA === "Symmetric" && natB === "Symmetric";
    const isPortRestrictedSymmetricMismatch =
      (natA === "Symmetric" && natB === "Port Restricted") ||
      (natB === "Symmetric" && natA === "Port Restricted");

    const canStunSucceed = !blockSrflx && !isSymmetricCollision && !isPortRestrictedSymmetricMismatch;

    if (canStunSucceed) {
      checks.push({
        pair: "103.21.44.12:49152 ➔ 198.51.100.88:51240 (srflx)",
        protocol: "UDP",
        priority: 1686052863,
        result: "SUCCESS (NOMINATED)",
      });

      return {
        status: "connected",
        routeType: "Direct P2P (STUN)",
        selectedPair: "103.21.44.12:49152 ➔ 198.51.100.88:51240 (srflx)",
        rttMs: Math.round((28.4 + injectedJitter) * 10) / 10,
        packetLossPercent: injectedLoss,
        serverBandwidthCostPerGb: 0,
        summary: "STUN hole-punching succeeded! Direct peer-to-peer across public internet.",
        explanation:
          "Host candidates were blocked, but both NAT routers supported symmetric return pinholes. STUN reflected external socket endpoints, allowing direct UDP flow without server bandwidth costs.",
        checksLog: checks,
      };
    }

    checks.push({
      pair: "103.21.44.12:49152 ➔ 198.51.100.88:51240 (srflx)",
      protocol: "UDP",
      priority: 1686052863,
      result: blockSrflx ? "DROPPED (POLICY)" : "DROPPED (NAT BLOCKED)",
    });

    // Check 3: TURN Relay
    if (!blockRelay) {
      checks.push({
        pair: "34.120.55.99:45210 ➔ 34.120.55.99:45211 (relay)",
        protocol: "UDP",
        priority: 16777215,
        result: "FALLBACK SUCCESS",
      });

      return {
        status: "connected",
        routeType: "TURN Relay",
        selectedPair: "34.120.55.99:45210 ➔ 34.120.55.99:45211 (relay)",
        rttMs: Math.round((104.5 + injectedJitter * 1.4) * 10) / 10,
        packetLossPercent: Math.round(injectedLoss * 0.8 * 10) / 10,
        serverBandwidthCostPerGb: 0.04,
        summary: "STUN traversal failed or blocked. Fallback to Cloud TURN relay active.",
        explanation: isSymmetricCollision
          ? "Symmetric NAT on both endpoints prevented direct hole-punching. The ICE agent nominated the TURN relay allocation to bypass strict middleboxes."
          : isPortRestrictedSymmetricMismatch
          ? "Symmetric and Port-Restricted NAT mismatch prevented bidirectional pinhole discovery. The ICE agent gracefully fell back to the TURN relay allocation."
          : "Direct LAN and STUN candidates were filtered out by network firewall rules. TURN relay bypassed all middlebox blocks at the expense of higher latency and server egress costs.",
        checksLog: checks,
      };
    }

    checks.push({
      pair: "34.120.55.99:45210 ➔ 34.120.55.99:45211 (relay)",
      protocol: "UDP",
      priority: 16777215,
      result: "DROPPED (POLICY)",
    });

    // Check 4: ICE Connection Failed
    return {
      status: "failed",
      routeType: "ICE Connection Failed",
      selectedPair: "None (All candidates rejected or timed out)",
      rttMs: 0,
      packetLossPercent: 100,
      serverBandwidthCostPerGb: 0,
      summary: "BLACKOUT: iceConnectionState === 'failed'. Zero viable routes found.",
      explanation:
        "Every candidate path was either dropped by firewall policy (Host, STUN, or TURN blocked) or blocked by incompatible NAT topologies. The WebRTC session failed to establish a media pipe.",
      checksLog: checks,
    };
  }, [blockHost, blockSrflx, blockRelay, natA, natB, injectedLoss, injectedJitter]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setChipLabel("negotiating_ice_constraints");
    setChipState("running");

    setTimeout(() => {
      setIsSimulating(false);
      setChipLabel(
        simulationResult.status === "connected"
          ? `ice_connected_${simulationResult.routeType.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
          : "ice_failed_all_routes_exhausted"
      );
      setChipState(simulationResult.status === "connected" ? "success" : "error");
      setChipDuration(800);
    }, 450);
  };

  const handleApplyPreset = (preset: "ideal" | "stun" | "turn" | "failure") => {
    switch (preset) {
      case "ideal":
        setBlockHost(false);
        setBlockSrflx(false);
        setBlockRelay(false);
        setNatA("Full Cone");
        setNatB("Full Cone");
        setInjectedLoss(0);
        setInjectedJitter(0);
        break;
      case "stun":
        setBlockHost(true);
        setBlockSrflx(false);
        setBlockRelay(false);
        setNatA("Port Restricted");
        setNatB("Port Restricted");
        setInjectedLoss(2);
        setInjectedJitter(15);
        break;
      case "turn":
        setBlockHost(true);
        setBlockSrflx(false);
        setBlockRelay(false);
        setNatA("Symmetric");
        setNatB("Symmetric");
        setInjectedLoss(4);
        setInjectedJitter(30);
        break;
      case "failure":
        setBlockHost(true);
        setBlockSrflx(true);
        setBlockRelay(true);
        setInjectedLoss(100);
        setInjectedJitter(0);
        break;
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-screen bg-[#000000] text-[#ededed] font-sans selection:bg-purple-950/60 selection:text-purple-200 p-2.5 sm:p-3 flex flex-col overflow-y-auto lg:overflow-hidden gap-2">
      {/* 1. TOP HEADER & NAVIGATION RIBBON */}
      <header className="h-11 shrink-0 flex items-center justify-between border-b border-[#242424] pb-2 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-purple-500/40 bg-purple-950/40 font-mono text-xs text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
              ⚡
            </span>
            <span className="text-sm font-semibold tracking-tight text-[#ededed]">WebRTC Pro Simulator</span>
            <span className="text-xs text-[#666666]">/</span>
            <span className="text-xs font-mono text-purple-300">Network Chaos & ICE Benchmarking</span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-2">
            <CallChip label={chipLabel} state={chipState} durationMs={chipDuration} />
          </div>

          {/* Engine Mode Toggle (Simulation vs Live Wire) */}
          <div className="flex items-center rounded-[6px] bg-[#101010] p-0.5 border border-[#222222]" data-testid="pro-mode-toggle">
            <button
              type="button"
              onClick={() => setEngineMode("simulation")}
              data-testid="mode-btn-simulation"
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-mono transition-all ${
                engineMode === "simulation"
                  ? "bg-purple-950/50 text-purple-200 border border-purple-500/40 font-semibold shadow-sm"
                  : "text-[#777777] hover:text-[#ededed]"
              }`}
            >
              <Activity className="h-3 w-3 text-purple-400" />
              <span>Simulation Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setEngineMode("live")}
              data-testid="mode-btn-live"
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-mono transition-all ${
                engineMode === "live"
                  ? "bg-cyan-950/50 text-cyan-200 border border-cyan-500/40 font-semibold shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                  : "text-[#777777] hover:text-[#ededed]"
              }`}
            >
              <Flame className="h-3 w-3 text-cyan-400" />
              <span>Live WebRTC Wire</span>
            </button>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-2">
          {onBackToBeginner && (
            <button
              type="button"
              onClick={onBackToBeginner}
              data-testid="btn-back-to-beginner"
              className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-2 text-xs font-mono text-purple-300 hover:border-purple-500/40 hover:bg-purple-950/20 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Beginner Lab</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleApplyPreset("ideal")}
            className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-2 text-xs text-[#a1a1a1] hover:border-[#404040] hover:text-[#ededed] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Controls</span>
          </button>

          {engineMode === "simulation" ? (
            <SpecularButton
              onClick={handleRunSimulation}
              data-testid="btn-run-simulation"
              className="h-7 text-xs font-semibold px-3"
            >
              <Zap className={`h-3 w-3 mr-1 text-purple-400 ${isSimulating ? "animate-spin" : ""}`} />
              <span>{isSimulating ? "Probing ICE Paths..." : "Simulate ICE Handshake"}</span>
            </SpecularButton>
          ) : (
            <button
              type="button"
              onClick={liveConnected ? handleStopLiveWire : handleStartLiveWire}
              data-testid="btn-toggle-live-wire"
              className={`inline-flex h-7 items-center gap-1.5 px-3 rounded-[6px] text-xs font-mono font-bold transition-all shadow-sm ${
                liveConnected
                  ? "border border-red-500/40 bg-red-950/30 text-red-300 hover:bg-red-900/40"
                  : "border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
              }`}
            >
              {liveConnected ? <Square className="h-3 w-3 text-red-400" /> : <Play className="h-3 w-3 text-cyan-400" />}
              <span>{liveConnected ? "Hang Up Live Wire" : "Connect Dual Peers"}</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN 1-VIEWPORT BENTO LAYOUT (Col 4 vs Col 8) */}
      <div className="flex-1 min-h-0 w-full grid grid-cols-12 grid-rows-1 gap-2.5">
        {/* LEFT COLUMN: CHAOS CONTROLS & ENHANCED NAT ROUTER TOPOLOGY (Col 4) */}
        <div className="col-span-12 lg:col-span-4 h-full min-h-0 flex flex-col justify-between overflow-hidden rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 shadow-sm">
          <div className="space-y-2.5 overflow-y-auto pr-1">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#ededed]">
                  Firewall & Network Chaos
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-purple-500/30 bg-purple-950/20 text-purple-300 font-semibold">
                RFC 8445 • Matrix
              </span>
            </div>

            {/* Quick Presets Ribbon */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#888888] uppercase block">Benchmark Presets</span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("ideal")}
                  data-testid="preset-ideal"
                  className="p-1.5 rounded-[4px] border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:border-emerald-500/60 transition-colors flex items-center gap-1.5 truncate"
                >
                  <Zap className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="truncate">Ideal LAN (&lt;2ms)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("stun")}
                  data-testid="preset-stun"
                  className="p-1.5 rounded-[4px] border border-purple-500/30 bg-purple-950/20 text-purple-300 hover:border-purple-500/60 transition-colors flex items-center gap-1.5 truncate"
                >
                  <Radio className="h-3 w-3 text-purple-400 shrink-0" />
                  <span className="truncate">STUN P2P (~28ms)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("turn")}
                  data-testid="preset-turn"
                  className="p-1.5 rounded-[4px] border border-amber-500/30 bg-amber-950/20 text-amber-300 hover:border-amber-500/60 transition-colors flex items-center gap-1.5 truncate"
                >
                  <Server className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="truncate">TURN Relay (~105ms)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("failure")}
                  data-testid="preset-failure"
                  className="p-1.5 rounded-[4px] border border-red-500/30 bg-red-950/20 text-red-300 hover:border-red-500/60 transition-colors flex items-center gap-1.5 truncate"
                >
                  <WifiOff className="h-3 w-3 text-red-400 shrink-0" />
                  <span className="truncate">Blackout (Failed)</span>
                </button>
              </div>
            </div>

            {/* Candidate Route Filters (Checkboxes) */}
            <div className="rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-2 space-y-2">
              <span className="text-[10px] font-mono text-purple-300 font-semibold uppercase flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
                <span>Candidate Firewall Policy</span>
              </span>

              <div className="space-y-1.5 text-xs font-mono">
                <label className="flex items-center justify-between p-1 rounded hover:bg-[#141414] cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={blockHost}
                      onChange={(e) => setBlockHost(e.target.checked)}
                      data-testid="toggle-block-host"
                      className="accent-purple-500"
                    />
                    <span>Block Host Candidates (LAN)</span>
                  </div>
                  <span className="text-[10px] text-[#777777]">typ host</span>
                </label>

                <label className="flex items-center justify-between p-1 rounded hover:bg-[#141414] cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={blockSrflx}
                      onChange={(e) => setBlockSrflx(e.target.checked)}
                      data-testid="toggle-block-srflx"
                      className="accent-purple-500"
                    />
                    <span>Block STUN (srflx / Public IP)</span>
                  </div>
                  <span className="text-[10px] text-[#777777]">typ srflx</span>
                </label>

                <label className="flex items-center justify-between p-1 rounded hover:bg-[#141414] cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={blockRelay}
                      onChange={(e) => setBlockRelay(e.target.checked)}
                      data-testid="toggle-block-relay"
                      className="accent-purple-500"
                    />
                    <span>Block TURN Relay Candidates</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {engineMode === "live" && (
                      <span className="text-[9px] px-1 py-0.2 rounded border border-amber-500/40 bg-amber-950/40 text-amber-300 font-mono">
                        Simulated Only
                      </span>
                    )}
                    <span className="text-[10px] text-[#777777]">typ relay</span>
                  </div>
                </label>
              </div>

              {/* Live Wire TURN Notice */}
              {engineMode === "live" && (
                <div className="p-1.5 rounded border border-amber-500/30 bg-amber-950/20 text-[10px] text-amber-200 font-mono leading-tight space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-amber-300">
                    <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>TURN Live Wire Unavailable (Simulated Only)</span>
                  </div>
                  <p className="text-[9px] text-[#a1a1a1]">
                    Real TURN requires a hosted relay server (coturn / Twilio). Because this app is 100% client-side, Live Wire cannot relay through TURN. Switch to <strong>Simulation Matrix</strong> for TURN benchmarks!
                  </p>
                </div>
              )}

              {/* Host Filter & Hairpinning Status in Live Wire */}
              {blockHost && (
                <div className="p-2 rounded border border-cyan-500/30 bg-cyan-950/20 text-[10px] text-cyan-200 font-mono leading-tight space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-cyan-300">
                    <div className="flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>Host Filter Active (Public IP Test):</span>
                    </div>
                    {engineMode === "live" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/70 border border-cyan-500/40 text-cyan-200">
                        {candidateStats.srflx} srflx passed • {candidateStats.host} host dropped
                      </span>
                    )}
                  </div>
                  <p className="text-[#cccccc] text-[10px]">
                    All LAN candidates dropped. Chromium is forced to attempt peer-to-peer connectivity via your STUN-reflected Public IP.
                  </p>

                  {engineMode === "live" && (iceFailedDueToHairpinning || (liveConnected && !liveStats?.nominatedPair)) && (
                    <div className="p-1.5 rounded bg-black/80 border border-red-500/40 text-red-200 text-[10px] space-y-1 mt-1">
                      <div className="font-bold text-red-300 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                        <span>Negotiation Failed (NAT Hairpinning Blocked)</span>
                      </div>
                      <p className="text-[#a1a1a1] text-[9px] leading-tight">
                        Your home router / ISP NAT refused to loopback packets sent to your own public IP. This is expected on ~20% of consumer networks and why TURN relaying is mandatory for WebRTC in production!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ENHANCED NAT ROUTER TOPOLOGY CONFIGURATOR */}
            <div className="rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-300 font-semibold uppercase flex items-center gap-1">
                  <Network className="h-3.5 w-3.5 text-cyan-400" />
                  <span>NAT Router Topology</span>
                </span>
                <span className="text-[9px] font-mono text-[#777777]">RFC 3489 / RFC 4787</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#888888] block mb-1">Peer A (Caller) NAT</span>
                  <select
                    value={natA}
                    onChange={(e) => setNatA(e.target.value as NatType)}
                    data-testid="select-nat-a"
                    aria-label="Peer A NAT Type"
                    className="w-full h-7 rounded border border-[#2a2a2a] bg-[#121212] px-1 text-xs text-[#ededed] outline-none focus:border-purple-500"
                  >
                    <option value="Full Cone">Full Cone (Open)</option>
                    <option value="Restricted Cone">Restricted Cone</option>
                    <option value="Port Restricted">Port Restricted</option>
                    <option value="Symmetric">Symmetric NAT</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-[#888888] block mb-1">Peer B (Callee) NAT</span>
                  <select
                    value={natB}
                    onChange={(e) => setNatB(e.target.value as NatType)}
                    data-testid="select-nat-b"
                    aria-label="Peer B NAT Type"
                    className="w-full h-7 rounded border border-[#2a2a2a] bg-[#121212] px-1 text-xs text-[#ededed] outline-none focus:border-cyan-500"
                  >
                    <option value="Full Cone">Full Cone (Open)</option>
                    <option value="Restricted Cone">Restricted Cone</option>
                    <option value="Port Restricted">Port Restricted</option>
                    <option value="Symmetric">Symmetric NAT</option>
                  </select>
                </div>
              </div>

              {/* Dynamic NAT Pinhole Translation Inspector */}
              <div className="rounded-[4px] border border-[#1e1e1e] bg-[#141414] p-2 space-y-1 text-[10px] font-mono">
                <span className="text-[#888888] font-bold block uppercase">Active NAT Pinhole & Inbound Filter Rule:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                  <div className="p-1 rounded bg-[#0a0a0a] border border-[#222222]">
                    <div className="text-purple-300 font-semibold">Router A: {natA}</div>
                    <div className="text-[#666666]">Inbound: {natA === "Full Cone" ? "*.*.*.*:*" : natA === "Restricted Cone" ? "IP:*" : natA === "Port Restricted" ? "IP:Port" : "Per-Dest Port"}</div>
                  </div>
                  <div className="p-1 rounded bg-[#0a0a0a] border border-[#222222]">
                    <div className="text-cyan-300 font-semibold">Router B: {natB}</div>
                    <div className="text-[#666666]">Inbound: {natB === "Full Cone" ? "*.*.*.*:*" : natB === "Restricted Cone" ? "IP:*" : natB === "Port Restricted" ? "IP:Port" : "Per-Dest Port"}</div>
                  </div>
                </div>
              </div>

              {/* Symmetric Collision Alert */}
              {natA === "Symmetric" && natB === "Symmetric" && (
                <div className="p-1.5 rounded border border-amber-500/40 bg-amber-950/20 text-[11px] text-amber-200 space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-amber-300">
                    <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>Symmetric NAT Collision</span>
                  </div>
                  <p className="leading-tight text-[10px]">
                    Direct P2P hole-punching is mathematically impossible because both routers assign unique external ports per destination. Traffic <strong>must</strong> traverse TURN relay!
                  </p>
                </div>
              )}
            </div>

            {/* Network Impairment Sliders (Simulation Mode) */}
            {engineMode === "simulation" ? (
              <div className="rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-2 space-y-2">
                <span className="text-[10px] font-mono text-[#888888] font-semibold uppercase flex items-center gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" />
                  <span>Synthetic Network Chaos</span>
                </span>

                <div className="space-y-2 font-mono">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#888888]">Injected Packet Loss</span>
                      <span className={injectedLoss > 0 ? "text-amber-400 font-bold" : "text-[#ededed]"}>
                        {injectedLoss}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="1"
                      value={injectedLoss}
                      onChange={(e) => setInjectedLoss(Number(e.target.value))}
                      aria-label="Injected Packet Loss Percentage"
                      className="w-full accent-purple-500 h-1.5 bg-[#1e1e1e] rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#888888]">Injected Latency Jitter</span>
                      <span className={injectedJitter > 0 ? "text-cyan-400 font-bold" : "text-[#ededed]"}>
                        +{injectedJitter} ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="5"
                      value={injectedJitter}
                      onChange={(e) => setInjectedJitter(Number(e.target.value))}
                      aria-label="Injected Latency Jitter Milliseconds"
                      className="w-full accent-cyan-500 h-1.5 bg-[#1e1e1e] rounded"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Live Wire Media Source Selector */
              <div className="rounded-[6px] border border-cyan-500/30 bg-[#0c0c0c] p-2 space-y-2">
                <span className="text-[10px] font-mono text-cyan-300 font-semibold uppercase flex items-center gap-1">
                  <Video className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Hardware & Video Stream</span>
                </span>

                <div className="space-y-1.5 text-xs font-mono">
                  <label className="flex items-center justify-between p-1 rounded hover:bg-[#141414] cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="media-source"
                        checked={useHardwareCamera}
                        onChange={() => setUseHardwareCamera(true)}
                        className="accent-cyan-500"
                      />
                      <span>Physical Camera Feed</span>
                    </div>
                    <span className="text-[10px] text-emerald-400">getUserMedia</span>
                  </label>

                  <label className="flex items-center justify-between p-1 rounded hover:bg-[#141414] cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="media-source"
                        checked={!useHardwareCamera}
                        onChange={() => setUseHardwareCamera(false)}
                        className="accent-cyan-500"
                      />
                      <span>Synthetic 30FPS Test Pattern</span>
                    </div>
                    <span className="text-[10px] text-[#777777]">Canvas 320x240</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Lower Action & Run Button */}
          <div className="pt-2 border-t border-[#1e1e1e]">
            {engineMode === "simulation" ? (
              <SpecularButton
                onClick={handleRunSimulation}
                data-testid="btn-run-simulation-bottom"
                className="w-full h-8 text-xs font-semibold shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 mr-1 text-purple-400" />
                <span>Simulate ICE Handshake Under Constraints</span>
              </SpecularButton>
            ) : (
              <button
                type="button"
                onClick={liveConnected ? handleStopLiveWire : handleStartLiveWire}
                data-testid="btn-run-live-bottom"
                className={`w-full h-8 rounded-[6px] text-xs font-mono font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                  liveConnected
                    ? "border border-red-500/40 bg-red-950/40 text-red-200 hover:bg-red-900/40"
                    : "border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                }`}
              >
                {liveConnected ? <Square className="h-3.5 w-3.5 text-red-400" /> : <Play className="h-3.5 w-3.5 text-cyan-400" />}
                <span>{liveConnected ? "Hang Up Live WebRTC Wire" : "Connect Dual Peers in Browser"}</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ROUTING RADAR & REAL TELEMETRY / DUAL VIDEO (Col 8) */}
        <div className="col-span-12 lg:col-span-8 h-full min-h-0 flex flex-col gap-2.5">
          {/* TOP STAGE (~46% height): Live Radar OR Dual Video Viewport */}
          <div
            data-testid="radar-stage"
            className="h-[46%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-purple-400" />
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed]">
                  {engineMode === "simulation"
                    ? "Live Routing Radar & Nominated Path"
                    : "Dual Concurrent Peers • Real WebRTC Loopback"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  data-testid="metric-route-type"
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border font-bold ${
                    engineMode === "live"
                      ? liveConnected
                        ? liveStats?.nominatedPair?.localType === "host"
                          ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                          : "border-cyan-500/40 bg-cyan-950/30 text-cyan-200"
                        : "border-[#333333] bg-[#121212] text-[#777777]"
                      : simulationResult.status === "connected"
                      ? simulationResult.routeType === "Direct LAN"
                        ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                        : simulationResult.routeType === "Direct P2P (STUN)"
                        ? "border-purple-500/40 bg-purple-950/30 text-purple-300"
                        : "border-amber-500/40 bg-amber-950/30 text-amber-300"
                      : "border-red-500/40 bg-red-950/30 text-red-300"
                  }`}
                >
                  {engineMode === "live"
                    ? liveConnected
                      ? liveStats?.nominatedPair
                        ? `Live: ${liveStats.nominatedPair.localType.toUpperCase()}`
                        : "Live: Negotiating"
                      : "Live Wire Standby"
                    : simulationResult.routeType}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] border border-cyan-500/30 bg-cyan-950/20 text-cyan-300">
                  {engineMode === "live"
                    ? liveConnected ? "Dual RTCPeerConnection Active" : "Click Connect Below"
                    : simulationResult.status === "connected" ? "Nominated Pair Active" : "No Viable Route"}
                </span>
              </div>
            </div>

            {/* STAGE BODY: Either Radar Animation OR Dual Real Video Windows */}
            {engineMode === "simulation" ? (
              /* Theoretical Radar Visual Architecture */
              <div className="relative my-auto flex items-center justify-between px-4 py-2 font-mono text-xs">
                {/* Peer A Node */}
                <div className="flex flex-col items-center gap-1 z-10 w-36">
                  <div className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[6px] border border-purple-500/40 bg-purple-950/30 text-purple-300">
                    <Laptop className="h-4 w-4 text-purple-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-[11px] font-semibold text-[#ededed]">Peer A (Caller)</div>
                      <div className="text-[9px] text-[#888888] truncate">{natA}</div>
                    </div>
                  </div>
                </div>

                {/* Highway Left Wire */}
                <div className="relative flex-1 h-[2px] bg-[#222222] mx-2">
                  {simulationResult.status === "connected" && (
                    <motion.div
                      className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(168,85,247,1)] absolute -top-1 ${
                        simulationResult.routeType === "Direct LAN"
                          ? "bg-emerald-400"
                          : simulationResult.routeType === "Direct P2P (STUN)"
                          ? "bg-purple-400"
                          : "bg-amber-400"
                      }`}
                      animate={{ left: ["0%", "100%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <div className="absolute left-1/2 -top-3.5 -translate-x-1/2 px-1 rounded bg-[#111111] text-[8px] text-[#777777] border border-[#202020] whitespace-nowrap">
                    {simulationResult.routeType === "Direct LAN" ? "Direct Subnet" : "NAT Outbound"}
                  </div>
                </div>

                {/* Center Hub: STUN Server or TURN Server or Subnet Switch */}
                <div className="flex flex-col items-center gap-1 z-10 w-44">
                  <div
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-[6px] border text-center transition-all ${
                      simulationResult.routeType === "Direct LAN"
                        ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                        : simulationResult.routeType === "Direct P2P (STUN)"
                        ? "border-purple-500/40 bg-purple-950/30 text-purple-300"
                        : simulationResult.routeType === "TURN Relay"
                        ? "border-amber-500/40 bg-amber-950/30 text-amber-300"
                        : "border-red-500/40 bg-red-950/30 text-red-300"
                    }`}
                  >
                    {simulationResult.routeType === "Direct LAN" ? (
                      <Layers className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : simulationResult.routeType === "Direct P2P (STUN)" ? (
                      <Radio className="h-4 w-4 text-purple-400 shrink-0" />
                    ) : (
                      <Server className="h-4 w-4 text-amber-400 shrink-0" />
                    )}
                    <div className="truncate text-left">
                      <div className="text-[11px] font-semibold text-[#ededed] truncate">
                        {simulationResult.routeType === "Direct LAN"
                          ? "Local Subnet Switch"
                          : simulationResult.routeType === "Direct P2P (STUN)"
                          ? "STUN Reflected P2P"
                          : simulationResult.routeType === "TURN Relay"
                          ? "TURN Cloud Relay"
                          : "Connection Blocked"}
                      </div>
                      <div className="text-[9px] text-[#888888] truncate">{simulationResult.selectedPair}</div>
                    </div>
                  </div>
                </div>

                {/* Highway Right Wire */}
                <div className="relative flex-1 h-[2px] bg-[#222222] mx-2">
                  {simulationResult.status === "connected" && (
                    <motion.div
                      className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(168,85,247,1)] absolute -top-1 ${
                        simulationResult.routeType === "Direct LAN"
                          ? "bg-emerald-400"
                          : simulationResult.routeType === "Direct P2P (STUN)"
                          ? "bg-purple-400"
                          : "bg-amber-400"
                      }`}
                      animate={{ left: ["0%", "100%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <div className="absolute left-1/2 -top-3.5 -translate-x-1/2 px-1 rounded bg-[#111111] text-[8px] text-[#777777] border border-[#202020] whitespace-nowrap">
                    {simulationResult.routeType === "Direct LAN" ? "Direct Subnet" : "NAT Inbound"}
                  </div>
                </div>

                {/* Peer B Node */}
                <div className="flex flex-col items-center gap-1 z-10 w-36">
                  <div className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[6px] border border-cyan-500/40 bg-cyan-950/30 text-cyan-300">
                    <Server className="h-4 w-4 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-[11px] font-semibold text-[#ededed]">Peer B (Callee)</div>
                      <div className="text-[9px] text-[#888888] truncate">{natB}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Live Real Dual Video Call Windows */
              <div className="grid grid-cols-2 gap-3 my-auto h-full max-h-[170px] pt-1 pb-1">
                {/* Caller Video Window */}
                <div className="relative rounded-[6px] border border-purple-500/30 bg-[#060606] overflow-hidden flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between text-[11px] font-mono z-10">
                    <span className="flex items-center gap-1 text-purple-300 font-bold">
                      <Laptop className="h-3.5 w-3.5 text-purple-400" />
                      <span>Peer A (Caller / Outbound)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/70 border border-purple-500/30 text-purple-300">
                      {mediaActive ? (useHardwareCamera ? "Live Hardware Track" : "30FPS Synthetic") : "Standby"}
                    </span>
                  </div>

                  <video
                    ref={videoRefA}
                    autoPlay
                    playsInline
                    muted
                    data-testid="live-video-a"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />

                  {!mediaActive && (
                    <div className="relative z-10 my-auto text-center text-xs font-mono text-[#777777]">
                      Click "Connect Dual Peers" to attach camera & initiate live connection
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-between text-[9px] font-mono bg-black/60 px-2 py-0.5 rounded">
                    <span className="text-[#888888]">RTCPeerConnection A</span>
                    <span className="text-emerald-400 font-bold">{liveStats?.stateA || "new"}</span>
                  </div>
                </div>

                {/* Callee Video Window (Decrypted Remote Stream) */}
                <div className="relative rounded-[6px] border border-cyan-500/30 bg-[#060606] overflow-hidden flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between text-[11px] font-mono z-10">
                    <span className="flex items-center gap-1 text-cyan-300 font-bold">
                      <Server className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Peer B (Callee / Remote Decrypted)</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/70 border border-cyan-500/30 text-cyan-300">
                      {liveConnected ? "ontrack Decoded" : "Awaiting Wire"}
                    </span>
                  </div>

                  <video
                    ref={videoRefB}
                    autoPlay
                    playsInline
                    data-testid="live-video-b"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />

                  {!liveConnected && (
                    <div className="relative z-10 my-auto text-center text-xs font-mono text-[#777777]">
                      Remote RTP Video stream will render here upon ICE nomination
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-between text-[9px] font-mono bg-black/60 px-2 py-0.5 rounded">
                    <span className="text-[#888888]">RTCPeerConnection B</span>
                    <span className="text-cyan-400 font-bold">{liveStats?.stateB || "new"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Status Feed */}
            <div data-testid="pro-radar-verdict" className="p-2 rounded-[6px] border border-[#202020] bg-[#0c0c0c] text-xs font-mono flex items-center justify-between">
              <span className="text-[#ededed] truncate">
                <strong className="text-purple-300">Verdict: </strong>
                {engineMode === "live"
                  ? liveConnected
                    ? liveStats?.nominatedPair
                      ? `LIVE CARRIER ACTIVE: Nominated ${liveStats.nominatedPair.localType.toUpperCase()} Pair (${liveStats.rttMs}ms RTT, ${liveStats.currentBitrateKbps} kbps)`
                      : "Establishing peer-to-peer ICE candidate checks in browser..."
                    : "Live Wire Standby. Click 'Connect Dual Peers' to spin up 2 real concurrent browser RTCPeerConnections."
                  : simulationResult.summary}
              </span>
              <span className="text-[10px] text-[#777777] font-semibold shrink-0 ml-2">RFC 8445 Compliant</span>
            </div>
          </div>

          {/* BOTTOM: COMPARATIVE TELEMETRY, ELIMINATION MATRIX, OR LIVE STATS (Height ~54%) */}
          <div className="h-[54%] rounded-[8px] border border-[#242424] bg-[#0a0a0a] p-3 flex flex-col justify-between overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1.5">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-purple-400" />
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ededed]">
                  {engineMode === "simulation"
                    ? "Comparative Telemetry & Route Benchmarks"
                    : "Real WebRTC getStats() & Candidate Interception Fireboard"}
                </span>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center rounded-[6px] bg-[#141414] p-0.5 border border-[#222222]">
                <button
                  type="button"
                  onClick={() => setProTab("telemetry")}
                  data-testid="pro-tab-telemetry"
                  className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                    proTab === "telemetry"
                      ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                      : "text-[#777777] hover:text-[#ededed]"
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>{engineMode === "live" ? "Real getStats()" : "Live Benchmarks"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProTab("matrix")}
                  data-testid="pro-tab-matrix"
                  className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                    proTab === "matrix"
                      ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                      : "text-[#777777] hover:text-[#ededed]"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>
                    {engineMode === "live"
                      ? `Candidate Fireboard (${interceptedCandidates.length})`
                      : `Pair Checks (${simulationResult.checksLog.length})`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setProTab("diagnosis")}
                  data-testid="pro-tab-diagnosis"
                  className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-mono transition-colors ${
                    proTab === "diagnosis"
                      ? "bg-[#252525] text-purple-300 font-semibold shadow-sm"
                      : "text-[#777777] hover:text-[#ededed]"
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{engineMode === "live" ? "NAT Hairpinning Guide" : "Diagnostic Breakdown"}</span>
                </button>
              </div>
            </div>

            {/* Tab Display Area */}
            <div className="flex-1 min-h-0 pt-2 overflow-hidden">
              {/* TAB 1: TELEMETRY (SIMULATION BARS OR REAL LIVE STATS) */}
              {proTab === "telemetry" && (
                <div className="h-full flex flex-col justify-between font-mono text-xs">
                  {engineMode === "live" ? (
                    /* Real Live getStats() Dashboard */
                    <div className="space-y-2 h-full flex flex-col justify-between">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Nominated Route</span>
                          <span className="text-xs font-bold text-cyan-300 block truncate">
                            {liveStats?.nominatedPair
                              ? `${liveStats.nominatedPair.localType.toUpperCase()} ➔ ${liveStats.nominatedPair.remoteType.toUpperCase()}`
                              : liveConnected
                              ? "Probing Pairs..."
                              : "Idle"}
                          </span>
                          <span className="text-[9px] text-[#666666] block">
                            {blockHost ? "Forced Public STUN" : "Direct Intra-Subnet"}
                          </span>
                        </div>

                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Real RTT</span>
                          <span className="text-xs font-bold text-emerald-400 block">
                            {liveStats?.rttMs !== undefined ? `${liveStats.rttMs} ms` : "--"}
                          </span>
                          <span className="text-[9px] text-[#666666] block">Chromium Round-Trip</span>
                        </div>

                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Real Bitrate</span>
                          <span className="text-xs font-bold text-purple-300 block">
                            {liveStats ? `${liveStats.currentBitrateKbps} kbps` : "--"}
                          </span>
                          <span className="text-[9px] text-[#666666] block">RTP Media Egress</span>
                        </div>

                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Video Decoding</span>
                          <span className="text-xs font-bold text-amber-300 block">
                            {liveStats?.videoFps !== undefined ? `${liveStats.videoFps} FPS` : "30 FPS"}
                          </span>
                          <span className="text-[9px] text-[#666666] block">
                            {liveStats?.videoWidth ? `${liveStats.videoWidth}x${liveStats.videoHeight}` : "320x240"}
                          </span>
                        </div>
                      </div>

                      {/* Live Nominated Pair Address Box */}
                      <div className="rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-2.5 space-y-1.5">
                        <span className="text-[10px] uppercase text-[#777777] font-bold block">
                          Real Nominated Socket Pair (Chromium WebRTC Core):
                        </span>
                        <div className="p-1.5 rounded bg-[#141414] border border-[#262626] flex items-center justify-between text-[11px]">
                          <span className="text-purple-300 font-semibold truncate">
                            {liveStats?.nominatedPair?.localCandidate || "Awaiting Peer A nomination"}
                          </span>
                          <span className="text-cyan-400 px-2 font-bold">⇄</span>
                          <span className="text-cyan-300 font-semibold truncate">
                            {liveStats?.nominatedPair?.remoteCandidate || "Awaiting Peer B nomination"}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#888888] leading-tight">
                          {blockHost
                            ? "✅ Host candidates were dropped in real time! Chromium was forced to use the STUN public IP reflexive socket for peer-to-peer media delivery."
                            : "ℹ️ Both peers communicated over the optimal direct subnet LAN interface. To force connection over public IP reflection, check 'Block Host Candidates'."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Theoretical Simulation Latency Bars */
                    <div className="space-y-2 h-full flex flex-col justify-between">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Active Route Type</span>
                          <span className="text-xs font-bold text-purple-300 block truncate">
                            {simulationResult.routeType}
                          </span>
                          <span className="text-[9px] text-[#666666] block">Nominated Path</span>
                        </div>

                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Simulated Latency (RTT)</span>
                          <span
                            data-testid="metric-rtt"
                            className={`text-xs font-bold flex items-center gap-1 ${
                              simulationResult.status === "failed"
                                ? "text-red-400"
                                : simulationResult.rttMs < 5
                                ? "text-emerald-400"
                                : simulationResult.rttMs < 50
                                ? "text-purple-300"
                                : "text-amber-300"
                            }`}
                          >
                            {simulationResult.status === "failed" ? "Infinity" : `${simulationResult.rttMs} ms`}
                          </span>
                          <span className="text-[9px] text-[#666666] block">
                            {simulationResult.status === "failed" ? "Unreachable" : "Round Trip Time"}
                          </span>
                        </div>

                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Effective Packet Loss</span>
                          <span
                            data-testid="metric-loss"
                            className={`text-xs font-bold ${
                              simulationResult.packetLossPercent > 0 ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {simulationResult.packetLossPercent.toFixed(1)}%
                          </span>
                          <span className="text-[9px] text-[#666666] block">Transport Reliability</span>
                        </div>

                        <div className="p-2 rounded bg-[#0c0c0c] border border-[#222222]">
                          <span className="text-[10px] text-[#777777] block">Cloud Relay Cost</span>
                          <span className="text-xs font-bold text-cyan-300 block">
                            ${simulationResult.serverBandwidthCostPerGb.toFixed(2)} / GB
                          </span>
                          <span className="text-[9px] text-[#666666] block">
                            {simulationResult.serverBandwidthCostPerGb === 0 ? "Zero Server Burden" : "TURN Bandwidth"}
                          </span>
                        </div>
                      </div>

                      {/* Comparative Latency Visual Bars */}
                      <div className="rounded-[6px] border border-[#202020] bg-[#0c0c0c] p-2.5 space-y-2">
                        <span className="text-[10px] uppercase text-[#777777] font-bold block">
                          Comparative Route Latency Spectrum (Theoretical vs Active)
                        </span>

                        <div className="space-y-1.5 text-[11px]">
                          {/* Direct LAN Bar */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[#888888]">
                              <span>Direct LAN (host ➔ host)</span>
                              <span className="text-emerald-400 font-bold">~1.2 ms</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#161616] rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: "3%" }} />
                            </div>
                          </div>

                          {/* STUN P2P Bar */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[#888888]">
                              <span>STUN NAT Hole-Punched (srflx ➔ srflx)</span>
                              <span className="text-purple-300 font-bold">~28.4 ms</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#161616] rounded-full overflow-hidden">
                              <div className="h-full bg-purple-400 rounded-full" style={{ width: "26%" }} />
                            </div>
                          </div>

                          {/* TURN Relay Bar */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[#888888]">
                              <span>TURN Cloud Relay (relay ➔ relay)</span>
                              <span className="text-amber-300 font-bold">~104.5 ms</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#161616] rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: "85%" }} />
                            </div>
                          </div>

                          {/* Active Result Indicator */}
                          <div className="pt-1 flex items-center justify-between text-[11px] border-t border-[#1a1a1a]">
                            <span className="text-[#ededed] font-semibold">Active Selected Route:</span>
                            <span
                              className={`font-bold ${
                                simulationResult.status === "failed"
                                  ? "text-red-400"
                                  : simulationResult.routeType === "Direct LAN"
                                  ? "text-emerald-400"
                                  : simulationResult.routeType === "Direct P2P (STUN)"
                                  ? "text-purple-300"
                                  : "text-amber-300"
                              }`}
                            >
                              {simulationResult.status === "failed"
                                ? "FAILED (No Carrier)"
                                : `${simulationResult.routeType} (${simulationResult.rttMs} ms)`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CANDIDATE PAIR CHECKS MATRIX OR LIVE FIREBOARD */}
              {proTab === "matrix" && (
                <div className="h-full overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
                  {engineMode === "live" ? (
                    /* Live Candidate Interceptor Fireboard */
                    <div>
                      <div className="grid grid-cols-12 gap-1 px-2 py-1 bg-[#141414] rounded text-[10px] text-[#777777] font-bold uppercase mb-1">
                        <span className="col-span-2">Time</span>
                        <span className="col-span-1">Peer</span>
                        <span className="col-span-2">Type</span>
                        <span className="col-span-4">Address / Port</span>
                        <span className="col-span-3 text-right">Firewall Action</span>
                      </div>
                      {interceptedCandidates.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#666666]">
                          No candidates gathered yet. Click "Connect Dual Peers" to start live exchange!
                        </div>
                      ) : (
                        interceptedCandidates.map((cand) => (
                          <div
                            key={cand.id}
                            className="grid grid-cols-12 gap-1 px-2 py-1 rounded border border-[#202020] bg-[#0c0c0c] items-center text-[10px]"
                          >
                            <span className="col-span-2 text-[#777777] truncate">{cand.timestamp}</span>
                            <span className={`col-span-1 font-bold ${cand.from === "A" ? "text-purple-400" : "text-cyan-400"}`}>
                              Peer {cand.from}
                            </span>
                            <span className="col-span-2 text-[#ededed] font-mono">{cand.type}</span>
                            <span className="col-span-4 text-[#a1a1a1] truncate">{cand.address}:{cand.port}</span>
                            <span
                              className={`col-span-3 text-right font-bold truncate flex items-center justify-end gap-1 ${
                                cand.status === "ADMITTED" ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {cand.status === "ADMITTED" ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                              <span>{cand.status}</span>
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    /* Simulation Elimination Sequence */
                    <div>
                      <div className="grid grid-cols-12 gap-1 px-2 py-1 bg-[#141414] rounded text-[10px] text-[#777777] font-bold uppercase">
                        <span className="col-span-6">Tested Candidate Pair</span>
                        <span className="col-span-2">Protocol</span>
                        <span className="col-span-2">Priority</span>
                        <span className="col-span-2 text-right">Check Result</span>
                      </div>

                      {simulationResult.checksLog.map((chk, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-12 gap-1 px-2 py-1.5 rounded border border-[#202020] bg-[#0c0c0c] items-center text-[11px]"
                        >
                          <span className="col-span-6 text-[#ededed] truncate font-semibold">{chk.pair}</span>
                          <span className="col-span-2 text-cyan-300">{chk.protocol}</span>
                          <span className="col-span-2 text-[#777777]">{chk.priority}</span>
                          <span
                            className={`col-span-2 text-right font-bold truncate ${
                              chk.result === "SUCCESS (NOMINATED)"
                                ? "text-emerald-400"
                                : chk.result === "FALLBACK SUCCESS"
                                ? "text-amber-400"
                                : "text-[#777777]"
                            }`}
                          >
                            {chk.result}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DIAGNOSTIC BREAKDOWN / NAT HAIRPINNING GUIDE */}
              {proTab === "diagnosis" && (
                <div className="h-full overflow-y-auto space-y-2 font-mono text-xs pr-1">
                  {engineMode === "live" ? (
                    <div className="space-y-2">
                      <div className="rounded-[6px] border border-cyan-500/30 bg-cyan-950/20 p-2.5 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                          <Globe className="h-4 w-4 text-cyan-400" />
                          <span>How Can Two Local Peers Connect Via Public IP? (NAT Hairpinning)</span>
                        </div>
                        <p className="text-[#ededed] leading-relaxed text-[11px]">
                          When you block <code>typ host</code> candidates in this live lab, the browser drops all private addresses (<code>127.0.0.1</code>, <code>192.168.x.x</code>). The only candidates passed between Peer A and Peer B are their STUN-reflected public endpoints (<code>srflx</code>).
                        </p>
                        <p className="text-[#ededed] leading-relaxed text-[11px]">
                          If your router supports <strong>NAT Hairpinning (NAT Loopback)</strong>, it recognizes that packets directed at your own public IP originate from inside the LAN, translates the headers, and reflects them directly back to the target peer. If a router forbids hairpinning, STUN-only P2P fails on the same subnet unless a TURN relay is provided!
                        </p>
                      </div>

                      <div className="rounded-[6px] border border-[#262626] bg-[#0c0c0c] p-2 space-y-1 text-[11px]">
                        <span className="text-purple-300 font-bold block">Why We Simulate TURN Instead of Hosting One:</span>
                        <p className="text-[#888888] leading-tight">
                          Real TURN requires provisioned cloud infrastructure with TURN REST credentials (RFC 5766). To keep this lab fully client-side and zero-cost, LAN and STUN test against real live sockets in your browser, while TURN is mathematically modeled.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[6px] border border-purple-500/30 bg-purple-950/20 p-2.5 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-purple-300">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span>ICE Engine Diagnostic Summary</span>
                      </div>
                      <p className="text-[#ededed] leading-relaxed">{simulationResult.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
