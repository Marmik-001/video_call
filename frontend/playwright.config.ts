import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
    launchOptions: {
      args: [
        // Chromium WebRTC automation flags:
        // Automatically accept camera/mic permission prompts without showing modal dialog
        "--use-fake-ui-for-media-stream",
        // Feed synthetic color-bar video and sine-wave audio into getUserMedia
        "--use-fake-device-for-media-stream",
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5174",
    url: "http://localhost:5174",
    reuseExistingServer: true,
  },
});
