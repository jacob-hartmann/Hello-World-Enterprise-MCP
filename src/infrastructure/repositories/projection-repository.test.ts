import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { ProjectionRepository } from "./projection-repository.js";

describe("ProjectionRepository", () => {
  it("loads and saves projection snapshots", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new ProjectionRepository(db.connection());
    const initial = repository.load();
    expect(initial.projectionVersion).toBe(0);

    repository.save({
      projectionVersion: 1,
      replayCheckpoint: 10,
      replayDurationMs: 5,
      checksum: "abc",
      counters: { c: 1 },
    });

    const next = repository.load();
    expect(next.projectionVersion).toBe(1);
    expect(next.replayCheckpoint).toBe(10);
  });
});
