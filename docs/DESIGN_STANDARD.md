# WebRTC Learning Lab — Design Standard (Neutral Vercel Aesthetic)

This specification defines the visual language, design tokens, typography, and component standards for both **Beginner Guide** and **Pro Telemetry Lab**, based on direct pixel sampling of `docs/references/vercel-dashboard.png`.

---

## 1. Aesthetic Identity: "Neutral Vercel Precision"

Directly grounded in the reference screenshot (`docs/references/vercel-dashboard.png`):
* **Near-Pure Black Canvas**: Pure black backdrop (`#000000`, 79.2% of sampled image).
* **Layered Neutral Surfaces**: Monochrome slate surfaces (`#0a0a0a` base, `#121212` raised / cards, `#171717` interactive).
* **Hairline Precision**: 1px borders (`#242424`, hover `#404040`). No drop shadows.
* **Meaningful Route Color Only**: Route colors (host `#34d399`, srflx `#22d3ee`, relay `#a78bfa`, checking `#fbbf24`, error `#f87171`) are strictly isolated to route types, active steps, status dots, and errors. All chrome, cards, backgrounds, and layout controls are strictly neutral monochrome.
* **Glow Rules**: Static elements **never** glow. Active transmitting elements receive at most a subtle 1px colored ring and a faint halo (`box-shadow: 0 0 0 1px color/25%, 0 0 16px color/8%`).
* **Radius Precision**:
  - Cards and structural panels: `8px` (`rounded-[8px]`)
  - Buttons and inputs: `6px` (`rounded-[6px]`)
  - Badges and status pills: `9999px` (`rounded-full`)

---

## 2. Sampled Color Tokens & CSS Variables

Sampled via script from `docs/references/vercel-dashboard.png`:

```css
:root {
  /* Surfaces */
  --bg-canvas: #000000;          /* Main screen backdrop (sampled #000000) */
  --bg-surface: #0a0a0a;         /* Card interiors, structural containers */
  --bg-surface-raised: #121212;  /* Elevated cards, search bar fill (sampled #121212) */

  /* Borders */
  --border-subtle: #242424;      /* Hairline border (sampled #242424 / #262626) */
  --border-hover: #404040;       /* Interactive hover border (sampled #404040) */
  --border-active: #505050;      /* Focused / active state (sampled #505050) */

  /* Content */
  --text-main: #ededed;          /* Primary text (sampled #ededed, RGB 237,237,237) */
  --text-muted: #a1a1a1;         /* Subtitles & explanations (sampled #9f9f9f / #a1a1a1) */
  --text-faint: #666666;         /* Timestamps & keycap legends (sampled #666666) */

  /* Semantic Route Tokens (Kept strictly for WebRTC meaning) */
  --route-host: #34d399;         /* Emerald: Direct LAN private route */
  --route-srflx: #22d3ee;        /* Cyan: STUN public reflective route */
  --route-relay: #a78bfa;        /* Purple: TURN relay route */
  --route-checking: #fbbf24;     /* Amber: ICE checking / in-flight signaling */
  --route-error: #f87171;        /* Red: Failed candidate pair / alert */
}
```

---

## 3. Style & Layout Rules

### Buttons Hierarchy (Exactly One Primary Per Screen)
1. **Primary**: High-contrast white fill, black text (`bg-[#ededed] text-black hover:bg-white`, radius `6px`).
2. **Secondary**: Dark fill with subtle border (`bg-[#121212] border border-[#242424] text-[#ededed] hover:border-[#404040]`, radius `6px`).
3. **Ghost (Tertiary)**: Subtle hover fill (`text-[#a1a1a1] hover:text-[#ededed] hover:bg-[#121212]`, radius `6px`).

### Cards & Section Labels
- **Pattern**: Small uppercase section label above the card (`text-xs font-mono font-medium tracking-wider text-[#a1a1a1] uppercase mb-2`), followed by the bordered card below (`bg-[#0a0a0a] border border-[#242424] rounded-[8px]`).
- **List Rows**: Row items inside cards use subtle alternating or hover fills (`hover:bg-[#121212]/70`) with 1px border dividers (`border-b border-[#242424]/60`).

### Empty States
- Square bordered icon container (`h-10 w-10 rounded-[6px] border border-[#262626] bg-[#121212]`).
- One muted explanation sentence (`text-sm text-[#a1a1a1]`).
- One action button (`rounded-[6px] border border-[#262626] bg-[#171717] px-3.5 py-1.5 text-xs text-[#ededed]`).

### Keycap Badges & Keyboard Navigation
- Small bordered keycaps (`Keycap.tsx`: `border border-[#333333] bg-[#121212] px-1.5 py-0.5 text-[10px] font-mono text-[#a1a1a1] rounded-[4px]`).
- Keyboard shortcuts: `[←]` for Back, `[→]` for Next, `[Space/Enter]` to trigger action.

### Status Indicators
- Small status dot (`h-2 w-2 rounded-full`) + label, or full-round pill badge (`rounded-full px-2.5 py-0.5 border text-xs font-mono`). Never giant loud alert banners.

---

## 4. Density & Sizing Standards

| Setting | Beginner Mode | Pro Workbench Mode |
| :--- | :--- | :--- |
| **Philosophy** | Spacious, calm, readable, progressive | Dense, high-information telemetry grid |
| **Step Title** | 28px – 32px (Medium weight 500) | 18px – 20px |
| **Section Label**| 12px font-mono uppercase | 11px – 12px font-mono uppercase |
| **Body Text** | **>= 16px (16px – 18px)** | 13px – 14px |
| **Diagram Labels**| **>= 14px** | 12px – 13px |
| **Mono Data** | 14px (`font-mono`) | 12px – 13px (`font-mono`) |
| **Interactive Targets** | **>= 40px height** (touch & click friendly) | 32px – 36px height |
| **Card Padding** | 24px (`p-6`) | 12px – 16px (`p-3` to `p-4`) |
