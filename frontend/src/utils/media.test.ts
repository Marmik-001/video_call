import { describe, it, expect } from "vitest";
import { createSyntheticMediaStream } from "./media.utils";

describe("createSyntheticMediaStream utility", () => {
  it("creates a synthetic MediaStream and stops cleanly", () => {
    // In vitest jsdom / node environment, verify it behaves properly or mocks canvas
    if (typeof document !== "undefined") {
      // Mock captureStream if not present in jsdom
      if (!HTMLCanvasElement.prototype.captureStream) {
        HTMLCanvasElement.prototype.captureStream = function () {
          return new MediaStream();
        };
      }
      const { stream, stop } = createSyntheticMediaStream(160, 120, "Test Feed");
      expect(stream).toBeDefined();
      expect(typeof stop).toBe("function");
      stop();
    }
  });
});
