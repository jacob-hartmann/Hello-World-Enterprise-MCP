import { describe, expect, it } from "vitest";
import { RunbookGenerationEngine } from "./runbook-generation-engine.js";

describe("RunbookGenerationEngine", () => {
  it("generates deterministic runbooks", () => {
    const engine = new RunbookGenerationEngine();
    const input = {
      incidentId: "inc-1",
      severity: "sev-2" as const,
      title: "Synthetic incident",
      details: "details",
      code: "SIMULATED_INCIDENT",
    };
    const first = engine.generate(input);
    const second = engine.generate(input);
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(first.actions).toEqual(second.actions);
  });
});
