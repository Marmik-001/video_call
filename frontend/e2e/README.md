# E2E WebRTC Testing with Playwright

This directory contains real end-to-end tests executing in headless Chromium to verify genuine browser WebRTC peer connections.

## Chromium WebRTC Flags Used in `playwright.config.ts`

To test WebRTC automatically in headless CI and developer environments without physical webcam/microphone hardware or GUI permission prompts, the following Chromium flags are specified:

1. **`--use-fake-ui-for-media-stream`**:
   - **Why**: Bypasses the browser modal dialog ("localhost wants to use your camera/microphone") by automatically granting permission. Without this, headless test runners stall on OS dialogs.
2. **`--use-fake-device-for-media-stream`**:
   - **Why**: Generates a synthetic moving color-bar video feed and a test audio tone instead of querying physical webcam/mic hardware. This ensures consistent media pipeline execution on servers and headless runners.

## Running Tests

```bash
npm --prefix frontend run test:e2e
```
