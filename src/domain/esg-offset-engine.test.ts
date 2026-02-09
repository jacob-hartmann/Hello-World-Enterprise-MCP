import { describe, expect, it } from "vitest";
import { EsgOffsetEngine } from "./esg-offset-engine.js";

describe("EsgOffsetEngine", () => {
  it("calculates deterministic certificate and offsets", () => {
    const engine = new EsgOffsetEngine();
    const input = {
      requestId: "req-1",
      sagaId: "saga-1",
      selectedRegion: "us-east-1",
      greetingLength: 42,
      enabled: true,
      targetNetZero: true,
      provider: "parody-offsets-inc" as const,
    };
    const first = engine.calculate(input);
    const second = engine.calculate(input);
    expect(first.report.certificateId).toBe(second.report.certificateId);
    expect(first.report.offsetPurchasedGrams).toBe(
      first.report.estimatedCo2Grams
    );
  });

  it("returns disabled markers when turned off", () => {
    const engine = new EsgOffsetEngine();
    const result = engine.calculate({
      requestId: "req-1",
      sagaId: "saga-1",
      selectedRegion: "us-east-1",
      greetingLength: 42,
      enabled: false,
      targetNetZero: true,
      provider: "parody-offsets-inc",
    });
    expect(result.report.provider).toBe("disabled");
    expect(result.report.offsetPurchasedGrams).toBe(0);
  });
});
