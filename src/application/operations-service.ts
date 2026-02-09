import { randomUUID } from "node:crypto";
import type { IncidentRecord } from "../contracts/v2.js";
import type { RunbookGenerationEngine } from "../domain/runbook-generation-engine.js";
import type { IncidentRepository } from "../infrastructure/repositories/incident-repository.js";
import type {
  RunbookRecord,
  RunbookRepository,
} from "../infrastructure/repositories/runbook-repository.js";
import type {
  RunbookGenerationRecord,
  RunbookGenerationRepository,
} from "../infrastructure/repositories/runbook-generation-repository.js";

export class OperationsService {
  public constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly runbookRepository: RunbookRepository,
    private readonly runbookGenerationRepository: RunbookGenerationRepository,
    private readonly runbookGenerationEngine: RunbookGenerationEngine
  ) {}

  public raiseIncident(input: {
    severity: IncidentRecord["severity"];
    title: string;
    details: string;
    code: string;
    requestId?: string;
    sagaId?: string;
  }): { incident: IncidentRecord; runbook: RunbookRecord } {
    const incident: IncidentRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      severity: input.severity,
      title: input.title,
      details: input.details,
    };
    this.incidentRepository.create(incident);

    const generated = this.runbookGenerationEngine.generate({
      incidentId: incident.id,
      severity: incident.severity,
      title: incident.title,
      details: incident.details,
      code: input.code,
    });
    const runbook: RunbookRecord = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      incidentId: incident.id,
      title: generated.title,
      actions: generated.actions,
    };
    this.runbookRepository.create(runbook);
    const generationRecord: RunbookGenerationRecord = {
      ...(input.requestId ? { requestId: input.requestId } : {}),
      ...(input.sagaId ? { sagaId: input.sagaId } : {}),
      runbookId: runbook.id,
      incidentId: incident.id,
      code: input.code,
      fingerprint: generated.fingerprint,
      generatorId: generated.generatorId,
      createdAt: runbook.createdAt,
    };
    this.runbookGenerationRepository.create(generationRecord);

    return { incident, runbook };
  }
}
