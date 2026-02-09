import { describe, expect, it } from "vitest";
import { composeApplication } from "./composition-root.js";

describe("composeApplication", () => {
  it("wires orchestrator and repositories with package metadata", () => {
    const services = composeApplication();
    expect(services.packageInfo.name).toBe("hello-world-enterprise-mcp");
    expect(services.packageInfo.version.length).toBeGreaterThan(0);
    expect(services.eventBus.handlerCount()).toBeGreaterThan(0);
    expect(services.auditRepository.count()).toBe(0);
  });
});
