import { describe, expect, it } from "vitest";
import { ChaosEngine } from "./chaos-engine.js";

describe("ChaosEngine", () => {
  it("produces deterministic output for same input", () => {
    const engine = new ChaosEngine();
    const first = engine.decide({
      seedBase: "seed-1",
      step: "GenerateGreetingStep",
      attempt: 1,
      partitionSimulation: true,
      latencyJitterMs: 50,
    });
    const second = engine.decide({
      seedBase: "seed-1",
      step: "GenerateGreetingStep",
      attempt: 1,
      partitionSimulation: true,
      latencyJitterMs: 50,
    });
    expect(first).toEqual(second);
  });

  it("changes decision when seed changes", () => {
    const engine = new ChaosEngine();
    const first = engine.decide({
      seedBase: "seed-1",
      step: "GenerateGreetingStep",
      attempt: 1,
      partitionSimulation: true,
      latencyJitterMs: 50,
    });
    const second = engine.decide({
      seedBase: "seed-2",
      step: "GenerateGreetingStep",
      attempt: 1,
      partitionSimulation: true,
      latencyJitterMs: 50,
    });
    expect(first.deterministicKey).not.toBe(second.deterministicKey);
  });

  it("respects partition simulation toggle", () => {
    const engine = new ChaosEngine();
    const disabled = engine.decide({
      seedBase: "seed-1",
      step: "RouteRegionStep",
      attempt: 1,
      partitionSimulation: false,
      latencyJitterMs: 0,
    });
    expect(disabled.partitionTriggered).toBe(false);
  });
});
