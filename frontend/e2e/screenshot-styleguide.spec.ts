import { test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("capture styleguide screenshots at desktop and mobile viewports", async ({ page }) => {
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

  // 5. Beginner Lab with React Bits (Mobile)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(screenshotsDir, "beginner-lab-react-bits-mobile.png"),
    fullPage: false,
  });
});
