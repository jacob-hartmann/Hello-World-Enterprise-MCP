import { describe, expect, it } from "vitest";
import { CompensationEngine } from "./compensation-engine.js";

describe("CompensationEngine", () => {
  it("compensates completed steps in reverse order", () => {
    const engine = new CompensationEngine();
    const result = engine.compensate([
      { step: "A", status: "completed", message: "ok" },
      { step: "B", status: "failed", message: "fail" },
      { step: "C", status: "completed", message: "ok" },
    ]);
    expect(result.map((step) => step.step)).toEqual(["C", "A"]);
    expect(result[0]?.status).toBe("compensated");
  });
});
