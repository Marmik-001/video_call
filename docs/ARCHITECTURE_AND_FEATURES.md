# System Architecture & Feature Specification

---

## 1. Mode 1: Step-by-Step Interactive Guide (Beginner Curriculum)

The goal of this mode is to demystify WebRTC by breaking down connection establishment into clear, sequential checkpoints with visual feedback.

### Stage 1: The Signaling Server Handshake
* **Concept Card**: *"Why do we need a server if WebRTC is Peer-to-Peer?"*  
  Explains that peers don't know each other's IP address, NAT port, or supported codecs initially. The WebSocket acts as the matchmaker.
* **Live Visual**:
  * Peer A registers username `alice` ➔ WebSocket sends `USER_CONNECTED` ➔ Bob sees `alice` online.

### Stage 2: The SDP Offer/Answer Exchange
* **Concept Card**: *"What is an SDP (Session Description Protocol)?"*  
  Explain SDP as the "business card" listing codecs, media types (audio/video/data), and network settings.
* **Interactive Trigger**:
  1. Alice clicks **"Generate Offer"**.
  2. Visual animates: `createOffer()` ➔ `setLocalDescription()` ➔ Packet hops over WebSocket to Bob.
  3. Bob reviews incoming offer card and clicks **"Accept & Create Answer"**.
  4. Visual animates: `setRemoteDescription(offer)` ➔ `createAnswer()` ➔ `setLocalDescription(answer)` ➔ Answer hops back to Alice.
  5. Alice completes handshake: `setRemoteDescription(answer)`.

### Stage 3: The ICE Candidate Trickle & NAT Discovery
* **Concept Card**: *"What is an ICE Candidate?"*  
  Explain in one sentence: *"An address (IP + port + protocol) where a peer can potentially be reached."*
* **Live Candidate Discovery Cards**:
  * **Host Candidate**: *"This is your device's private IP on your local Wi-Fi router (e.g. 192.168.1.15)."*
  * **Server Reflexive (srflx)**: *"Your public IP discovered by pinging the STUN server (e.g. 103.21.x.x)."*
  * **Relay Candidate**: *"A TURN server relay address in case your NAT blocks direct hole-punching."*
* **Live Visual**:
  * Shows candidates bubbling up one by one with a progress counter (`Gathered 4 local candidates... sending to peer`).

### Stage 4: Media Track & DataChannel Attachment
* **Concept Card**: *"How does the browser stream video vs arbitrary data?"*
  * `addTrack()` attaches camera/mic to the PeerConnection RTP pipeline.
  * `createDataChannel()` opens a bidirectional SCTP channel for low-latency messaging/files.
* **Output**: Both local and remote video windows render with a badge: `[Active Track: Video (H.264) + Audio (Opus)]`.

---

## 2. Mode 2: Pro Telemetry Lab (Advanced Mode)

For users who know the basics, this mode turns the interface into a dense diagnostic cockpit.

### Panel 1: NAT Traversal Topology Visualizer
* **Node Graph**:
  * `[Local Client]` ➔ `[Local NAT]` ➔ `[STUN / TURN Servers]` ➔ `[Remote NAT]` ➔ `[Remote Client]`
* **NAT Type Detection & Labels**:
  * Detects and highlights NAT behaviors (e.g., Full Cone vs Symmetric NAT).
* **Active Route Indicator**:
  * Draws an illuminated path between the selected candidate pair:
    * `host ↔ host`: Bright green direct line (LAN).
    * `srflx ↔ srflx`: Cyan dashed line passing through NAT hole-punch.
    * `relay ↔ relay`: Purple path routed through TURN.

### Panel 2: Live WebRTC RTP Metrics Engine
Pulls from `pc.getStats()` every 1 second and computes:
* **Bitrate (kbps / Mbps)**: Calculated via `delta(bytesReceived) * 8 / delta(time)`.
* **Packet Loss**: Computed via `packetsLost / (packetsReceived + packetsLost) * 100%`.
* **Round-Trip Time (RTT)**: Extracted from candidate-pair `currentRoundTripTime`.
* **Jitter (ms)**: Real-time delay variance from `inbound-rtp`.
* **Frames Per Second (FPS)** & Resolution (width × height).
* **Audio Level**: Dynamic meter reflecting speaker activity.

### Panel 3: Chaos & Simulation Deck (Connection Manipulator)
Allows developers to simulate real-world networking constraints:
* **Force Relay Policy**: Sets `iceTransportPolicy: "relay"` (disables P2P, forces TURN routing).
* **Candidate Type Filter**: Toggles to drop specific candidates during negotiation (e.g. drop `srflx` to test relay fallback).
* **Trigger ICE Restart**: Restarts ICE gathering without tearing down the call to inspect re-negotiation.
* **Simulate Packet Loss / Degradation**: Emulates high packet loss conditions or bandwidth throttling.

### Panel 4: P2P DataChannel File Sharing Demo
* **Demonstration of DataChannels (`RTCDataChannel`)**:
  * Chunking binary files (16KB - 64KB ArrayBuffer slices).
  * Backpressure handling using `bufferedAmount` and `bufferedamountlow` events.
  * Real-time transfer speed bar, ETA, chunk count, and SHA-256 integrity verification upon completion.

### Panel 5: Event Timeline & Signaling Stream
* Chronological feed of every state transition:
  * `signalingStateChange`: `have-local-offer`, `stable`
  * `iceGatheringState`: `gathering`, `complete`
  * `iceConnectionState`: `checking`, `connected`, `completed`
  * `connectionState`: `connected`, `failed`
