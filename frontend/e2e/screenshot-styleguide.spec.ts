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
  await page.waitForSelector("text=WebRTC Lab Styleguide & Design Standard");

  // Take desktop screenshot (full page to see tokens, components, and Step 2 demo)
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

  // 2. Mobile 390x844
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/styleguide");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("text=WebRTC Lab Styleguide & Design Standard");

  await page.screenshot({
    path: path.join(screenshotsDir, "styleguide-390.png"),
    fullPage: false,
  });
});
