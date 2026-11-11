import { test, expect } from "@playwright/test";

test.describe("WebRTC Pro Mode: Network Chaos & ICE Simulator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pro");
    // Ensure Pro Simulator is rendered
    await expect(page.getByText("WebRTC Pro Simulator")).toBeVisible();
  });

  test("renders 1-viewport bento layout without outer scrollbars", async ({ page }) => {
    // Assert 1-viewport grid and key headers
    await expect(page.getByText("Network Chaos & ICE Benchmarking")).toBeVisible();
    await expect(page.getByText("Firewall & Network Chaos", { exact: false })).toBeVisible();
    await expect(page.getByText("Live Routing Radar", { exact: false })).toBeVisible();

    // Verify outer body doesn't trigger scroll
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 10);
  });

  test("dynamically recalculates routes when blocking candidate types", async ({ page }) => {
    // 1. Initial state: Direct LAN route active
    await expect(page.locator('[data-testid="metric-route-type"]')).toHaveText("Direct LAN");

    // 2. Block Host Candidates
    await page.locator('[data-testid="toggle-block-host"]').click();
    // Route switches to Direct P2P (STUN)
    await expect(page.locator('[data-testid="metric-route-type"]')).toHaveText("Direct P2P (STUN)");

    // 3. Block STUN (srflx) Candidates
    await page.locator('[data-testid="toggle-block-srflx"]').click();
    // Route falls back to TURN Relay
    await expect(page.locator('[data-testid="metric-route-type"]')).toHaveText("TURN Relay");

    // 4. Block Relay Candidates
    await page.locator('[data-testid="toggle-block-relay"]').click();
    // Blackout / ICE Connection Failed
    await expect(page.locator('[data-testid="metric-route-type"]')).toHaveText("ICE Connection Failed");
    await expect(page.getByText("Verdict: BLACKOUT", { exact: false })).toBeVisible();
  });

  test("detects Symmetric-to-Symmetric NAT collision and forces TURN fallback", async ({ page }) => {
    // Apply STUN preset first (Host blocked, STUN allowed)
    await page.locator('[data-testid="preset-stun"]').click();
    await expect(page.locator('[data-testid="metric-route-type"]')).toHaveText("Direct P2P (STUN)");

    // Set Peer A to Symmetric NAT
    await page.locator('[data-testid="select-nat-a"]').selectOption("Symmetric");
    // Set Peer B to Symmetric NAT
    await page.locator('[data-testid="select-nat-b"]').selectOption("Symmetric");

    // Verify Symmetric Collision Alert & TURN fallback
    await expect(page.getByText("Symmetric NAT Collision", { exact: false })).toBeVisible();
    await expect(page.locator('[data-testid="metric-route-type"]')).toHaveText("TURN Relay");
  });

  test("toggles bottom tabs (Telemetry, Elimination Matrix, RFC 8445 Diagnosis)", async ({ page }) => {
    // Tab 1: Telemetry Spectrum (active by default)
    await expect(page.getByText("Comparative Route Latency Spectrum", { exact: false })).toBeVisible();

    // Tab 2: Candidate Pair Elimination Matrix
    await page.locator('[data-testid="pro-tab-matrix"]').click();
    await expect(page.getByText("Tested Candidate Pair", { exact: false })).toBeVisible();

    // Tab 3: RFC 8445 Diagnosis
    await page.locator('[data-testid="pro-tab-diagnosis"]').click();
    await expect(page.getByText("ICE Engine Diagnostic Summary", { exact: false })).toBeVisible();
  });

  test("executes interactive ICE Handshake probe with CallChip feedback", async ({ page }) => {
    const simulateBtn = page.locator('[data-testid="btn-run-simulation"]');
    await expect(simulateBtn).toBeVisible();
    await simulateBtn.click();

    // Assert the specific button state while probing or right after
    await expect(simulateBtn).toBeVisible();
    await expect(page.getByTestId("pro-radar-verdict")).toBeVisible();
  });

  test("navigates back to Beginner Lab and back to Pro Mode seamlessly", async ({ page }) => {
    // Click "Beginner Lab" button in Pro header
    await page.locator('[data-testid="btn-back-to-beginner"]').click();
    await expect(page.getByText("WebRTC Learning Lab")).toBeVisible();

    // Click "Pro Mode" button in Beginner Lab header
    await page.locator('[data-testid="btn-launch-pro"]').click();
    await expect(page.getByText("WebRTC Pro Simulator")).toBeVisible();
  });

  test("switches to Live WebRTC Wire mode, connects real dual peers, and displays live video & stats", async ({
    page,
  }) => {
    // Switch to Live Wire mode
    await page.locator('[data-testid="mode-btn-live"]').click();
    await expect(page.getByText("Dual Concurrent Peers • Real WebRTC Loopback")).toBeVisible();

    // Verify video viewports exist
    await expect(page.locator('[data-testid="live-video-a"]')).toBeVisible();
    await expect(page.locator('[data-testid="live-video-b"]')).toBeVisible();

    // Connect Dual Peers in browser
    await page.locator('[data-testid="btn-toggle-live-wire"]').click();
    await expect(page.getByText(/Live: HOST|Live: SRFLX|Live: Negotiating/)).toBeVisible();

    // Toggle fireboard tab
    await page.locator('[data-testid="pro-tab-matrix"]').click();
    await expect(page.getByText("Candidate Fireboard")).toBeVisible();

    // Hang up
    await page.locator('[data-testid="btn-toggle-live-wire"]').click();
    await expect(page.locator('[data-testid="metric-route-type"]')).toHaveText("Live Wire Standby");
  });
});
