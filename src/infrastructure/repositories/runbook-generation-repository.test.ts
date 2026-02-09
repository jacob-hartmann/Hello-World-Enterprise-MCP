import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { RunbookGenerationRepository } from "./runbook-generation-repository.js";

describe("RunbookGenerationRepository", () => {
  it("stores and finds runbook generation records", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new RunbookGenerationRepository(db.connection());
    repository.create({
      runbookId: "rb-1",
      incidentId: "inc-1",
      code: "SIMULATED_INCIDENT",
      fingerprint: "fp-1",
      generatorId: "deterministic-runbook-synth-v1",
      createdAt: new Date().toISOString(),
    });

    expect(repository.count()).toBe(1);
    expect(repository.latest()?.fingerprint).toBe("fp-1");
    expect(repository.findByRunbookIds(["rb-1"])["rb-1"]?.code).toBe(
      "SIMULATED_INCIDENT"
    );
  });
});
