import type { DatabaseSync } from "node:sqlite";
import type { IncidentRecord } from "../../contracts/v2.js";

interface IncidentRow {
  id: string;
  created_at: string;
  severity: IncidentRecord["severity"];
  title: string;
  details: string;
}

export class IncidentRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public create(record: IncidentRecord): void {
    this.db
      .prepare(
        `
          INSERT INTO incidents (id, created_at, severity, title, details)
          VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(
        record.id,
        record.createdAt,
        record.severity,
        record.title,
        record.details
      );
  }

  public listRecent(limit: number): IncidentRecord[] {
    const rows = this.db
      .prepare(
        `
          SELECT id, created_at, severity, title, details
          FROM incidents
          ORDER BY created_at DESC
          LIMIT ?
        `
      )
      .all(limit) as unknown as IncidentRow[];

    return rows.map((row) => {
      return {
        id: row.id,
        createdAt: row.created_at,
        severity: row.severity,
        title: row.title,
        details: row.details,
      };
    });
  }

  public count(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM incidents")
      .get() as { count: number } | undefined;
    return row?.count ?? 0;
  }
}
