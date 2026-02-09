import type { DatabaseSync } from "node:sqlite";

export interface RunbookRecord {
  id: string;
  createdAt: string;
  incidentId?: string;
  title: string;
  actions: string[];
}

interface RunbookRow {
  id: string;
  created_at: string;
  incident_id: string | null;
  title: string;
  actions_json: string;
}

export class RunbookRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public create(record: RunbookRecord): void {
    this.db
      .prepare(
        `
          INSERT INTO runbooks (id, created_at, incident_id, title, actions_json)
          VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(
        record.id,
        record.createdAt,
        record.incidentId ?? null,
        record.title,
        JSON.stringify(record.actions)
      );
  }

  public listRecent(limit: number): RunbookRecord[] {
    const rows = this.db
      .prepare(
        `
          SELECT id, created_at, incident_id, title, actions_json
          FROM runbooks
          ORDER BY created_at DESC
          LIMIT ?
        `
      )
      .all(limit) as unknown as RunbookRow[];

    return rows.map((row) => {
      return {
        id: row.id,
        createdAt: row.created_at,
        ...(row.incident_id ? { incidentId: row.incident_id } : {}),
        title: row.title,
        actions: JSON.parse(row.actions_json) as string[],
      };
    });
  }
}
