import { test, expect } from "@playwright/test";

test.describe("Perspective Switcher (Caller vs. Callee)", () => {
  test("toggles between Peer A (Caller) and Peer B (Callee) perspectives across steps", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("text=WebRTC Learning Lab")).toBeVisible();

    // Verify Perspective Switcher Toggle exists in header
    const toggle = page.getByTestId("perspective-toggle");
    await expect(toggle).toBeVisible();

    const btnA = page.getByTestId("perspective-btn-a");
    const btnB = page.getByTestId("perspective-btn-b");
    await expect(btnA).toBeVisible();
    await expect(btnB).toBeVisible();

    // Step 1: Default is Peer A (Caller)
    await expect(page.locator("text=The Matchmaker (Signaling)")).toBeVisible();
    await expect(page.locator("button:has-text('Send Ping')")).toBeVisible();

    // Switch to Peer B (Callee)
    await btnB.click();
    await expect(page.locator("text=The Waiting Receiver (Callee Signaling)")).toBeVisible();
    await expect(page.locator("button:has-text('Send Pong ACK')")).toBeVisible();

    // Trigger Peer B Pong ACK
    await page.locator("button:has-text('Send Pong ACK')").click();
    await expect(page.locator("text=Callee Pong Acknowledged")).toBeVisible({ timeout: 5000 });

    // Switch back to Peer A (Caller)
    await btnA.click();
    await expect(page.locator("text=The Matchmaker (Signaling)")).toBeVisible();

    // Navigate to Step 2
    await page.locator("header").getByRole("button", { name: "Next" }).click();
    await expect(page.locator("text=The Business Card (SDP Offer / Answer)")).toBeVisible();

    // Switch to Peer B in Step 2
    await btnB.click();
    await expect(page.locator("text=The Counter-Offer (Callee SDP Answer)")).toBeVisible();

    // Navigate to Step 4
    await page.locator("header").getByRole("button", { name: "Next" }).click(); // Step 3
    await page.locator("header").getByRole("button", { name: "Next" }).click(); // Step 4
    await expect(page.locator("text=The Remote Office Router (Peer B NAT)")).toBeVisible();
    await expect(page.locator("text=Private Subnet (B)")).toBeVisible();
    await expect(page.getByText("10.0.0.42:58210", { exact: true })).toBeVisible();

    // Trigger Peer B NAT packet
    await page.locator("button:has-text('Send Outbound Packet through Peer B NAT')").click();
    await expect(
      page.locator("text=Peer B NAT Pinhole Active (STUN Reflected)")
    ).toBeVisible({ timeout: 5000 });
  });
});
