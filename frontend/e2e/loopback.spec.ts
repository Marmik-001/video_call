import { test, expect } from "@playwright/test";

test.describe("Real WebRTC Loopback E2E in Chromium", () => {
  test("connects two real RTCPeerConnections, exchanges messages over RTCDataChannel, and verifies reset", async ({
    page,
  }) => {
    // 1. Load app
    await page.goto("/");
    await expect(page.locator("text=WebRTC Learning Lab")).toBeVisible();

    // Verify initial states
    await expect(page.getByTestId("peer-a-state")).toHaveText("new");
    await expect(page.getByTestId("peer-b-state")).toHaveText("new");

    // 2. Unpause real-time delivery to let real WebRTC candidates flow freely
    await page.getByTestId("btn-pause-toggle").click();
    await expect(page.getByTestId("btn-pause-toggle")).toContainText("Real-Time Delivery");

    // 3. Initiate offer flow
    await page.getByTestId("btn-start-offer").click();

    // 4. Wait for both peers to reach "connected" state in real Chromium
    await expect(page.getByTestId("peer-a-state")).toHaveText("connected", { timeout: 15000 });
    await expect(page.getByTestId("peer-b-state")).toHaveText("connected", { timeout: 15000 });

    // 5. Send data channel message from Peer A to Peer B
    await page.getByTestId("input-msg-a").fill("Hello from Peer A real WebRTC");
    await page.getByTestId("btn-send-a").click();

    // Verify message arrives on Peer B via RTCDataChannel
    await expect(page.getByTestId("dc-log")).toContainText("Hello from Peer A real WebRTC", {
      timeout: 5000,
    });

    // 6. Send data channel message from Peer B to Peer A
    await page.getByTestId("input-msg-b").fill("Hello back from Peer B");
    await page.getByTestId("btn-send-b").click();

    await expect(page.getByTestId("dc-log")).toContainText("Hello back from Peer B", {
      timeout: 5000,
    });

    // 7. Verify reset() closes both real RTCPeerConnections
    await page.getByTestId("btn-reset").click();

    // Assert using page.evaluate directly on the underlying RTCPeerConnection objects
    const states = await page.evaluate(() => {
      const s = (window as unknown as { __LOOPBACK_SERVICE__?: { peerA: RTCPeerConnection | null; peerB: RTCPeerConnection | null } })
        .__LOOPBACK_SERVICE__;
      return {
        hasPeerA: !!s?.peerA,
        hasPeerB: !!s?.peerB,
      };
    });

    expect(states.hasPeerA).toBe(false);
    expect(states.hasPeerB).toBe(false);
    await expect(page.getByTestId("peer-a-state")).toHaveText("new");
    await expect(page.getByTestId("peer-b-state")).toHaveText("new");
  });
});
