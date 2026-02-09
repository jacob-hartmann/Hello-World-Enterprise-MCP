import { describe, expect, it } from "vitest";
import { composeApplication } from "./composition-root.js";

describe("composeApplication", () => {
  it("wires orchestrator and repositories with package metadata", () => {
    const services = composeApplication({ dbPath: ":memory:" });
    expect(services.packageInfo.name).toBe("hello-world-enterprise-mcp");
    expect(services.packageInfo.version.length).toBeGreaterThan(0);
    expect(services.eventBus.handlerCount()).toBeGreaterThan(0);
    expect(services.auditRepository.count()).toBe(0);
    expect(services.eventLogRepository.count()).toBe(0);
    expect(services.aiEnrichmentRepository.count()).toBe(0);
    expect(services.esgOffsetRepository.count()).toBe(0);
    expect(services.moatRepository.count()).toBe(0);
    expect(services.runbookGenerationRepository.count()).toBe(0);
  });
});
