import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../infrastructure/sqlite/database.js";
import { IncidentRepository } from "../infrastructure/repositories/incident-repository.js";
import { RunbookRepository } from "../infrastructure/repositories/runbook-repository.js";
import { RunbookGenerationRepository } from "../infrastructure/repositories/runbook-generation-repository.js";
import { RunbookGenerationEngine } from "../domain/runbook-generation-engine.js";
import { OperationsService } from "./operations-service.js";

describe("OperationsService", () => {
  it("creates incident and runbook pair", () => {
    const db = new EnterpriseDatabase(":memory:");
    const service = new OperationsService(
      new IncidentRepository(db.connection()),
      new RunbookRepository(db.connection()),
      new RunbookGenerationRepository(db.connection()),
      new RunbookGenerationEngine()
    );

    const raised = service.raiseIncident({
      severity: "sev-2",
      title: "Policy denied",
      details: "details",
      code: "POLICY_DENIED",
    });

    expect(raised.incident.id.length).toBeGreaterThan(0);
    expect(raised.runbook.actions.length).toBeGreaterThan(0);
    expect(raised.runbook.title).toContain("Runbook for POLICY_DENIED");
  });
});
