import { describe, it, expect, beforeEach, vi } from "vitest";
import { LoopbackService, type PeerConnectionFactory } from "./loopback.service";
import { useLabStore } from "@/store/labStore";

// Mock/Fake RTCPeerConnection for unit-testing state orchestration only.
// NOTE: This does NOT test real browser WebRTC or network drivers; real WebRTC is tested via Playwright.
class FakeRTCPeerConnection {
  public connectionState: RTCPeerConnectionState = "new";
  public currentLocalDescription: RTCSessionDescriptionInit | null = null;
  public currentRemoteDescription: RTCSessionDescriptionInit | null = null;
  public onicecandidate: ((e: RTCPeerConnectionIceEvent) => void) | null = null;
  public onconnectionstatechange: (() => void) | null = null;
  public ondatachannel: ((e: RTCDataChannelEvent) => void) | null = null;

  public createdDataChannels: string[] = [];
  public addedCandidates: RTCIceCandidateInit[] = [];
  public closed = false;

  createDataChannel(label: string) {
    this.createdDataChannels.push(label);
    return {
      readyState: "open",
      send: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    } as unknown as RTCDataChannel;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return { type: "offer", sdp: "v=0\r\no=Fake 1 1 IN IP4 127.0.0.1\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n" };
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return { type: "answer", sdp: "v=0\r\no=Fake 2 2 IN IP4 127.0.0.1\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n" };
  }

  async setLocalDescription(desc: RTCSessionDescriptionInit) {
    this.currentLocalDescription = desc;
  }

  async setRemoteDescription(desc: RTCSessionDescriptionInit) {
    this.currentRemoteDescription = desc;
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    this.addedCandidates.push(candidate);
  }

  close() {
    this.closed = true;
    this.connectionState = "closed";
  }
}

describe("LoopbackService Orchestration (Unit Test with Fake)", () => {
  let fakeA: FakeRTCPeerConnection;
  let fakeB: FakeRTCPeerConnection;
  let fakeFactory: PeerConnectionFactory;
  let service: LoopbackService;

  beforeEach(() => {
    useLabStore.getState().reset();
    fakeA = new FakeRTCPeerConnection();
    fakeB = new FakeRTCPeerConnection();
    let toggle = true;
    fakeFactory = () => {
      const pc = toggle ? fakeA : fakeB;
      toggle = !toggle;
      return pc as unknown as RTCPeerConnection;
    };
    service = new LoopbackService(fakeFactory);
  });

  it("creates a data channel on Peer A before creating offer", async () => {
    await service.startOfferFlow();
    expect(fakeA.createdDataChannels).toContain("lab-channel");
    expect(fakeA.currentLocalDescription).not.toBeNull();
    expect(fakeA.currentLocalDescription?.type).toBe("offer");
  });

  it("enqueues offer in simulated mailbox when paused until stepNext is called", async () => {
    useLabStore.getState().setIsPaused(true);
    await service.startOfferFlow();

    // Offer should be queued in mailbox
    const mailbox = useLabStore.getState().mailbox;
    expect(mailbox.length).toBe(1);
    expect(mailbox[0].type).toBe("offer");
    expect(fakeB.currentRemoteDescription).toBeNull();

    // Step forward
    const advanced = await service.stepNext();
    expect(advanced).toBe(true);
    expect(fakeB.currentRemoteDescription?.type).toBe("offer");
    expect(fakeB.currentLocalDescription?.type).toBe("answer");
  });

  it("buffers candidates that arrive before setRemoteDescription and flushes after", async () => {
    service.init();
    useLabStore.getState().setIsPaused(false);

    // Send a candidate to Peer B before Peer B has setRemoteDescription
    expect(fakeB.currentRemoteDescription).toBeNull();
    await service.deliverMessage({
      from: "A",
      to: "B",
      type: "candidate",
      payload: { candidate: "candidate:1 1 UDP 2122260223 192.168.1.10 50000 typ host", sdpMid: "0", sdpMLineIndex: 0 },
      summary: "Candidate for B",
    });

    // Peer B should not have added the candidate yet because remoteDescription was null
    expect(fakeB.addedCandidates.length).toBe(0);

    // Now deliver the offer so Peer B sets remote description and flushes buffer
    await service.deliverMessage({
      from: "A",
      to: "B",
      type: "offer",
      payload: { type: "offer", sdp: "dummy-offer" },
      summary: "Offer for B",
    });

    // Peer B should now have flushed the candidate
    expect(fakeB.currentRemoteDescription).not.toBeNull();
    expect(fakeB.addedCandidates.length).toBe(1);
  });

  it("caps store event buffer at 2000 events without infinite memory growth", () => {
    const store = useLabStore.getState();
    for (let i = 0; i < 2050; i++) {
      store.pushEvent({
        category: "STATS",
        summary: `Event #${i}`,
      });
    }
    const events = useLabStore.getState().events;
    expect(events.length).toBe(2000);
    // Oldest 50 events dropped: first event should be #50
    expect(events[0].summary).toBe("Event #50");
    expect(events[1999].summary).toBe("Event #2049");
  });

  it("cleans up peers and queues on reset", () => {
    service.init();
    useLabStore.getState().enqueueMailbox({
      from: "A",
      to: "B",
      type: "offer",
      payload: { type: "offer", sdp: "test" },
      summary: "test",
    });

    service.reset();
    expect(fakeA.closed).toBe(true);
    expect(fakeB.closed).toBe(true);
    expect(service.peerA).toBeNull();
    expect(service.peerB).toBeNull();
    expect(useLabStore.getState().mailbox.length).toBe(0);
  });
});
