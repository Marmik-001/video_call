import { describe, it, expect, afterEach } from "vitest";
import { getSignalingUrl, parseWebSocketResponse } from "./utils/websocket.utils";

describe("getSignalingUrl helper", () => {
  const originalEnv = import.meta.env.VITE_SIGNALING_URL;

  afterEach(() => {
    if (originalEnv) {
      import.meta.env.VITE_SIGNALING_URL = originalEnv;
    } else {
      delete import.meta.env.VITE_SIGNALING_URL;
    }
  });

  it("derives ws:// URL on insecure context", () => {
    delete import.meta.env.VITE_SIGNALING_URL;
    const url = getSignalingUrl();
    expect(url.startsWith("ws://") || url.startsWith("wss://")).toBe(true);
  });

  it("parses valid JSON WebSocket message", () => {
    const raw = JSON.stringify({ type: "TEST_MSG", payload: { hello: "world" } });
    const res = parseWebSocketResponse(raw);
    expect(res).not.toBeInstanceOf(Error);
    if (!(res instanceof Error)) {
      expect(res.type).toBe("TEST_MSG");
    }
  });

  it("handles malformed JSON gracefully", () => {
    const res = parseWebSocketResponse("invalid-json{");
    expect(res).toBeInstanceOf(Error);
  });
});
