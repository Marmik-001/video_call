# Manual Testing & Verification Guide

This document provides step-by-step instructions for running and manually testing the WebRTC Learning Lab.

---

## 1. How to Start the App

### Start the Frontend Dev Server:
```bash
npm --prefix frontend run dev
```
Open **`http://localhost:5173/`** (or the port Vite outputs, e.g. `5174`) in any modern browser.

*(Optional)* If you wish to test the backend WebSocket signaling server:
```bash
npm --prefix backend run dev
```

---

## 2. Beginner Mode: Steps 1–3 Manual Click-Through Checklist

Follow these steps to manually verify the educational loopback experience:

1. **Initial State (Step 1)**:
   - [ ] Confirm the header shows **"Step 1 of 3: The Matchmaker (Signaling)"**.
   - [ ] Confirm the **`[SIMULATION: In-Memory Mailbox]`** badge is clearly visible.
   - [ ] Confirm Peer A and Peer B connection states both display **`new`**.
   - [ ] Confirm the `< Back` button is disabled, and the progress bar is at 33%.
   - [ ] Read the "What Just Happened?" card at the bottom explaining signaling.

2. **Offer Generation & Mailbox Gating**:
   - [ ] Ensure **`⏸️ Paused (Mailbox Gating)`** is active (default).
   - [ ] Click **`1. Create Offer & Data Channel`**.
   - [ ] Notice an animated packet message and confirm `#1 OFFER Peer A ➔ Peer B` appears in the Signaling Channel mailbox list.
   - [ ] Notice Peer B has **not** received it yet because mailbox gating is paused.

3. **Stepping the Offer (Step 2)**:
   - [ ] Click **`Step Single Message (1) →`**.
   - [ ] The offer is delivered to Peer B: Peer B creates an answer and queues `#1 ANSWER Peer B ➔ Peer A` into the mailbox.
   - [ ] Click **`Next Step →`** in the header to advance to Step 2.
   - [ ] On Step 2, click **"Show raw SDP offer"** and **"Show raw SDP answer"** to inspect the real text SDP payload.
   - [ ] Verify the "What Just Happened?" card includes:
     > *"Candidates are gathered after setLocalDescription, and only for a media section or data channel in the offer. This lab adds a data channel before creating the offer so there is something to connect."*

4. **ICE Candidate Trickling & Connection (Step 3)**:
   - [ ] Click **`Next Step →`** in the header to advance to Step 3 ("Finding the Path").
   - [ ] Toggle to **`▶️ Real-Time Delivery`** (or step the remaining candidate messages).
   - [ ] Watch Peer A and Peer B connection states transition from `connecting` ➔ **`connected`**!
   - [ ] Inspect the **Gathered ICE Candidates** matrix:
     - Notice badges for `host`, `srflx`, and `relay`.
     - If your browser masks private IPs, observe the `ℹ️ mDNS Privacy (RFC 8837)` note.

5. **Bidirectional Data Channel Messaging**:
   - [ ] In Peer A's panel, type `"Hello from Peer A"` and click **`Send`**.
   - [ ] In the middle Data Channel Log, verify: `Peer A: Hello from Peer A`.
   - [ ] In Peer B's panel, type `"Hello back from Peer B"` and click **`Send`**.
   - [ ] In the middle Data Channel Log, verify: `Peer B: Hello back from Peer B`.

6. **Reset Verification**:
   - [ ] Click **`Reset Lab`**.
   - [ ] Verify Peer A and Peer B connection states reset to **`new`**, the mailbox empties, and data channel messages are cleared.

---

## 3. Automated Test Commands

### Run Vitest Unit Tests (Orchestration & Ring Buffer):
```bash
npm --prefix frontend run test
```

### Run Playwright E2E Tests (Real WebRTC Loopback in Chromium):
```bash
npm --prefix frontend run test:e2e
```
*(Chromium flags `--use-fake-ui-for-media-stream` and `--use-fake-device-for-media-stream` are configured in `playwright.config.ts` to grant fake camera/mic and avoid OS permission dialogs.)*
