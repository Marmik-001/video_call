import { useState, useEffect } from "react";
import {
  LabCard,
  RouteBadge,
  StepHeader,
  ConceptDefinition,
  DiagramNode,
  Keycap,
  EmptyState,
} from "../design-system";
import {
  Layers,
  Send,
  HelpCircle,
  Eye,
  EyeOff,
  Laptop,
  CheckCircle2,
  RefreshCw,
  Code2,
  Palette,
  Radio,
  Search,
  SlidersHorizontal,
  TableProperties,
} from "lucide-react";

export function Styleguide() {
  // Step 2 Interactive Demo State
  const [exchangeState, setExchangeState] = useState<"initial" | "offering" | "answered">("initial");
  const [showRawSdp, setShowRawSdp] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const sampleOfferSdp = `v=0
o=- 4182937102 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 0.0.0.0
a=setup:actpass
a=mid:0
a=sctp-port:5000`;

  const sampleAnswerSdp = `v=0
o=- 7291038472 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 0.0.0.0
a=setup:active
a=mid:0
a=sctp-port:5000`;

  const handleTriggerExchange = () => {
    setExchangeState("offering");
    setTimeout(() => {
      setExchangeState("answered");
    }, 1200);
  };

  const handleResetExchange = () => {
    setExchangeState("initial");
    setShowRawSdp(false);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
  };

  // Keyboard shortcut: Space or Enter to trigger demo when in initial state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if ((e.key === " " || e.key === "Enter") && exchangeState === "initial") {
        e.preventDefault();
        handleTriggerExchange();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [exchangeState]);

  return (
    <div className="min-h-screen bg-[#000000] text-[#ededed] font-sans selection:bg-[#262626] selection:text-[#ededed]">
      {/* Top Header Navbar - Neutral Vercel Restraint */}
      <nav className="sticky top-0 z-40 border-b border-[#242424] bg-[#000000]/90 backdrop-blur-md px-6 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#262626] bg-[#121212] font-mono font-medium text-xs text-[#ededed]">
              ▲
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#ededed]">WebRTC Lab</span>
              <span className="text-xs text-[#666666]">/</span>
              <span className="text-xs font-mono text-[#a1a1a1]">Design Standard & Styleguide</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#tokens"
              className="rounded-[6px] px-2.5 py-1 text-xs text-[#a1a1a1] hover:text-[#ededed] transition-colors"
            >
              Tokens
            </a>
            <a
              href="#components"
              className="rounded-[6px] px-2.5 py-1 text-xs text-[#a1a1a1] hover:text-[#ededed] transition-colors"
            >
              Components
            </a>
            <a
              href="#step-demo"
              className="rounded-[6px] border border-[#262626] bg-[#121212] px-2.5 py-1 text-xs font-medium text-[#ededed] hover:border-[#404040] transition-colors"
            >
              Beginner Step 2
            </a>
            <a
              href="#pro-card"
              className="rounded-[6px] px-2.5 py-1 text-xs text-[#a1a1a1] hover:text-[#ededed] transition-colors"
            >
              Pro Sample
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-16">
        {/* ========================================================= */}
        {/* SECTION 1: SAMPLED NEUTRAL TOKENS & SWATCHES */}
        {/* ========================================================= */}
        <section id="tokens" className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#a1a1a1]">
            <Palette className="h-3.5 w-3.5" /> Sampled Reference Palette
          </div>
          <h2 className="text-xl font-medium tracking-tight text-[#ededed]">Neutral Palette Tokens</h2>
          <p className="text-sm text-[#a1a1a1]">
            Directly sampled from <code className="font-mono text-xs text-[#ededed]">vercel-dashboard.png</code>: pure black background, 1px hairline borders, and strictly semantic route colors.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Surfaces */}
            <LabCard sectionLabel="Surfaces" className="p-4 space-y-2">
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#000000] border border-[#242424]">
                  <span>bg-canvas</span>
                  <span className="text-[#666666]">#000000 (79%)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#0a0a0a] border border-[#242424]">
                  <span>bg-surface</span>
                  <span className="text-[#666666]">#0a0a0a</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#121212] border border-[#242424]">
                  <span>bg-raised</span>
                  <span className="text-[#666666]">#121212 (16%)</span>
                </div>
              </div>
            </LabCard>

            {/* Borders */}
            <LabCard sectionLabel="Hairline Borders" className="p-4 space-y-2">
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#0a0a0a] border border-[#242424]">
                  <span>border-subtle</span>
                  <span className="text-[#666666]">#242424</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#0a0a0a] border border-[#404040]">
                  <span>border-hover</span>
                  <span className="text-[#666666]">#404040</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#0a0a0a] border border-[#505050]">
                  <span>border-active</span>
                  <span className="text-[#666666]">#505050</span>
                </div>
              </div>
            </LabCard>

            {/* Typography */}
            <LabCard sectionLabel="Typography Scale" className="p-4 space-y-2">
              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-[6px] bg-[#0a0a0a] border border-[#242424]">
                  <span className="text-[#ededed] font-medium block">text-main (#ededed)</span>
                  <span className="text-[11px] text-[#666666]">Primary text, RGB 237,237,237</span>
                </div>
                <div className="p-2 rounded-[6px] bg-[#0a0a0a] border border-[#242424]">
                  <span className="text-[#a1a1a1] block">text-muted (#a1a1a1)</span>
                  <span className="text-[11px] text-[#666666]">Secondary text, RGB 159,159,159</span>
                </div>
              </div>
            </LabCard>

            {/* Semantic Route Tokens */}
            <LabCard sectionLabel="Route Color Meaning" className="p-4 space-y-2">
              <div className="flex flex-wrap gap-1.5 pt-1">
                <RouteBadge variant="host">host (LAN)</RouteBadge>
                <RouteBadge variant="srflx">srflx (STUN)</RouteBadge>
                <RouteBadge variant="relay">relay (TURN)</RouteBadge>
                <RouteBadge variant="checking">checking</RouteBadge>
                <RouteBadge variant="error">failed</RouteBadge>
                <RouteBadge variant="neutral">in-flight</RouteBadge>
              </div>
            </LabCard>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: COMPONENT CATALOG */}
        {/* ========================================================= */}
        <section id="components" className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#a1a1a1]">
              <Layers className="h-3.5 w-3.5" /> Component Architecture
            </div>
            <h2 className="text-xl font-medium tracking-tight text-[#ededed]">Vercel-Grade Primitives</h2>
            <p className="text-sm text-[#a1a1a1]">
              Depth from 1px borders + slightly lighter fill. No drop shadows. Radius: 8px cards, 6px buttons, full-round pills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Buttons & Controls */}
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#a1a1a1] block">
                1. Button Hierarchy
              </span>
              <LabCard className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="text-xs text-[#a1a1a1]">Primary (1 per screen):</div>
                  <button
                    type="button"
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[6px] bg-[#ededed] px-4 text-xs font-medium text-black transition-colors hover:bg-white active:scale-[0.99]"
                  >
                    <span>Primary Action</span>
                    <Keycap>↵</Keycap>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-[#a1a1a1]">Secondary:</div>
                  <button
                    type="button"
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[6px] border border-[#242424] bg-[#121212] px-4 text-xs font-medium text-[#ededed] transition-colors hover:border-[#404040] hover:bg-[#171717]"
                  >
                    <span>Secondary Action</span>
                    <Keycap>→</Keycap>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-[#a1a1a1]">Ghost:</div>
                  <button
                    type="button"
                    className="inline-flex h-8 w-full items-center justify-center rounded-[6px] px-3 text-xs font-medium text-[#a1a1a1] transition-colors hover:bg-[#121212] hover:text-[#ededed]"
                  >
                    Ghost Action
                  </button>
                </div>
              </LabCard>
            </div>

            {/* 2. Empty States */}
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#a1a1a1] block">
                2. Empty State (Reference Pattern)
              </span>
              <EmptyState
                icon={<Radio className="h-5 w-5 text-[#a1a1a1]" />}
                message="No ICE candidates discovered yet. Start the gathering process to explore reachable network interfaces."
                actionText="Gather Candidates"
                onAction={() => {}}
              />
            </div>

            {/* 3. Status Indicators & Nodes */}
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#a1a1a1] block">
                3. Nodes & Small Status Dot
              </span>
              <DiagramNode
                title="Peer A"
                subtitle="192.168.1.10:54321"
                state="idle"
                icon={<Laptop className="h-4 w-4 text-[#a1a1a1]" />}
                badge={
                  <div className="flex items-center gap-1.5 text-xs text-[#a1a1a1]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#666666]" />
                    <span>Idle</span>
                  </div>
                }
              />
              <DiagramNode
                title="Peer B"
                subtitle="142.250.190.46:61234"
                state="connected"
                icon={<Laptop className="h-4 w-4 text-emerald-400" />}
                badge={
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Connected</span>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: BEGINNER STEP 2 PROTOTYPE (VERCEL STYLE) */}
        {/* ========================================================= */}
        <section id="step-demo" className="space-y-6 pt-4">
          <div className="border-b border-[#242424] pb-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#a1a1a1]">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Interactive Demonstration
            </div>
            <h2 className="text-xl font-medium tracking-tight text-[#ededed] mt-1">
              Beginner Step 2: "The Business Card (SDP Offer & Answer)"
            </h2>
            <p className="text-sm text-[#a1a1a1] mt-1">
              Full 6-part teaching structure built in calm, neutral Vercel aesthetics with minimum 40px touch targets.
            </p>
          </div>

          <div className="mx-auto max-w-4xl space-y-6">
            {/* Part 1: Step Header & Human Question */}
            <StepHeader
              currentStep={2}
              totalSteps={6}
              categoryLabel="Beginner Lab"
              title="The Business Card: SDP Offer & Answer"
              subtitle="How do two browsers agree on what video, audio, and network formats they both understand?"
            />

            {/* Part 2: Analogy Callout */}
            <LabCard sectionLabel="Mental Model & Analogy" className="p-6">
              <ConceptDefinition
                question="How do browsers describe their technical capabilities?"
                analogy="SDP (Session Description Protocol) is like exchanging business cards before a call. It lists what languages you speak (codecs) and how you want to chat (data channel) so neither side talks gibberish."
              />
            </LabCard>

            {/* Part 3: Live Interactive Demo */}
            <LabCard sectionLabel="Live Simulation" className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#a1a1a1] uppercase">Status:</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        exchangeState === "initial"
                          ? "bg-[#666666]"
                          : exchangeState === "offering"
                          ? "bg-amber-400 animate-pulse"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-[#ededed]">
                      {exchangeState === "initial"
                        ? "Ready to initiate"
                        : exchangeState === "offering"
                        ? "Transmitting SDP Offer..."
                        : "SDP Handshake Complete"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetExchange}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-2.5 text-xs font-medium text-[#a1a1a1] hover:border-[#404040] hover:text-[#ededed] transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Node Transfer Canvas */}
              <div className="rounded-[8px] border border-[#242424] bg-[#000000] p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  {/* Peer A */}
                  <DiagramNode
                    title="Peer A (Offerer)"
                    subtitle="Local Browser"
                    state={exchangeState === "offering" ? "active" : exchangeState === "answered" ? "connected" : "idle"}
                    icon={<Laptop className="h-5 w-5 text-[#a1a1a1]" />}
                    badge={
                      exchangeState === "offering" ? (
                        <RouteBadge variant="checking">Sending</RouteBadge>
                      ) : exchangeState === "answered" ? (
                        <RouteBadge variant="host">Offer Set</RouteBadge>
                      ) : (
                        <RouteBadge variant="neutral">Ready</RouteBadge>
                      )
                    }
                  >
                    <div className="text-xs text-[#a1a1a1] space-y-1">
                      <div>Channel: <span className="font-mono text-[#ededed]">active</span></div>
                      <div>Role: <span className="font-mono text-[#ededed]">Offerer</span></div>
                    </div>
                  </DiagramNode>

                  {/* Peer B */}
                  <DiagramNode
                    title="Peer B (Answerer)"
                    subtitle="Remote Peer"
                    state={exchangeState === "answered" ? "connected" : "idle"}
                    icon={<Laptop className="h-5 w-5 text-[#a1a1a1]" />}
                    badge={
                      exchangeState === "answered" ? (
                        <RouteBadge variant="host">Answer Set</RouteBadge>
                      ) : (
                        <RouteBadge variant="neutral">Waiting</RouteBadge>
                      )
                    }
                  >
                    <div className="text-xs text-[#a1a1a1] space-y-1">
                      <div>Compatibility: <span className="font-mono text-[#ededed]">100% Match</span></div>
                      <div>Role: <span className="font-mono text-[#ededed]">Answerer</span></div>
                    </div>
                  </DiagramNode>
                </div>

                {/* Single Primary Action Button (Target Height >= 40px) */}
                <div className="mt-8 flex flex-col items-center justify-center gap-3">
                  {exchangeState === "initial" && (
                    <button
                      type="button"
                      onClick={handleTriggerExchange}
                      className="inline-flex h-11 items-center gap-2 rounded-[6px] bg-[#ededed] px-6 text-sm font-medium text-black transition-colors hover:bg-white active:scale-[0.99]"
                    >
                      <Send className="h-4 w-4" />
                      <span>Create & Exchange SDP Offer</span>
                      <Keycap className="bg-[#e5e5e5] border-[#d4d4d4] text-black">Space</Keycap>
                    </button>
                  )}

                  {exchangeState === "offering" && (
                    <div className="flex h-11 items-center gap-2 text-xs font-mono text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>Packaging media descriptors into SDP Offer...</span>
                    </div>
                  )}

                  {exchangeState === "answered" && (
                    <div className="flex h-11 items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Both peers have negotiated and stored SDP descriptions.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Part 4: Plain Words "What Just Happened" */}
              {exchangeState === "answered" && (
                <div className="rounded-[6px] bg-[#121212] p-4 border border-[#242424] space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#ededed] font-medium block">
                    What Just Happened:
                  </span>
                  <p className="text-base text-[#a1a1a1] leading-relaxed">
                    Peer A packaged its media formats and data channel parameters into an SDP Offer. Peer B accepted it, generated a compatible Answer, and both sides now share the same technical blueprint.
                  </p>
                </div>
              )}
            </LabCard>

            {/* Part 5: "Show Real Data" Progressive Disclosure */}
            <LabCard sectionLabel="Technical Telemetry" className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#a1a1a1]" />
                  <span className="text-sm font-medium text-[#ededed]">Inspect Real SDP Text</span>
                  <span className="text-xs text-[#666666]">(Progressive Disclosure)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRawSdp(!showRawSdp)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#242424] bg-[#0a0a0a] px-3 text-xs font-medium text-[#ededed] hover:border-[#404040] transition-colors"
                >
                  {showRawSdp ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showRawSdp ? "Hide Raw Data" : "Show Real Data"}</span>
                </button>
              </div>

              {showRawSdp && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-[#a1a1a1]">SDP Offer (Peer A)</span>
                    <pre className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 font-mono text-xs text-[#a1a1a1] overflow-x-auto leading-relaxed">
                      {sampleOfferSdp}
                    </pre>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono text-[#a1a1a1]">SDP Answer (Peer B)</span>
                    <pre className="rounded-[6px] border border-[#242424] bg-[#000000] p-3 font-mono text-xs text-[#a1a1a1] overflow-x-auto leading-relaxed">
                      {sampleAnswerSdp}
                    </pre>
                  </div>
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
                Why must both browsers exchange an SDP offer and answer before connecting?
              </p>

              <div className="space-y-2">
                {[
                  { id: 0, text: "To negotiate compatible codecs, encryption keys, and network formats so both sides understand each other." },
                  { id: 1, text: "To stream the actual video frames directly through the signaling server." },
                  { id: 2, text: "To download browser extensions needed for WebRTC playback." },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedQuizOption(option.id);
                      setQuizSubmitted(true);
                    }}
                    className={`w-full text-left rounded-[6px] p-3.5 text-sm transition-colors border ${
                      selectedQuizOption === option.id
                        ? option.id === 0
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
                    selectedQuizOption === 0
                      ? "bg-[#121212] border-emerald-500/30 text-emerald-300"
                      : "bg-[#121212] border-[#242424] text-[#a1a1a1]"
                  }`}
                >
                  {selectedQuizOption === 0 ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Correct! The SDP exchange guarantees both peers agree on media parameters before sending data.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span>Not quite. SDP is only session metadata, not media data. Media travels peer-to-peer over UDP once ICE completes.</span>
                      <button
                        type="button"
                        onClick={() => setSelectedQuizOption(0)}
                        className="shrink-0 text-xs font-mono text-[#ededed] underline hover:text-white"
                      >
                        Explain & Continue
                      </button>
                    </div>
                  )}
                </div>
              )}
            </LabCard>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: PRO-DENSITY SAMPLE CARD (CANDIDATE LIST ROWS) */}
        {/* ========================================================= */}
        <section id="pro-card" className="space-y-4 pt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#a1a1a1]">
              <TableProperties className="h-3.5 w-3.5" /> High-Density Pro Mode
            </div>
            <h2 className="text-xl font-medium tracking-tight text-[#ededed]">Pro Telemetry Candidate Inspector</h2>
            <p className="text-sm text-[#a1a1a1]">
              High-information table with row fills, monospace IP/port metadata, and semantic route badges (13px body/mono).
            </p>
          </div>

          <LabCard sectionLabel="Pro Workbench • Gathered ICE Candidates (3)" className="p-0 overflow-hidden">
            {/* Table Header Filter Bar */}
            <div className="flex items-center justify-between border-b border-[#242424] px-4 py-2.5 bg-[#0a0a0a]">
              <div className="flex items-center gap-2 text-xs text-[#a1a1a1]">
                <Search className="h-3.5 w-3.5" />
                <span className="font-mono">Filter by type or interface...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#666666]">3 candidates discovered</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* Candidate List Rows */}
            <div className="divide-y divide-[#242424]/60 text-xs font-mono">
              {/* Row 1: Host Candidate (Selected LAN pair) */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#121212]/50 hover:bg-[#121212] transition-colors">
                <div className="flex items-center gap-3">
                  <RouteBadge variant="host">host</RouteBadge>
                  <div>
                    <span className="text-[#ededed] font-medium">192.168.1.10:54321</span>
                    <span className="text-[#666666] ml-2 font-sans text-[11px]">LAN en0 (Direct Ethernet)</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[#a1a1a1]">
                  <span>UDP</span>
                  <span className="text-[11px] text-[#666666]">pri: 2122260223</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-sans text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Selected Pair</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Server Reflexive Candidate (STUN) */}
              <div className="flex items-center justify-between px-4 py-3 hover:bg-[#121212]/70 transition-colors">
                <div className="flex items-center gap-3">
                  <RouteBadge variant="srflx">srflx</RouteBadge>
                  <div>
                    <span className="text-[#ededed] font-medium">142.250.190.46:61234</span>
                    <span className="text-[#666666] ml-2 font-sans text-[11px]">Public NAT Reflexive</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[#a1a1a1]">
                  <span>UDP</span>
                  <span className="text-[11px] text-[#666666]">pri: 1686052607</span>
                  <div className="flex items-center gap-1.5 text-[#a1a1a1] font-sans text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#666666]" />
                    <span>Candidate Valid</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Relay Candidate (TURN) */}
              <div className="flex items-center justify-between px-4 py-3 hover:bg-[#121212]/70 transition-colors">
                <div className="flex items-center gap-3">
                  <RouteBadge variant="relay">relay</RouteBadge>
                  <div>
                    <span className="text-[#ededed] font-medium">34.120.55.12:3478</span>
                    <span className="text-[#666666] ml-2 font-sans text-[11px]">Google Cloud Relay</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[#a1a1a1]">
                  <span>TCP</span>
                  <span className="text-[11px] text-[#666666]">pri: 41885439</span>
                  <div className="flex items-center gap-1.5 text-[#a1a1a1] font-sans text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400/50" />
                    <span>Standby</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-between border-t border-[#242424] px-4 py-2 bg-[#0a0a0a] text-[11px] font-mono text-[#666666]">
              <span>ICE Transport State: completed</span>
              <span>Local candidate pair active</span>
            </div>
          </LabCard>
        </section>
      </main>
    </div>
  );
}
