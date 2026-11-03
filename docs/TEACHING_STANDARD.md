# WebRTC Learning Lab — Teaching Standard & Pedagogical Architecture

## 1. Core Philosophy

WebRTC is often taught backwards: learners are thrown into multi-thousand-line SDP blobs, trickle ICE state machines, and NAT terminology before they understand the fundamental problem being solved.

**Our Rule:** We teach conceptually first, visually second, and reveal raw protocol data only when the learner asks.

---

## 2. The 6-Part Anatomy of Every Beginner Step

Every beginner lesson screen must strictly follow this sequential structure:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. THE HUMAN QUESTION ("How do two browsers talk without a server?")   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. THE ONE-SENTENCE ANALOGY (Relatable mental model)                   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. THE INTERACTIVE DIAGRAM (Action-triggered, never autoplaying)       │
├────────────────────────────────────────────────────────────────────────┤
│ 4. "WHAT JUST HAPPENED?" (Plain words, max 2 sentences)                │
├────────────────────────────────────────────────────────────────────────┤
│ 5. "SHOW REAL DATA" (Progressive disclosure: raw SDP/ICE code blocks)  │
├────────────────────────────────────────────────────────────────────────┤
│ 6. "CHECK YOURSELF" (Quick recall challenge with immediate feedback)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Check Yourself Quiz Gating Decision: **Soft-Gated with Instant Feedback**
* **Why**: Strict blocking creates dead ends for self-paced adult learners.
* **Mechanism**: The learner selects an option and gets instant visual feedback (green check or gentle red hint). If stuck, an *"Explain & Continue"* button immediately unlocks the next step. Active recall is rewarded without ever trapping the user.

---

## 3. The Core Analogies Glossary

Consistency across all screens is mandatory. Use only these approved analogies:

| Technical Concept | Canonical Analogy |
| :--- | :--- |
| **Signaling** | Two friends passing their phone numbers through a mutual acquaintance. |
| **SDP (Session Description Protocol)** | Exchanging business cards that list your languages, capabilities, and formats. |
| **ICE Candidate** | A slip of paper with a possible address (Wi-Fi IP, cellular IP, or forwarding office) where you might be reachable. |
| **NAT (Network Address Translation)** | An apartment building front desk that re-labels mail because individual rooms don't have public street addresses. |
| **STUN Server** | Looking in an outside mirror (or calling a friend) to ask: *"What public address and phone number do you see on caller ID when I call you?"* |
| **TURN Server** | A paid package-forwarding post office that accepts mail and physically hand-delivers it when direct delivery is blocked by a strict building lobby. |
| **Data Channel** | A dedicated two-way pneumatic message tube running directly between two rooms. |

---

## 4. Grounding & Verification Sources

All technical statements must be grounded in primary specifications. Never present simulated behavior as real networking without labeling.

* **API Behavior**: [MDN WebRTC API Specification](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
* **Protocol & Architecture**: [*WebRTC for the Curious*](https://webrtcforthecurious.com/) (RFC 8829, RFC 8445, RFC 5389, RFC 5766)

---

## 5. Screen-by-Screen Specification

---

### Step 1: The Matchmaker (Signaling)

* **1. Question**: *"If WebRTC is peer-to-peer, why do we need a server at all to get started?"*
* **2. Analogy**: *"You can have a private phone call with anyone in the world, but you first need a mutual friend to give you each other's phone number."*
* **3. Live Demo**: A button **"Drop Address in Mailbox"**. Clicking it shows an address envelope moving into the in-memory mailbox.
* **4. What Just Happened?**: *"Peer A and Peer B can't connect directly until they know how to address each other. The signaling server is simply a messenger that passes their initial contact notes."*
* **5. Show Real Data**: Collapsed panel showing the WebSocket JSON packet:
  ```json
  { "type": "USER_ONLINE", "from": "peer-alice" }
  ```
* **6. Check Yourself**:
  * *Question*: *"Does audio or video ever flow through the signaling server?"*
  * *Options*: 
    * [ ] A) Yes, all media flows through the signaling server.
    * [x] B) No, the signaling server only exchanges setup notes; media flows peer-to-peer.
    * [ ] C) Yes, but only audio.
* **Comprehension Criteria**:
  * Can explain why a server is required before a P2P connection can begin.
  * Can identify that signaling transport is completely independent of WebRTC itself.
* **Verification Source**: [*WebRTC for the Curious — Chapter 2: Signaling*](https://webrtcforthecurious.com/docs/02-signaling/)

---

### Step 2: The Business Card (SDP Offer / Answer)

* **1. Question**: *"How do two browsers agree on video quality and audio formats before sending media?"*
* **2. Analogy**: *"Before starting a business deal, two people exchange business cards detailing what languages they speak and what contracts they accept."*
* **3. Live Demo**: Button **"Generate Offer & Add Data Channel"**. Triggers local description creation and sends the SDP offer to the mailbox. Button **"Accept & Create Answer"** triggers Peer B's reply.
* **4. What Just Happened?**: *"Peer A listed its supported video formats and media channels in an SDP text document. Peer B reviewed it, matched compatible formats, and sent back its agreement (the Answer)."*
* **5. Show Real Data**: Expandable `<details>` view displaying real formatted SDP lines (`v=0`, `o=...`, `m=application...`, `a=mid:0`).
* **6. Check Yourself**:
  * *Question*: *"What happens if Peer A only supports VP8 video, but Peer B only supports H.264?"*
  * *Options*:
    * [ ] A) The browsers will automatically invent a new video codec.
    * [x] B) Negotiation fails because there is no common codec listed on both business cards.
    * [ ] C) The video stream converts to text automatically.
* **Comprehension Criteria**:
  * Can explain what SDP stands for (Session Description Protocol) and its role.
  * Can explain why creating a Data Channel or Media Track is required *before* `createOffer` so that an `m=` line exists.
* **Verification Source**: [MDN `RTCPeerConnection.createOffer`](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer) & [RFC 8829 (JSEP)](https://www.rfc-editor.org/rfc/rfc8829)

---

### Step 3: Finding the Path (ICE Candidates)

* **1. Question**: *"How do browsers find the actual network route to reach each other through home Wi-Fi and mobile networks?"*
* **2. Analogy**: *"Imagine writing down every possible address where someone might reach you: your home Wi-Fi address, your public street address, and an office mailbox."*
* **3. Live Demo**: Button **"Gather Candidates"**. Cards appear as candidates trickle in, tagged with `host`, `srflx`, or `relay`.
* **4. What Just Happened?**: *"Both browsers probed their local network and queried outside servers to collect a list of potential connection paths called ICE candidates. They test these pairs until finding the fastest working route."*
* **5. Show Real Data**: Real candidate string breakdown:
  ```text
  candidate:1 1 UDP 2122260223 192.168.1.15 54231 typ host
  ```
  Highlighting foundation, protocol (UDP), IP scope (LAN), port, and candidate type (`host`). If ending in `.local`, displays the mDNS RFC 8837 privacy badge.
* **6. Check Yourself**:
  * *Question*: *"Which ICE candidate type represents your computer's private IP on your local Wi-Fi router?"*
  * *Options*:
    * [x] A) `host`
    * [ ] B) `srflx`
    * [ ] C) `relay`
* **Comprehension Criteria**:
  * Can define `host` (local IP), `srflx` (STUN-discovered public IP), and `relay` (TURN fallback).
  * Can explain why Chrome masks local IPs behind `.local` mDNS names for privacy.
* **Verification Source**: [*WebRTC for the Curious — Chapter 3: Connecting*](https://webrtcforthecurious.com/docs/03-connecting/) & [RFC 8445 (ICE)](https://www.rfc-editor.org/rfc/rfc8445)

---

### Step 4: The Apartment Front Desk (NAT Basics)

* **1. Question**: *"Why can't another computer on the internet simply connect directly to my private home IP (192.168.x.x)?"*
* **2. Analogy**: *"Your home router is like an apartment building front desk: all residents share one street address, and outside visitors can't walk directly into Apartment 4B without the front desk opening a path."*
* **3. Live Demo**: Scripted SVG diagram labeled `[ILLUSTRATION: Educational Animation]`. Shows a packet hitting the router NAT table, being mapped to an external port, and opening a pinhole for return traffic.
* **4. What Just Happened?**: *"Your Wi-Fi router performs NAT (Network Address Translation). It rewrites your private packet header so it appears on the internet with the router's public IP and a temporary port."*
* **5. Show Real Data**: Visual mapping table:
  `Internal [192.168.1.10:5000] ➔ Router NAT Table ➔ External [103.21.x.x:49152]`
* **6. Check Yourself**:
  * *Question*: *"What is the main role of a STUN server during NAT traversal?"*
  * *Options*:
    * [ ] A) It compresses the video so it fits through narrow wires.
    * [x] B) It acts like a mirror, telling your browser what public IP and port your router assigned to you.
    * [ ] C) It encrypts your passwords.
* **Comprehension Criteria**:
  * Can explain why private IPv4 addresses are non-routable on the public internet.
  * Understands the concept of NAT hole-punching (pinholing).
* **Verification Source**: [*WebRTC for the Curious — Chapter 3: STUN and NATs*](https://webrtcforthecurious.com/docs/03-connecting/#nat-mapping)

---

### Step 5: Hooking up the Cameras (Media Streams & Tracks)

* **1. Question**: *"How does raw video from a webcam get converted into packets and transferred over the connection?"*
* **2. Analogy**: *"Think of a media stream as an audio/video cable with multiple color-coded wires (tracks): one wire for microphone audio and one for camera video."*
* **3. Live Demo**: Button **"Request Camera / Synthetic Feed"**. Mounts two video elements. If camera access is denied, automatically injects an animated synthetic canvas video feed.
* **4. What Just Happened?**: *"The browser captured media tracks via `getUserMedia`, encoded them into encrypted SRTP packets, and piped them directly through the negotiated P2P route."*
* **5. Show Real Data**: Track inspector card:
  `Track 0: kind="video", codec="VP8/H264", enabled=true, readyState="live"`
* **6. Check Yourself**:
  * *Question*: *"If a learner denies camera access on their laptop, can WebRTC still test video transmission?"*
  * *Options*:
    * [ ] A) No, WebRTC crashes if no physical webcam is plugged in.
    * [x] B) Yes, any canvas animation or synthetic stream can be captured as a real MediaStream using `canvas.captureStream()`.
    * [ ] C) Only if they use Firefox.
* **Comprehension Criteria**:
  * Understands the difference between a `MediaStream` and individual `MediaStreamTrack`s.
  * Can explain why synthetic canvas streams are ideal for zero-permission sandboxes.
* **Verification Source**: [MDN `MediaStreamTrack`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack) & [MDN `HTMLCanvasElement.captureStream()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream)

---

### Step 6: The Direct Wire (Data Channels)

* **1. Question**: *"Can WebRTC send arbitrary data like chat, game positions, or files without using audio/video?"*
* **2. Analogy**: *"A Data Channel is a private pneumatic dispatch tube running directly between two peers for instant letter delivery."*
* **3. Live Demo**: Interactive text input box. Typing a message and clicking **"Send"** delivers the message over `RTCDataChannel` in real time with a latency readout.
* **4. What Just Happened?**: *"Unlike WebSockets which route every message through a central server, WebRTC Data Channels use SCTP running over DTLS to send packets directly between the two browsers with sub-millisecond local latency."*
* **5. Show Real Data**: Channel parameters card:
  `ordered: true, maxRetransmits: null, protocol: "sctp", readyState: "open"`
* **6. Check Yourself**:
  * *Question*: *"What protocol powers WebRTC DataChannels under the hood?"*
  * *Options*:
    * [ ] A) Plain HTTP/1.1
    * [x] B) SCTP over DTLS
    * [ ] C) FTP
* **Comprehension Criteria**:
  * Can describe why DataChannels provide lower latency than server-relayed WebSockets.
  * Understands that DataChannels can be configured as reliable (TCP-like) or unreliable/unordered (UDP-like).
* **Verification Source**: [*WebRTC for the Curious — Chapter 5: Data Channels*](https://webrtcforthecurious.com/docs/05-data-channels/)
