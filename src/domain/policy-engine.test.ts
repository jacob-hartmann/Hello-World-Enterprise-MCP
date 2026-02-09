import { describe, expect, it } from "vitest";
import { createValidRequest } from "../__test-helpers__/request-factory.js";
import { PolicyEngine } from "./policy-engine.js";

describe("PolicyEngine", () => {
  it("allows strict-default request with supported locale", () => {
    const engine = new PolicyEngine();
    const outcome = engine.evaluate(createValidRequest());

    expect(outcome.outcome).toBe("allowed");
    expect(outcome.decisions.length).toBeGreaterThan(0);
  });

  it("denies requests with excessive metadata when enforcement is enabled", () => {
    const engine = new PolicyEngine();
    const metadata: Record<string, string> = {};
    for (let i = 0; i < 17; i += 1) {
      metadata[`k${i}`] = "value";
    }

    const outcome = engine.evaluate(
      createValidRequest({
        metadata,
      })
    );

    expect(outcome.outcome).toBe("denied");
    expect(outcome.decisions[0]).toContain("maximum");
  });
});
