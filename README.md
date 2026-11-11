# WebRTC Learning Platform & Interactive Simulator

> A comprehensive, interactive WebRTC learning platform featuring an interactive 6-step walkthrough (Beginner Lab) with Caller/Callee perspective switching, and a Network Chaos & ICE Simulator (Pro Mode) with real browser loopback and live `getStats()` telemetry.

- **Live URL**: [https://webrtc-lab-e1q.pages.dev](https://webrtc-lab-e1q.pages.dev)
- **Deployment Platform**: Cloudflare Pages (100% Client-Side & Serverless)

---

## Features

### 1. Beginner Lab: 6-Step Interactive WebRTC Walkthrough
1. **The Matchmaker (Signaling)**: WebSocket rendezvous server, room broker (`#mesh-402`), and ping/pong latency checks.
2. **The Business Card (SDP Offer / Answer)**: RFC 8866 decoded inspector, field breakdown (`v=`, `o=`, `m=`, `a=`), and SDP diffing.
3. **Finding the Path (ICE Candidates)**: RFC 8445 Candidate types (`host`, `srflx`, `relay`), candidate anatomy parser, and pairing matrix.
4. **Outbound Translation (NAT Router)**: STUN reflection, NAT translation table, and pinhole lifetime simulator.
5. **Media SRTP & Constraints**: Audio/video track bindings, resolution/frame-rate constraints, and hardware camera / synthetic 30FPS stream rendering.
6. **Data Channels, SCTP & Real-Time Telemetry**: Bidirectional chat terminal, SCTP stack layers (PPID, Stream ID, reliability flags), live polling `getStats()`, and hardware release ("End Call").
- **Perspective Switcher**: Instant role toggle between **Peer A (Caller)** and **Peer B (Callee)** across all 6 steps.

### 2. Pro Mode: Network Chaos & ICE Simulator (`/pro`)
- **Dual Engine**:
  - **Simulation Matrix**: Theoretical RFC 8445 mathematical model, full latency spectrums, and network impairment sliders.
  - **Live WebRTC Wire**: Spins up two real concurrent `RTCPeerConnection` instances in the browser with live camera hardware sharing.
- **Candidate Firewall Interceptor**: Real-time filtering and dropping of `host`, `srflx`, and `relay` candidates.
- **NAT Topology Matrix**: Full Cone, Restricted Cone, Port Restricted, and Symmetric NAT simulation with Symmetric Collision detection and NAT Hairpinning failure diagnosis.
- **Live `getStats()` Telemetry**: Real nominated candidate pair, round-trip time (RTT in ms), bitrate (kbps), video FPS, and packet loss.

---

## Local Development

```bash
# Install dependencies
npm --prefix frontend install

# Start Vite dev server
npm --prefix frontend run dev

# Run unit tests (Vitest)
npm --prefix frontend test

# Run E2E tests (Playwright)
npm --prefix frontend run test:e2e
```

---

## Deployment to Cloudflare Pages

To deploy updates manually:

```bash
# From repository root:
npm --prefix frontend run deploy:pages

# Or from inside frontend/:
cd frontend && npm run deploy:pages
```
