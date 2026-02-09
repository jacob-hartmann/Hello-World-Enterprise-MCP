import type { DatabaseSync } from "node:sqlite";

export interface RunbookGenerationRecord {
  requestId?: string;
  sagaId?: string;
  runbookId: string;
  incidentId: string;
  code: string;
  fingerprint: string;
  generatorId: string;
  createdAt: string;
}

interface RunbookGenerationRow {
  request_id: string | null;
  saga_id: string | null;
  runbook_id: string;
  incident_id: string;
  code: string;
  fingerprint: string;
  generator_id: string;
  created_at: string;
}

export class RunbookGenerationRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public create(record: RunbookGenerationRecord): void {
    this.db
      .prepare(
        `
          INSERT INTO runbook_generation_log
            (request_id, saga_id, runbook_id, incident_id, code, fingerprint, generator_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        record.requestId ?? null,
        record.sagaId ?? null,
        record.runbookId,
        record.incidentId,
        record.code,
        record.fingerprint,
        record.generatorId,
        record.createdAt
      );
  }

  public count(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM runbook_generation_log")
      .get() as { count: number } | undefined;
    return row?.count ?? 0;
  }

  public listRecent(limit: number): RunbookGenerationRecord[] {
    const rows = this.db
      .prepare(
        `
          SELECT request_id, saga_id, runbook_id, incident_id, code, fingerprint, generator_id, created_at
          FROM runbook_generation_log
          ORDER BY created_at DESC
          LIMIT ?
        `
      )
      .all(limit) as unknown as RunbookGenerationRow[];

    return rows.map((row) => {
      return this.mapRow(row);
    });
  }

  public findByRunbookIds(
    runbookIds: string[]
  ): Record<string, RunbookGenerationRecord> {
    if (runbookIds.length === 0) {
      return {};
    }

    const placeholders = runbookIds.map(() => "?").join(", ");
    const rows = this.db
      .prepare(
        `
          SELECT request_id, saga_id, runbook_id, incident_id, code, fingerprint, generator_id, created_at
          FROM runbook_generation_log
          WHERE runbook_id IN (${placeholders})
          ORDER BY created_at DESC
        `
      )
      .all(...runbookIds) as unknown as RunbookGenerationRow[];

    const mapped: Record<string, RunbookGenerationRecord> = {};
    for (const row of rows) {
      mapped[row.runbook_id] ??= this.mapRow(row);
    }
    return mapped;
  }

  public latest(): RunbookGenerationRecord | undefined {
    const row = this.db
      .prepare(
        `
          SELECT request_id, saga_id, runbook_id, incident_id, code, fingerprint, generator_id, created_at
          FROM runbook_generation_log
          ORDER BY created_at DESC
          LIMIT 1
        `
      )
      .get() as RunbookGenerationRow | undefined;

    return row ? this.mapRow(row) : undefined;
  }

  private mapRow(row: RunbookGenerationRow): RunbookGenerationRecord {
    return {
      ...(row.request_id ? { requestId: row.request_id } : {}),
      ...(row.saga_id ? { sagaId: row.saga_id } : {}),
      runbookId: row.runbook_id,
      incidentId: row.incident_id,
      code: row.code,
      fingerprint: row.fingerprint,
      generatorId: row.generator_id,
      createdAt: row.created_at,
    };
  }
}
