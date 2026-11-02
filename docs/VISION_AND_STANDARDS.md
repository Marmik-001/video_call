# WebRTC Learning Lab & Observability Workbench
## Vision, Philosophy, and Design Standards

---

## 1. Project Mission & Identity

This project is **not** another generic Zoom/Meet clone.  
It is an **Interactive WebRTC Diagnostic Lab and Learning Workbench**.

### Core Philosophy: The Dual-Mode Experience
WebRTC is notoriously difficult to learn because the browser handles massive complexity under the hood (SDP negotiations, ICE candidate gathering, STUN/TURN binding, RTP/RTCP packets, and NAT traversal). Beginners get lost in jargon, while experienced developers lack clear real-time visual telemetry to see *why* and *how* their peers are connected.

To bridge this gap, the application provides **two distinct modes**:

```
 ┌────────────────────────────────────────────────────────────┐
 │                  MODE SWITCHER (Top Bar)                   │
 │   [ 🐣 Step-by-Step Interactive Guide ]  [ 🛰️ Mission Lab ] │
 └─────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   【 Beginner Guided Mode 】            【 Pro Telemetry Lab 】
  • Slow, step-by-step walkthrough      • Dense Bloomberg / Mission Control grid
  • Plain-English concept cards         • Real-time RTP graphs (bitrate, loss, jitter)
  • Visual packet hops (SDP, ICE)       • NAT Traversal topology map
  • Video stream & DataChannel basics   • Chaos simulation (block STUN, force TURN)
                                        • P2P File Transfer with chunk stats
```

---

## 2. Design System & Aesthetic Standard: "Retro-Modern Mission Control"

### The Aesthetic
* **Vibe**: Aerospace telemetry / Terminal command center meets modern developer tool (Linear/Datadog).
* **Information Density**: High density without visual clutter, using clear borders, status badges, and monospace metrics.
* **Visual Representation**: Lightweight, understandable wireframes, SVG paths, or ASCII/diagrammatic connectors (`|||`, `───`, `──▶`, `[===]`) that make complex network paths instantly clear without heavy 3D assets.

### Color Palette (Tailwind Tokens)

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Canvas Background** | `#080c14` / `bg-slate-950` | Primary dark terminal backdrop |
| **Panel Surface** | `#0f172a` / `bg-slate-900` | Cards, module panels, telemetry tiles |
| **Panel Border** | `#1e293b` / `border-slate-800` | Crisp structural borders (1px solid) |
| **Primary Text** | `#f8fafc` / `text-slate-50` | Monospace headers, key data readouts |
| **Secondary / Muted** | `#64748b` / `text-slate-500` | Explanations, technical metadata, labels |
| **Host / LAN Route** | `#10b981` / `text-emerald-400` | Direct local network connection (`host`) |
| **STUN / Direct P2P** | `#06b6d4` / `text-cyan-400` | NAT-traversed public connection (`srflx`) |
| **TURN / Relay Route** | `#a855f7` / `text-purple-400` | Relayed connection through TURN server (`relay`) |
| **Checking / Pending**| `#f59e0b` / `text-amber-400` | ICE checking, signaling in-flight, warnings |
| **Drop / Error / Loss**| `#ef4444` / `text-rose-500` | Packet loss, connection failures, disconnect |

### Typography
* **Data & Metrics**: Monospace (`font-mono`, Geist Mono / JetBrains Mono).
* **Headings & Body**: Clean sans-serif (`font-sans`, Geist / Inter) for readable educational explainers.

---

## 3. Visual Language: Network Flow & Wireframes

Instead of bloated 3D graphics, network flows use structured ASCII/SVG diagrams:

```
[ ALICE: 192.168.1.15 ] ───( LAN Host )───▶ [ BOB: 192.168.1.42 ]
         │                                          ▲
   ( NAT Cone )                               ( NAT Symmetric )
         │                                          │
         └───▶ [ STUN: Google ] ──( srflx )─────────┘  
                   │
                   └───▶ [ TURN: Relay ] (Fallback if symmetric)
```

* **Packets in Flight**: Pulsing dots or arrows along connecting lines showing:
  * SDP Offer/Answer flying across the WebSocket Signaling Server.
  * ICE Candidates trickling as they are gathered.
  * Media packets streaming directly peer-to-peer or bouncing through TURN.
