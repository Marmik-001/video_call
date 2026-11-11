import { test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("capture styleguide screenshots at desktop and mobile viewports", async ({ page }) => {
  test.setTimeout(120000);
  const screenshotsDir = path.resolve(__dirname, "../../docs/screenshots");

  // 1. Desktop 1280x900
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/styleguide");
  await page.waitForLoadState("networkidle");

  // Wait for the styleguide heading
  await page.waitForSelector("text=WebRTC Lab");

  // Take desktop screenshot
  await page.screenshot({
    path: path.join(screenshotsDir, "styleguide-1280.png"),
    fullPage: false,
  });

  // Also capture the Step 2 demo section in full detail
  const step2Element = page.locator("#step-demo");
  if (await step2Element.isVisible()) {
    await step2Element.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(screenshotsDir, "styleguide-1280-step2.png"),
      fullPage: false,
    });
  }

  // Also capture the Pro sample card
  const proCardElement = page.locator("#pro-card");
  if (await proCardElement.isVisible()) {
    await proCardElement.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(screenshotsDir, "styleguide-1280-pro.png"),
      fullPage: false,
    });
  }

  // 2. Mobile 390x844
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/styleguide");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("text=WebRTC Lab");

  await page.screenshot({
    path: path.join(screenshotsDir, "styleguide-390.png"),
    fullPage: false,
  });

  // 3. Beginner Lab with React Bits (Desktop) - Step 1 Initial
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("text=WebRTC Learning Lab");
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-react-bits-desktop.png"),
    fullPage: false,
  });

  // Step 1 Active - Click Connect and Dispatch Ping to capture rich live frames
  await page.getByTestId("btn-start-offer").click();
  await page.locator("button:has-text('Send Ping')").click();
  await page.waitForTimeout(1200);

  // Ensure all containers are reset to top 0
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollTop) el.scrollTop = 0;
    });
  });

  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step1-active.png"),
    fullPage: false,
  });

  // 4. Step 2 SDP Offer / Answer Bento Inspector
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("header").getByRole("button", { name: "Next" }).click();
  await page.waitForSelector("text=The Business Card (SDP Offer / Answer)");
  await page.waitForTimeout(500);

  // Capture Step 2 Initial
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step2-initial.png"),
    fullPage: false,
  });

  // Trigger SDP Offer generation
  await page.getByTestId("btn-start-offer").click();
  await page.waitForTimeout(1000);

  // Capture Step 2 Active with Decoded Highlights
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step2-active-decoded.png"),
    fullPage: false,
  });

  // Switch to Offer vs Answer Diff
  await page.locator("button:has-text('Offer vs Answer')").click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step2-active-diff.png"),
    fullPage: false,
  });

  // Switch to Raw SDP Document
  await page.locator("button:has-text('Raw SDP')").click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step2-active-raw.png"),
    fullPage: false,
  });

  // 5. Step 3 ICE Candidates Pathfinder Bento
  await page.locator("header").getByRole("button", { name: "Next" }).click();
  await page.waitForSelector("text=Finding the Path (ICE Candidates)");
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollTop) el.scrollTop = 0;
      if (el.scrollLeft) el.scrollLeft = 0;
    });
  });

  // Capture Step 3 Active: Decoded Candidates
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step3-active-candidates.png"),
    fullPage: false,
  });

  // Switch to Pair Check Matrix
  await page.locator("button:has-text('Pair Check Matrix')").click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step3-active-pairs.png"),
    fullPage: false,
  });

  // Switch to SDP Line Anatomy
  await page.locator("button:has-text('SDP Line Anatomy')").click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step3-active-anatomy.png"),
    fullPage: false,
  });

  // 6. Step 4 NAT & STUN Packet Rewriter Bento
  await page.locator("header").getByRole("button", { name: "Next" }).click();
  await page.waitForSelector("text=The Apartment Front Desk (NAT Basics)");
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollTop) el.scrollTop = 0;
      if (el.scrollLeft) el.scrollLeft = 0;
    });
  });

  // Trigger outbound packet through NAT to activate pinhole
  await page.locator("button:has-text('Send Outbound Packet through NAT')").click();
  await page.waitForTimeout(1100);

  // Capture Step 4 Active: Live Mapping Table
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step4-active-table.png"),
    fullPage: false,
  });

  // Switch to 4 NAT Types
  await page.locator("button:has-text('4 NAT Types')").click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step4-active-types.png"),
    fullPage: false,
  });

  // Switch to STUN Packet X-Ray
  await page.locator("button:has-text('STUN Packet X-Ray')").click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step4-active-stun.png"),
    fullPage: false,
  });

  // 7. Step 5 Media Streams & Tracks Bento
  await page.locator("header").getByRole("button", { name: "Next" }).click();
  await page.waitForSelector("text=Hooking up the Cameras (Media Streams & Tracks)");
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollTop) el.scrollTop = 0;
      if (el.scrollLeft) el.scrollLeft = 0;
    });
  });

  // Request synthetic/camera media feed
  await page.locator("button:has-text('Request Camera / Synthetic Feed')").click();
  await page.waitForSelector("text=Feed Active", { timeout: 5000 });
  await page.waitForTimeout(800);

  // Capture Step 5 Active: Live Track Telemetry
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step5-active-tracks.png"),
    fullPage: false,
  });

  // Switch to Constraints Playground
  await page.locator("button:has-text('Constraints Playground')").click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step5-active-constraints.png"),
    fullPage: false,
  });

  // Switch to W3C State Machine
  await page.locator("button:has-text('W3C State Machine')").click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-step5-active-states.png"),
    fullPage: false,
  });

  // 8. Beginner Lab with React Bits (Mobile)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-react-bits-mobile.png"),
    fullPage: false,
  });
});
