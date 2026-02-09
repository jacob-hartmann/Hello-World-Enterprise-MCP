import { describe, expect, it } from "vitest";
import { EventBus } from "./event-bus.js";

describe("EventBus", () => {
  it("publishes to specific and wildcard subscribers", () => {
    const bus = new EventBus();
    let specificCount = 0;
    let wildcardCount = 0;

    bus.subscribe("request.received", () => {
      specificCount += 1;
    });
    bus.subscribe("*", () => {
      wildcardCount += 1;
    });

    bus.publish({
      name: "request.received",
      timestamp: new Date().toISOString(),
      requestId: "r-1",
      traceId: "t-1",
    });

    expect(specificCount).toBe(1);
    expect(wildcardCount).toBe(1);
    expect(bus.handlerCount()).toBe(2);
  });
});
