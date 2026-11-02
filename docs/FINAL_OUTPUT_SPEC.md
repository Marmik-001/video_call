# WebRTC Learning Lab — Final Output Specification

## 1. System Architecture & Access Model

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                        GLOBAL NAVIGATION HEADER                          │
 │ [WebRTC Lab]   Mode: (•) Beginner Guide  ( ) Pro Lab    [Room / Lobby]   │
 └────────────────────────────────────┬─────────────────────────────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
┌──────────────────────────────┐    ┌───────────────────────────────────────┐
│     BEGINNER MODE (Free)     │    │          PRO LAB MODE (Dense)         │
│ • 100% In-Memory Loopback    │    │ • Room-Link: No login, 2-peer room    │
│ • No backend required        │    │ • Lobby / TURN Relay: Login required  │
│ • Two RTCPeerConnections     │    │ • Real Signaling Server (ws/wss)      │
│ • Scripted SVG Illustrations │    │ • Live Candidate Race, NAT, Stats     │
└──────────────────────────────┘    └───────────────────────────────────────┘
```

### Access Model
1. **Beginner**: Open to all, 0 network setup, runs entirely in the browser using two loopback `RTCPeerConnection` instances.
2. **Pro (No Account)**: Direct room-link mode. Clicking "Create Room" generates an unguessable 128-bit ID (`crypto.randomUUID()`). URL: `/#room=<uuid>`. Max 2 peers per room. In-memory, deleted when empty.
3. **Pro (Authenticated Lobby & TURN)**: (Future slice) Online user list & short-lived REST TURN credentials issued by server with rate limiting.

---

## 2. Beginner Mode Specification

### Layout Wireframe
```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Step 2 of 6: SDP Handshake]  ━━━━━●━━━━━━━━━━━━━━━ [Next Step >] [Auto] │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   Peer A (Local)                Simulated Mailbox          Peer B (Remote)│
│  ┌──────────────┐             ┌──────────────────┐        ┌──────────────┐│
│  │ Local Descr: │             │ [SIMULATED QUEUE]│        │ Remote Descr:││
│  │ "offer" (v)  │ ──(offer)──▶│ In-memory packet │───────▶│ "offer"      ││
│  └──────────────┘             └──────────────────┘        └──────────────┘│
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│ 💡 WHAT JUST HAPPENED?                                                    │
│ Peer A inspected its media capabilities and created an SDP "business      │
│ card" describing codecs and protocols, then queued it for Peer B.         │
│                                                  [Inspect Raw SDP Packet] │
└───────────────────────────────────────────────────────────────────────────┘
```

### Steps & State Machine
1. **Signaling ("The Matchmaker")**:
   - Visual: Simulated Mailbox (in-memory queue, explicitly labeled `[SIMULATION: In-Memory Mailbox]`).
   - Action: Exchange addresses without direct network socket.
2. **SDP Offer / Answer ("The Business Card")**:
   - Visual: Offer packet travels A ➔ Mailbox ➔ B; Answer travels B ➔ Mailbox ➔ A.
   - States: `setLocalDescription(offer)` ➔ `setRemoteDescription(offer)` ➔ `createAnswer()` ➔ `setRemoteDescription(answer)`.
3. **ICE Candidates ("Finding the Path")**:
   - Visual: Local candidates bubble up. Cards define each in one line:
     - `host`: Your device's private IP on local Wi-Fi.
     - `srflx`: Your public IP seen by a STUN server.
     - `relay`: A fallback TURN relay address.
4. **NAT Basics ("Firewalls & Gateways")**:
   - Visual: Scripted SVG illustration labeled `[ILLUSTRATION: Educational Animation]`.
   - Explains router port translation and why STUN hole-punching is required.
5. **Media Tracks ("Hooking the Wires")**:
   - Visual: Video element mounts.
   - Fallback: If camera permission is denied or device has no camera, automatic fallback to synthetic animated `canvas.captureStream()`.
6. **Data Channels ("Raw P2P Messaging")**:
   - Visual: Bidirectional text input ping-pong over `RTCDataChannel`.

---

## 3. Pro Lab Mode Specification

### Layout Wireframe (Dense Telemetry Bento)
```
┌───────────────────────────────────────┬───────────────────────────────────┐
│ 🌐 NAT & PATH TOPOLOGY (?)            │ 📹 VIDEO FEEDS (?)                │
│ [Alice] ──▶ [NAT: Cone] ──▶ [STUN]    │ ┌───────────────┐ ┌──────────────┐│
│                │                      │ │ Local (720p)  │ │ Remote       ││
│                ▼                      │ └───────────────┘ └──────────────┘│
│ [Route: srflx ↔ srflx] ──▶ [Bob]      ├───────────────────────────────────┤
│ *NAT Type: Cone (Estimated)           │ 📊 REAL-TIME RTP STATS (?)        │
│                                       │ Bitrate: 1,420 kbps   Loss: 0.0%  │
├───────────────────────────────────────┤ RTT: 28 ms            Jitter: 3ms │
│ 🏁 CANDIDATE RACE BOARD (?)           │ FPS: 30               Codec: VP8  │
│ Pair               State     Priority ├───────────────────────────────────┤
│ *srflx ↔ srflx     succeeded 1686...  │ 🎛️ CHAOS DECK (?)                 │
│  host ↔ host       failed    2122...  │ [x] Allow host   [x] Allow srflx  │
│  relay ↔ relay     frozen    1677...  │ [ ] Force Relay  [ICE Restart]    │
├───────────────────────────────────────┴───────────────────────────────────┤
│ 📁 P2P FILE SHARING (DataChannel) (?)  [Drop File] [====== 64% ======] 2.1 MB/s│
├───────────────────────────────────────────────────────────────────────────┤
│ 📜 LIVE EVENT STREAM (?)                                                  │
│ [14:02:11.201] [ICE] Local candidate gathered: srflx 103.21.x.x:49152    │
│ [14:02:11.450] [PAIR] State changed: srflx ↔ srflx -> SUCCEEDED           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Pro Lab Panels & Technical Rules
1. **NAT & Path Topology Visualizer (SVG)**:
   - Declarative SVG paths:
     - `host` route = `#10b981` (Emerald)
     - `srflx` route = `#06b6d4` (Cyan)
     - `relay` route = `#a855f7` (Purple)
     - `checking` route = `#f59e0b` (Amber)
   - Labels mDNS addresses (`*.local`) with tooltip: *"Local IP hidden by browser for privacy (RFC 8837)"*.
   - Evaluates mapped ports from 2 STUN servers to estimate NAT type; always displays badge: `[NAT: Symmetric/Cone (Estimated)]`.
2. **Candidate Race Board**:
   - Lists local and remote candidates with transport, foundation, priority, and IP scope.
   - Pair status: `frozen` | `waiting` | `in-progress` | `succeeded` | `failed`. Selected pair highlighted.
3. **RTP Telemetry Engine**:
   - 1Hz polling of `pc.getStats()`.
   - Math:
     - $\text{Bitrate (kbps)} = \frac{(\text{bytesReceived}_t - \text{bytesReceived}_{t-1}) \times 8}{(t - t-1) \times 1000}$
     - $\text{Packet Loss \%} = \frac{\Delta \text{packetsLost}}{\Delta \text{packetsLost} + \Delta \text{packetsReceived}} \times 100$
     - RTT directly from selected candidate pair `currentRoundTripTime * 1000`.
     - Jitter directly from `inbound-rtp.jitter * 1000` (ms).
   - Minimal SVG sparkline rendering (last 30 samples).
4. **Chaos & Simulation Deck**:
   - Filter checkboxes: intercept and drop `host`, `srflx`, or `relay` candidates before sending.
   - `iceTransportPolicy: "relay"` toggle (re-triggers connection).
   - `[ICE Restart]` button (`pc.restartIce()`).
5. **P2P DataChannel File Sharing**:
   - Slices file into 64KB `ArrayBuffer` chunks.
   - Backpressure check: pauses sending when `dataChannel.bufferedAmount > 1MB`, resumes on `bufferedamountlow`.
   - Receiver reassembles chunks and computes SHA-256 hash to verify integrity against sender's hash.
6. **Live Event Stream**:
   - Monospace terminal log subscribing to typed event store. Includes filter by category (`SIGNALING`, `ICE`, `STATS`, `CHAOS`).

---

## 4. Unified Typed Event & Store Model

All components consume a single Zustand event store.

```typescript
export type EventCategory = "SIGNALING" | "ICE" | "STATS" | "DATA_CHANNEL" | "CHAOS";

export interface BaseEvent {
  id: string;
  timestamp: number;
  category: EventCategory;
  summary: string;
}

export interface SignalingEvent extends BaseEvent {
  category: "SIGNALING";
  type: "OFFER_SENT" | "OFFER_RECEIVED" | "ANSWER_SENT" | "ANSWER_RECEIVED";
  sdpSnippet: string;
}

export interface CandidateGatheredEvent extends BaseEvent {
  category: "ICE";
  origin: "local" | "remote";
  candidateType: "host" | "srflx" | "prflx" | "relay";
  protocol: "udp" | "tcp";
  address: string; // handles *.local mDNS
  port: number;
}

export interface PairStateChangedEvent extends BaseEvent {
  category: "ICE";
  pairId: string;
  state: "frozen" | "waiting" | "in-progress" | "succeeded" | "failed";
  localType: string;
  remoteType: string;
  isSelected: boolean;
}

export interface RtpSampleEvent extends BaseEvent {
  category: "STATS";
  bitrateKbps: number;
  packetLossPercent: number;
  roundTripTimeMs: number;
  jitterMs: number;
  fps: number;
  resolution: { width: number; height: number };
  codec: string;
}

export interface FileTransferProgressEvent extends BaseEvent {
  category: "DATA_CHANNEL";
  fileName: string;
  bytesTransferred: number;
  totalBytes: number;
  speedMbps: number;
  isComplete: boolean;
  sha256Hash?: string;
}

export type LabEvent = 
  | SignalingEvent 
  | CandidateGatheredEvent 
  | PairStateChangedEvent 
  | RtpSampleEvent 
  | FileTransferProgressEvent;
```

---

## 5. Acceptance Criteria Checklist

### Slice 0 (Foundations)
- [ ] `tsc -b` succeeds without TS5101 deprecation error.
- [ ] `npm --prefix frontend run build` and `npm --prefix frontend run lint` exit with code 0.
- [ ] `App.tsx` has `[]` dependency array on mount effect; zero duplicate WebSocket connections logged.
- [ ] WebSocket client connects via `ws://` on `http:`, and `wss://` on `https:`.

### Beginner Mode (Loopback)
- [ ] Step 1–6 complete end-to-end entirely in memory with no active backend socket.
- [ ] If camera is blocked/unavailable, `canvas.captureStream()` generates an active video feed within 500ms without throwing an unhandled exception.
- [ ] Each step pauses and displays "What Just Happened?" card until user clicks "Next Step" or enables auto-advance.

### Pro Mode
- [ ] Room link: `window.location.hash` with `#room=<uuid>` allows 2 tabs (normal + incognito) to connect within 3s.
- [ ] Candidate board: Within 2s of `iceConnectionState === "connected"`, the active pair is highlighted with `succeeded` status.
- [ ] mDNS names (`*.local`) render with an info tooltip explaining RFC 8837 privacy masking.
- [ ] NAT type estimation displays the badge `(Estimated)` at all times.
- [ ] Stats engine: Bitrate, packet loss, and RTT update at 1Hz without causing full dashboard re-renders.
- [ ] Chaos deck: Checking "Block srflx" prevents any `srflx` candidates from being transmitted in signaling.
- [ ] File share: Sending a 5MB test file transfers completely, renders progress from 0% to 100%, and verifies matching SHA-256 hashes on both peers.

---

## 6. Out of Scope Boundaries

- Multi-party mesh, SFU, or MCU (1-on-1 calls only).
- Production OAuth / user passwords (in-memory room IDs and guest sessions only for now).
- Mobile-native wrapper (PWA/responsive web only).
- Commercial TURN provisioning (local/public STUN and user-provided TURN config only).
