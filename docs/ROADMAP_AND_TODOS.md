# Project Roadmap & Slice Plan

---

## ✅ Done

- [x] **Slice 0: Clean Baseline Build & Fix Known Bugs**
  - Removed deprecated `baseUrl` in `tsconfig.app.json` and `tsconfig.json` without breaking `@/` path aliases.
  - Added dependency array `[]` and cleanup function to `App.tsx`'s `useEffect` to avoid duplicate WebSocket connections on StrictMode mount. Verified single active socket per tab.
  - Added dynamic signaling URL resolution (`getSignalingUrl`) with fallback to `ws://` / `wss://` and added `.env.example` templates for frontend and backend.
  - Installed pinned dependencies: `motion@14.9.0`, `zustand@5.0.16`, and `vitest@5.0.5`.
  - Removed unreachable prototype files in separate commit `05720df`.
  - Fixed all reachable code type errors, missing parameters, and fast-refresh lint issues properly.
  - `npm run build`, `tsc -b`, `eslint .`, and `npm test` all exit 0.

---

## 🎯 Next Session Starts Here: Slice 1

- [ ] **Slice 1: In-Memory WebRTC Loopback Engine & Zustand Event Store**
  - Implement Zustand `useLabStore` typed event model.
  - Implement in-memory loopback peer connection pair (`peerA` ↔ `peerB`) in `loopback.service.ts`.
  - Add simulated in-memory mailbox queue with pause/step hooks.
  - Unit tests in Vitest for loopback offer/answer handshake and event dispatching.

---

## 📌 Phase 1: Beginner Mode (In-Memory Loopback)

- [ ] **Slice 1: In-Memory WebRTC Loopback Engine**
  - Peer A & Peer B instances in the same browser window.
  - In-memory simulated mailbox queue with paused steps.
  - Unit tests in Vitest for loopback offer/answer handshake.
- [ ] **Slice 2: 6-Step Beginner Walkthrough UI**
  - Step 1: Signaling concept (simulated mailbox).
  - Step 2: SDP Offer/Answer business card exchange.
  - Step 3: ICE candidate gathering & definitions (`host`, `srflx`, `relay`).
  - Step 4: NAT basics (educational SVG animation, labeled as illustration).
  - Step 5: Media tracks with camera stream and `canvas.captureStream()` synthetic fallback.
  - Step 6: RTCDataChannel peer-to-peer text exchange.
  - "What Just Happened?" collapsible card & Next/Back/Auto-advance controls.

---

## ⚡ Phase 2: Pro Lab Mode (Mission Control Grid)

- [ ] **Slice 3: Room-Link Mode**
  - Random 128-bit room IDs (`crypto.randomUUID()`) via URL hash (`#room=<id>`).
  - Backend in-memory room management (max 2 peers per room, deleted when empty).
  - Two-tab testing documentation banner in UI.
- [ ] **Slice 4: Typed Event Model & Stats Engine**
  - Connect Zustand event store to `pc.getStats()` at 1Hz.
  - Delta math: bitrate (kbps), packet loss %, RTT (ms), jitter (ms), FPS, resolution.
  - Minimal SVG sparkline rendering.
  - Unit tests for stats math (rollover handling, delta calculations).
- [ ] **Slice 5: Candidate Race Board & mDNS Handler**
  - Real-time candidate matrix (local vs remote).
  - Pair state progression (`frozen` ➔ `waiting` ➔ `in-progress` ➔ `succeeded` / `failed`).
  - RFC 8837 mDNS (`*.local`) label with tooltip explainer.
- [ ] **Slice 6: NAT & Path Topology Visualizer (SVG)**
  - Declarative SVG diagram: `Local ➔ NAT ➔ STUN/TURN ➔ Remote NAT ➔ Remote Peer`.
  - Dynamic route color coding (Host = Emerald, srflx = Cyan, Relay = Purple, Checking = Amber).
  - Dual STUN port comparison for estimated NAT type badge: `(Estimated)`.
- [ ] **Slice 7: Chaos & Simulation Deck**
  - Checkboxes to intercept and drop candidate types before signaling.
  - `iceTransportPolicy: "relay"` toggle.
  - Live ICE restart button.
- [ ] **Slice 8: P2P DataChannel File Transfer**
  - 64KB chunking with backpressure flow control (`bufferedAmount`).
  - Transfer progress bar, MB/s speed, and SHA-256 integrity hash verification.
- [ ] **Slice 9: Event Stream Terminal Log Polish**
  - Monospace terminal log with timestamp, category filtering, and packet inspection modal.

---

## 🔮 Phase 3: Future Scope

- [ ] Auth provider, user database, and TURN server hosting selection (consult user before starting).
- [ ] Short-lived REST TURN credentials generation.
- [ ] Signaling rate limiting and report/block mechanism for lobby users.
- [ ] Playwright E2E tests for 2-browser room connection.

---

## 📝 Session Log
* **2026-11-02**: Specification defined in `FINAL_OUTPUT_SPEC.md` and approved roadmap established.
* *Next session starts here:* Execute **Slice 0** (fix TS5101, App.tsx useEffect, ws/wss URL, install zustand, motion, vitest).
