# WebRTC Learning Lab — Design Standard & Vercel Aesthetic System

This specification defines the visual language, design tokens, typography, and component standards for both **Beginner Guide** and **Pro Telemetry Lab**.

---

## 1. Aesthetic Identity: "Vercel-Grade Precision"

Inspired by modern developer platforms (Vercel, Linear, Raycast):
* **Dark, Deep Canvas**: Deep obsidian backdrop (`#080c14`) paired with layered slate surfaces (`#0f1623` and `#151d2e`).
* **Crisp Structural Depth**: High-precision 1px borders (`#1e293b`) rather than heavy drop shadows. Depth is communicated through surface contrast and subtle borders.
* **Restrained, Meaningful Glow**: Glow effects are **forbidden** on static elements. Glow is reserved exclusively for actively transmitting packets, live pulse indicators, and active candidate paths (`box-shadow: 0 0 0 1px color/40%, 0 0 24px color/15%`).
* **Typography Hierarchy**: Human-readable, legible type scale using **Geist** for UI and **Geist Mono** for data, IPs, and SDP logs.

---

## 2. Design Tokens & CSS Variables

All colors must be referenced via CSS variables or semantic Tailwind tokens. **Hardcoded hex codes in component files are strictly prohibited.**

### Core Surface & Content Palette

```css
:root {
  /* Surfaces */
  --bg-canvas: #080c14;          /* Main screen backdrop */
  --bg-surface: #0f1623;         /* Cards, structural panels */
  --bg-surface-raised: #151d2e;  /* Modals, interactive popovers, raised cards */

  /* Borders */
  --border-subtle: #1e293b;      /* Default card/panel border */
  --border-hover: #334155;       /* Interactive hover state */
  --border-active: #475569;      /* Focused / Selected border */

  /* Content */
  --text-primary: #e2e8f0;       /* Headings, primary body */
  --text-muted: #94a3b8;         /* Subtitles, secondary notes, explanations */
  --text-faint: #64748b;         /* Meta timestamps, unselected tabs */

  /* WebRTC Route Tokens */
  --route-host: #34d399;         /* Emerald: Direct LAN private route */
  --route-srflx: #22d3ee;        /* Cyan: STUN NAT-traversed public route */
  --route-relay: #a78bfa;        /* Purple: TURN relay route */
  --route-checking: #fbbf24;     /* Amber: ICE checking / in-flight signaling */
  --route-error: #f87171;        /* Red: Failed pair, packet loss alert */

  /* Radii */
  --radius-card: 12px;           /* Cards, major panels */
  --radius-control: 8px;         /* Buttons, inputs, dropdowns */
  --radius-pill: 9999px;         /* Badges, status indicator dots */

  /* Spacing Scale (8px Grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
}
```

---

## 3. Typography & Hierarchy

Both fonts are loaded natively from `@fontsource-variable/geist` and `Geist Mono`.

| Element | Font Family | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- | :--- |
| **Step Title** | `font-sans` (Geist) | 28px – 32px | 700 (Bold) | 1.2 |
| **Section Heading** | `font-sans` (Geist) | 20px – 22px | 600 (Semibold) | 1.3 |
| **Card Heading** | `font-sans` (Geist) | 16px – 18px | 600 (Semibold) | 1.4 |
| **Body Text** | `font-sans` (Geist) | **16px (Minimum)** | 400 (Regular) | 1.6 |
| **Diagram Labels** | `font-sans` (Geist) | 14px | 500 (Medium) | 1.4 |
| **Data / Code / IP** | `font-mono` (Geist Mono)| 14px | 400 – 500 | 1.5 |
| **Pill Badges** | `font-mono` (Geist Mono)| 12px | 600 (Semibold) | 1.0 |

---

## 4. Layout Architecture: Two Densities

### (a) Beginner Mode Layout (Spacious, Single-Column Focus)
* **Max Width**: `max-w-[1100px]`, horizontally centered with generous whitespace (`py-12 px-6`).
* **Visual Priority**: The central diagram occupies 60%+ of the viewport height. Cards below it use progressive disclosure so learners aren't overwhelmed with text.
* **Atmosphere**: Calm, uncluttered, focused on one mental model at a time.

```
┌──────────────────────────────────────────────────────────────┐
│  [Step 2 of 6: The Business Card]        [ < Back ] [ Next >]│
├──────────────────────────────────────────────────────────────┤
│  Question: "How do two browsers agree on formats?"           │
│  Analogy: Exchanging business cards before a meeting.        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                   LARGE CENTRAL DIAGRAM                      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [What Just Happened?]                                       │
│  [Show Real Data (SDP) >]                                    │
│  [Check Yourself Quiz]                                       │
└──────────────────────────────────────────────────────────────┘
```

### (b) Pro Lab Mode Layout (Dense Bento Grid)
* **Max Width**: `w-full` 12-column grid with `12px – 16px` gaps.
* **Visual Priority**: High information density, monospace readouts, compact video PiP, real-time charts.
* **Atmosphere**: Mission control cockpit, maximum telemetry per square inch.

---

## 5. Reusable Component Specifications

### 1. `LabCard`
* **Purpose**: Structural container for all content panels.
* **Variants**:
  * `default`: `bg-surface border-border rounded-xl p-6`
  * `raised`: `bg-surface-raised border-border rounded-xl p-6 shadow-sm`
  * `interactive`: `bg-surface border-border hover:border-border-hover transition-colors rounded-xl p-6 cursor-pointer`

### 2. `RouteBadge`
* **Purpose**: Identifies connection routes, status, and simulation tags.
* **Variants**:
  * `host`: Green background tint, green border, green text: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`
  * `srflx`: Cyan background tint, cyan border, cyan text: `bg-cyan-500/10 text-cyan-400 border-cyan-500/20`
  * `relay`: Purple background tint, purple border, purple text: `bg-purple-500/10 text-purple-400 border-purple-500/20`
  * `simulation`: Amber tint: `bg-amber-500/10 text-amber-400 border-amber-500/20`
  * `neutral`: Slate tint: `bg-slate-800 text-slate-300 border-slate-700`

### 3. `StepHeader`
* **Purpose**: Navigation bar showing current step count, lesson title, progress bar, and Next/Back controls.
* **Specs**: Large step title (28px), clear progress meter (4px height), and prominent action buttons.

### 4. `ConceptDefinition`
* **Purpose**: Clean educational card presenting the human question and the one-sentence analogy.
* **Specs**: Left accent border (3px solid `#22d3ee`), subtle surface background, 16px body text.

### 5. `DiagramNode`
* **Purpose**: Visual peer or server box inside diagrams.
* **Variants**:
  * `idle`: Solid slate-900 with 1px border.
  * `active`: Active glowing border (`box-shadow: 0 0 0 1px #22d3ee40, 0 0 20px #22d3ee15`).
  * `connected`: Emerald route glow (`#34d399`).

---

## 6. Accessibility & Motion Rules

* **Contrast**: All text combinations must exceed **4.5:1** contrast ratio against their immediate background (WCAG AA compliant).
* **Reduced Motion**: All `motion/react` components must query `useReducedMotion()`. When active, animated translations and packet hops convert into immediate opacity fades (`duration: 0.1s`).
