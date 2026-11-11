import { describe, it, expect, beforeEach } from "vitest";
import { ProLiveService } from "./proLive.service";

describe("ProLiveService", () => {
  let service: ProLiveService;

  beforeEach(() => {
    service = new ProLiveService();
  });

  it("initializes with default policy permitting all candidates", () => {
    expect(service.policy.blockHost).toBe(false);
    expect(service.policy.blockSrflx).toBe(false);
    expect(service.policy.blockRelay).toBe(false);
  });

  it("updates policy correctly", () => {
    service.updatePolicy({ blockHost: true, blockSrflx: false, blockRelay: true });
    expect(service.policy.blockHost).toBe(true);
    expect(service.policy.blockSrflx).toBe(false);
    expect(service.policy.blockRelay).toBe(true);
  });

  it("stops and cleans up resources cleanly", () => {
    service.stop();
    expect(service.peerA).toBeNull();
    expect(service.peerB).toBeNull();
    expect(service.remoteStream).toBeNull();
  });
});
