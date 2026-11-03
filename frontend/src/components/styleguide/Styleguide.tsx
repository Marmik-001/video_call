import { useState } from "react";
import {
  LabCard,
  RouteBadge,
  StepHeader,
  ConceptDefinition,
  DiagramNode,
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
  LayoutGrid,
} from "lucide-react";

export function Styleguide() {
  const [activeVariant, setActiveVariant] = useState<"variant-a" | "variant-b">("variant-a");

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

  return (
    <div className="min-h-screen bg-canvas text-text-main font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Banner Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border-subtle bg-canvas/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-bold text-sm">
              DS
            </span>
            <div>
              <h1 className="text-base font-bold text-text-main">WebRTC Lab Styleguide & Design Standard</h1>
              <p className="text-xs font-mono text-text-muted">Vercel Obsidian System • Geist Scale • Interactive Demo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#tokens"
              className="rounded-md px-3 py-1 text-xs text-text-muted hover:text-text-main transition-colors"
            >
              Tokens
            </a>
            <a
              href="#components"
              className="rounded-md px-3 py-1 text-xs text-text-muted hover:text-text-main transition-colors"
            >
              Components
            </a>
            <a
              href="#step-demo"
              className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              Step 2 Demo
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-20">
        {/* ========================================================= */}
        {/* SECTION 1: DESIGN TOKENS & SWATCHES */}
        {/* ========================================================= */}
        <section id="tokens" className="space-y-6">
          <div className="border-b border-border-subtle pb-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider">
              <Palette className="h-4 w-4" /> Section 1
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-main mt-1">Design Tokens & Color Palette</h2>
            <p className="text-sm text-text-muted mt-1">
              Semantic slate layers with high-precision 1px borders and restrained signaling glows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Surfaces */}
            <LabCard className="p-4 space-y-3">
              <span className="text-xs font-mono font-semibold text-text-muted uppercase">Surfaces</span>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-canvas border border-border-subtle">
                  <span>bg-canvas</span>
                  <span className="text-text-faint">#080c14</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border-subtle">
                  <span>bg-surface</span>
                  <span className="text-text-faint">#0f1623</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface-raised border border-border-subtle">
                  <span>bg-surface-raised</span>
                  <span className="text-text-faint">#151d2e</span>
                </div>
              </div>
            </LabCard>

            {/* Borders */}
            <LabCard className="p-4 space-y-3">
              <span className="text-xs font-mono font-semibold text-text-muted uppercase">Borders</span>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border-subtle">
                  <span>border-subtle</span>
                  <span className="text-text-faint">#1e293b</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border-hover">
                  <span>border-hover</span>
                  <span className="text-text-faint">#334155</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border-active">
                  <span>border-active</span>
                  <span className="text-text-faint">#475569</span>
                </div>
              </div>
            </LabCard>

            {/* Typography Tokens */}
            <LabCard className="p-4 space-y-3">
              <span className="text-xs font-mono font-semibold text-text-muted uppercase">Content & Text</span>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 rounded bg-surface">
                  <span className="text-text-main font-sans font-medium block">text-main (#e2e8f0)</span>
                  <span className="text-[11px] text-text-muted">Primary headings & body</span>
                </div>
                <div className="p-2 rounded bg-surface">
                  <span className="text-text-muted font-sans block">text-muted (#94a3b8)</span>
                  <span className="text-[11px] text-text-faint">Secondary annotations</span>
                </div>
                <div className="p-2 rounded bg-surface">
                  <span className="text-text-faint font-sans block">text-faint (#64748b)</span>
                  <span className="text-[11px] text-text-faint">Timestamps & counters</span>
                </div>
              </div>
            </LabCard>

            {/* WebRTC Route Tokens */}
            <LabCard className="p-4 space-y-3">
              <span className="text-xs font-mono font-semibold text-text-muted uppercase">Route Colors</span>
              <div className="flex flex-wrap gap-2 pt-1">
                <RouteBadge variant="host">host (LAN)</RouteBadge>
                <RouteBadge variant="srflx">srflx (STUN)</RouteBadge>
                <RouteBadge variant="relay">relay (TURN)</RouteBadge>
                <RouteBadge variant="checking">checking</RouteBadge>
                <RouteBadge variant="error">failed</RouteBadge>
                <RouteBadge variant="simulation">simulation</RouteBadge>
                <RouteBadge variant="neutral">in-flight</RouteBadge>
              </div>
            </LabCard>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: COMPONENT CATALOG */}
        {/* ========================================================= */}
        <section id="components" className="space-y-6">
          <div className="border-b border-border-subtle pb-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider">
              <Layers className="h-4 w-4" /> Section 2
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-main mt-1">Reusable Component Catalog</h2>
            <p className="text-sm text-text-muted mt-1">
              The 5 core building blocks specified in docs/DESIGN_STANDARD.md.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LabCard Variants */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">1. LabCard Variants</span>
              <LabCard variant="default" className="p-4">
                <div className="text-xs font-mono text-cyan-400 mb-1">variant="default"</div>
                <p className="text-sm text-text-muted">Standard surface for panels and step content.</p>
              </LabCard>
              <LabCard variant="raised" className="p-4">
                <div className="text-xs font-mono text-cyan-400 mb-1">variant="raised"</div>
                <p className="text-sm text-text-muted">Elevated surface for floating inspectors or modals.</p>
              </LabCard>
              <LabCard variant="interactive" className="p-4">
                <div className="text-xs font-mono text-cyan-400 mb-1">variant="interactive"</div>
                <p className="text-sm text-text-muted">Hover to see border transition.</p>
              </LabCard>
            </div>

            {/* DiagramNode States */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">2. DiagramNode States</span>
              <DiagramNode
                title="Peer A (Idle)"
                subtitle="192.168.1.10"
                state="idle"
                icon={<Laptop className="h-4 w-4" />}
                badge={<RouteBadge variant="neutral">Idle</RouteBadge>}
              />
              <DiagramNode
                title="Peer A (Active / Pulsing)"
                subtitle="Generating Offer..."
                state="active"
                icon={<Laptop className="h-4 w-4 text-cyan-400" />}
                badge={<RouteBadge variant="checking">Active</RouteBadge>}
              />
              <DiagramNode
                title="Peer B (Connected)"
                subtitle="142.250.190.46:5000"
                state="connected"
                icon={<Laptop className="h-4 w-4 text-emerald-400" />}
                badge={<RouteBadge variant="host">Connected</RouteBadge>}
              />
            </div>

            {/* ConceptDefinition & RouteBadges */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">3. ConceptDefinition</span>
              <LabCard className="p-4 space-y-4">
                <ConceptDefinition
                  question="How do browsers talk directly?"
                  analogy="Signaling is like a friend passing phone numbers between two people across a noisy room before they speak directly."
                />
              </LabCard>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: STEP 2 PROTOTYPE (OFFER & ANSWER) */}
        {/* ========================================================= */}
        <section id="step-demo" className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider">
                <LayoutGrid className="h-4 w-4" /> Section 3
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-text-main mt-1">
                Beginner Step 2: "The Business Card (SDP Offer & Answer)"
              </h2>
              <p className="text-sm text-text-muted mt-1">
                Demonstrating the full 6-part teaching structure across two layout variants.
              </p>
            </div>

            {/* Layout Variant Switcher */}
            <div className="inline-flex rounded-lg border border-border-subtle bg-surface p-1">
              <button
                type="button"
                onClick={() => setActiveVariant("variant-a")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeVariant === "variant-a"
                    ? "bg-surface-raised text-text-main border border-border-subtle shadow-sm"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                Variant A: Linear Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveVariant("variant-b")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeVariant === "variant-b"
                    ? "bg-surface-raised text-text-main border border-border-subtle shadow-sm"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                Variant B: Split Canvas
              </button>
            </div>
          </div>

          {/* VARIANT A: LINEAR FULL-WIDTH FLOW */}
          {activeVariant === "variant-a" && (
            <div className="mx-auto max-w-4xl space-y-8 py-4">
              {/* Part 1 & Header */}
              <StepHeader
                currentStep={2}
                totalSteps={6}
                categoryLabel="Beginner Mode"
                title="The Business Card: SDP Offer & Answer"
                subtitle="How do two browsers agree on what video, audio, and network formats they both understand?"
              />

              {/* Part 2: Analogy Callout */}
              <LabCard className="p-6">
                <ConceptDefinition
                  question="How do browsers describe their technical capabilities?"
                  analogy="SDP (Session Description Protocol) is like exchanging business cards before a call. It lists what languages you speak (codecs) and how you want to chat (data channel) so nobody talks gibberish."
                />
              </LabCard>

              {/* Part 3: Live Interactive Demo */}
              <LabCard className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                      Interactive Live Demo
                    </span>
                    <RouteBadge variant="simulation">In-Memory Loopback</RouteBadge>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetExchange}
                    className="inline-flex items-center gap-1 text-xs font-mono text-text-muted hover:text-text-main transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Reset
                  </button>
                </div>

                {/* SVG & Node Transfer Visual */}
                <div className="relative rounded-xl border border-border-subtle bg-canvas/60 p-6 md:p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
                    {/* Peer A */}
                    <DiagramNode
                      title="Peer A (Caller)"
                      subtitle="Local Browser"
                      state={exchangeState === "offering" ? "active" : exchangeState === "answered" ? "connected" : "idle"}
                      icon={<Laptop className="h-5 w-5 text-cyan-400" />}
                      badge={
                        exchangeState === "offering" ? (
                          <RouteBadge variant="checking">Sending Offer</RouteBadge>
                        ) : exchangeState === "answered" ? (
                          <RouteBadge variant="host">Offer Accepted</RouteBadge>
                        ) : (
                          <RouteBadge variant="neutral">Ready</RouteBadge>
                        )
                      }
                    >
                      <div className="text-xs text-text-muted space-y-1">
                        <div>Data Channel: <span className="font-mono text-text-main">active</span></div>
                        <div>Role: <span className="font-mono text-text-main">Offerer</span></div>
                      </div>
                    </DiagramNode>

                    {/* Peer B */}
                    <DiagramNode
                      title="Peer B (Callee)"
                      subtitle="Simulated Peer"
                      state={exchangeState === "answered" ? "connected" : "idle"}
                      icon={<Laptop className="h-5 w-5 text-emerald-400" />}
                      badge={
                        exchangeState === "answered" ? (
                          <RouteBadge variant="host">Answer Created</RouteBadge>
                        ) : (
                          <RouteBadge variant="neutral">Waiting</RouteBadge>
                        )
                      }
                    >
                      <div className="text-xs text-text-muted space-y-1">
                        <div>Compatibility: <span className="font-mono text-text-main">100% Match</span></div>
                        <div>Role: <span className="font-mono text-text-main">Answerer</span></div>
                      </div>
                    </DiagramNode>
                  </div>

                  {/* Transfer Status Message */}
                  <div className="mt-6 flex flex-col items-center justify-center gap-3">
                    {exchangeState === "initial" && (
                      <button
                        type="button"
                        onClick={handleTriggerExchange}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:bg-white active:scale-95"
                      >
                        <Send className="h-4 w-4" />
                        Create & Exchange SDP Offer
                      </button>
                    )}

                    {exchangeState === "offering" && (
                      <div className="flex items-center gap-2 text-sm font-mono text-amber-400 animate-pulse">
                        <RouteBadge variant="checking">Transmitting SDP Offer via Signaling...</RouteBadge>
                      </div>
                    )}

                    {exchangeState === "answered" && (
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Both peers have set local and remote descriptions!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Part 4: Plain Words "What Just Happened" */}
                {exchangeState === "answered" && (
                  <div className="rounded-lg bg-surface-raised p-4 border border-border-subtle space-y-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                      What Just Happened:
                    </span>
                    <p className="text-sm md:text-base text-text-main leading-relaxed">
                      Peer A packaged its media codecs and data channel parameters into an SDP Offer. Peer B accepted it, created a matching Answer, and both browsers now agree on how data will be sent.
                    </p>
                  </div>
                )}
              </LabCard>

              {/* Part 5: "Show Real Data" Progressive Disclosure */}
              <LabCard className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-text-main">Inspect Real SDP Data</span>
                    <span className="text-xs text-text-muted">(Progressive Disclosure)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRawSdp(!showRawSdp)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-text-main hover:border-border-hover transition-colors"
                  >
                    {showRawSdp ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showRawSdp ? "Hide Raw SDP" : "Show Real Data"}
                  </button>
                </div>

                {showRawSdp && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-text-muted">SDP Offer (from Peer A)</span>
                      <pre className="rounded-lg border border-border-subtle bg-canvas p-3 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
                        {sampleOfferSdp}
                      </pre>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-text-muted">SDP Answer (from Peer B)</span>
                      <pre className="rounded-lg border border-border-subtle bg-canvas p-3 font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                        {sampleAnswerSdp}
                      </pre>
                    </div>
                  </div>
                )}
              </LabCard>

              {/* Part 6: Check Yourself Quiz (Soft-Gated) */}
              <LabCard className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    Part 6 • Check Yourself
                  </span>
                </div>

                <p className="text-base font-medium text-text-main">
                  Why must both browsers exchange an SDP offer and answer before connecting?
                </p>

                <div className="space-y-2.5">
                  {[
                    { id: 0, text: "To negotiate compatible codecs, encryption keys, and network formats so both sides understand each other." },
                    { id: 1, text: "To stream the actual video frames directly through the signaling server." },
                    { id: 2, text: "To download browser extensions needed for WebRTC audio playback." },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedQuizOption(option.id);
                        setQuizSubmitted(true);
                      }}
                      className={`w-full text-left rounded-lg p-3.5 text-sm transition-all border ${
                        selectedQuizOption === option.id
                          ? option.id === 0
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                            : "bg-rose-500/10 border-rose-500/40 text-rose-200"
                          : "bg-surface-raised border-border-subtle hover:border-border-hover text-text-main"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-subtle text-xs font-mono">
                          {option.id === 0 ? "A" : option.id === 1 ? "B" : "C"}
                        </span>
                        <span>{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {quizSubmitted && (
                  <div
                    className={`rounded-lg p-3.5 text-sm border ${
                      selectedQuizOption === 0
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : "bg-amber-950/20 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {selectedQuizOption === 0 ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Correct! The SDP exchange guarantees both peers agree on media formats and security parameters before opening the wire.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span>Not quite. SDP is only session metadata, not media data. Media travels directly peer-to-peer over UDP once ICE completes.</span>
                        <button
                          type="button"
                          onClick={() => setSelectedQuizOption(0)}
                          className="shrink-0 text-xs font-mono underline hover:text-white"
                        >
                          Explain & Continue
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </LabCard>
            </div>
          )}

          {/* VARIANT B: SPLIT CANVAS WORKBENCH */}
          {activeVariant === "variant-b" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4 items-start">
              {/* Left Column (Canvas & Visual Nodes) - 7 cols */}
              <div className="lg:col-span-7 space-y-6">
                <StepHeader
                  currentStep={2}
                  totalSteps={6}
                  categoryLabel="Beginner Mode"
                  title="The Business Card: Offer & Answer"
                  subtitle="How do two browsers agree on codecs and network channels?"
                />

                <LabCard className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                      Live Diagram Canvas
                    </span>
                    <button
                      type="button"
                      onClick={handleResetExchange}
                      className="inline-flex items-center gap-1 text-xs font-mono text-text-muted hover:text-text-main transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" /> Reset
                    </button>
                  </div>

                  {/* Nodes in Horizontal Layout */}
                  <div className="rounded-xl border border-border-subtle bg-canvas/60 p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <DiagramNode
                        title="Peer A"
                        subtitle="Offerer"
                        state={exchangeState === "offering" ? "active" : exchangeState === "answered" ? "connected" : "idle"}
                        icon={<Laptop className="h-4 w-4 text-cyan-400" />}
                        badge={
                          <RouteBadge variant={exchangeState === "answered" ? "host" : "neutral"}>
                            {exchangeState === "answered" ? "Ready" : "Local"}
                          </RouteBadge>
                        }
                      />
                      <DiagramNode
                        title="Peer B"
                        subtitle="Answerer"
                        state={exchangeState === "answered" ? "connected" : "idle"}
                        icon={<Laptop className="h-4 w-4 text-emerald-400" />}
                        badge={
                          <RouteBadge variant={exchangeState === "answered" ? "host" : "neutral"}>
                            {exchangeState === "answered" ? "Ready" : "Remote"}
                          </RouteBadge>
                        }
                      />
                    </div>

                    <div className="flex flex-col items-center justify-center pt-2">
                      {exchangeState === "initial" && (
                        <button
                          type="button"
                          onClick={handleTriggerExchange}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:bg-white active:scale-95"
                        >
                          <Send className="h-4 w-4" />
                          Create & Exchange SDP Offer
                        </button>
                      )}
                      {exchangeState === "offering" && (
                        <div className="text-xs font-mono text-amber-400 animate-pulse">
                          Exchanging SDP over signaling channel...
                        </div>
                      )}
                      {exchangeState === "answered" && (
                        <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> SDP Exchange Finished
                        </div>
                      )}
                    </div>
                  </div>

                  {/* What Just Happened Callout */}
                  {exchangeState === "answered" && (
                    <div className="rounded-lg bg-surface-raised p-4 border border-border-subtle">
                      <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-1">
                        What Just Happened:
                      </span>
                      <p className="text-sm text-text-main leading-relaxed">
                        Peer A created an offer describing its codecs and data channel. Peer B accepted it and replied with an answer agreeing to compatible settings.
                      </p>
                    </div>
                  )}
                </LabCard>
              </div>

              {/* Right Column (Inspector & Quiz) - 5 cols */}
              <div className="lg:col-span-5 space-y-6">
                {/* Analogy Card */}
                <LabCard className="p-5">
                  <ConceptDefinition
                    question="What is an SDP exchange?"
                    analogy="SDP is like a business card that lists your phone number, speaking languages, and office hours before you start talking."
                  />
                </LabCard>

                {/* Real Data Inspector */}
                <LabCard className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                      Raw Data Inspector
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRawSdp(!showRawSdp)}
                      className="text-xs font-mono text-text-muted hover:text-text-main underline"
                    >
                      {showRawSdp ? "Collapse" : "Expand"}
                    </button>
                  </div>

                  {showRawSdp ? (
                    <pre className="rounded border border-border-subtle bg-canvas p-3 font-mono text-[11px] text-cyan-300 max-h-48 overflow-y-auto">
                      {sampleOfferSdp}
                    </pre>
                  ) : (
                    <p className="text-xs text-text-muted">
                      Click expand to inspect the raw Session Description Protocol (SDP) text generated by RTCPeerConnection.
                    </p>
                  )}
                </LabCard>

                {/* Quiz Card */}
                <LabCard className="p-5 space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
                    Check Yourself
                  </span>
                  <p className="text-sm font-medium text-text-main">
                    Why must both browsers exchange an SDP offer and answer?
                  </p>

                  <div className="space-y-2">
                    {[
                      { id: 0, text: "To negotiate compatible codecs, encryption, and formats." },
                      { id: 1, text: "To stream live video frames across the server." },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedQuizOption(option.id);
                          setQuizSubmitted(true);
                        }}
                        className={`w-full text-left rounded-md p-2.5 text-xs transition-colors border ${
                          selectedQuizOption === option.id
                            ? option.id === 0
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                              : "bg-rose-500/10 border-rose-500/40 text-rose-200"
                            : "bg-surface-raised border-border-subtle hover:border-border-hover text-text-main"
                        }`}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>

                  {quizSubmitted && (
                    <div className="text-xs text-emerald-300 pt-1">
                      {selectedQuizOption === 0 ? "Correct! Compatible codecs negotiated." : "Incorrect. SDP carries format metadata only."}
                    </div>
                  )}
                </LabCard>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
