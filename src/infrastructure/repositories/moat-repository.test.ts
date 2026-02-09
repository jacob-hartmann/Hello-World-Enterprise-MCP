import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { MoatRepository } from "./moat-repository.js";

describe("MoatRepository", () => {
  it("stores and lists moat assessments", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new MoatRepository(db.connection());
    repository.create({
      requestId: "req-1",
      sagaId: "saga-1",
      strategy: "narrative-weighted",
      score: 77,
      quartile: "Q1",
      dimensions: {
        narrative: 70,
        complexity: 80,
        defensibility: 60,
      },
      createdAt: new Date().toISOString(),
    });

    expect(repository.count()).toBe(1);
    expect(repository.latest()?.quartile).toBe("Q1");
    expect(repository.listRecent(10)[0]?.score).toBe(77);
  });
});
