import { describe, expect, it } from "vitest";
import { AiEnhancementEngine } from "./ai-enhancement-engine.js";

describe("AiEnhancementEngine", () => {
  it("returns deterministic output for same input", () => {
    const engine = new AiEnhancementEngine();
    const input = {
      requestId: "req-1",
      traceId: "trace-1",
      recipient: "World",
      baseGreeting: "Hello World",
      profile: "investor-friendly" as const,
      personalizationDepth: 2 as const,
      enabled: true,
      seed: "seed-1",
    };

    const first = engine.enhance(input);
    const second = engine.enhance(input);

    expect(first.report.promptFingerprint).toBe(
      second.report.promptFingerprint
    );
    expect(first.sentimentScore).toBe(second.sentimentScore);
    expect(first.tokenEstimate).toBe(second.tokenEstimate);
  });

  it("returns disabled marker payload when disabled", () => {
    const engine = new AiEnhancementEngine();
    const result = engine.enhance({
      requestId: "req-1",
      traceId: "trace-1",
      recipient: "World",
      baseGreeting: "Hello World",
      profile: "investor-friendly",
      personalizationDepth: 2,
      enabled: false,
    });

    expect(result.report.profile).toBe("disabled");
    expect(result.sentimentScore).toBe(0);
  });
});
