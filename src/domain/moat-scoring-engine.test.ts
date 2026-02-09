import { describe, expect, it } from "vitest";
import { MoatScoringEngine } from "./moat-scoring-engine.js";

describe("MoatScoringEngine", () => {
  it("returns bounded score and quartile", () => {
    const engine = new MoatScoringEngine();
    const result = engine.assess({
      requestId: "req-1",
      sagaId: "saga-1",
      strategy: "narrative-weighted",
      includeArchitectureTheater: true,
      minimumViableMoat: 42,
      eventVolume: 10,
      enabled: true,
    });
    expect(result.assessment.score).toBeGreaterThanOrEqual(0);
    expect(result.assessment.score).toBeLessThanOrEqual(100);
    expect(["Q1", "Q2", "Q3", "Q4"]).toContain(result.assessment.quartile);
  });

  it("returns disabled neutral assessment", () => {
    const engine = new MoatScoringEngine();
    const result = engine.assess({
      requestId: "req-1",
      sagaId: "saga-1",
      strategy: "complexity-max",
      includeArchitectureTheater: true,
      minimumViableMoat: 42,
      eventVolume: 10,
      enabled: false,
    });
    expect(result.assessment.score).toBe(0);
    expect(result.assessment.quartile).toBe("Q4");
  });
});
