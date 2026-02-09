import type { DatabaseSync } from "node:sqlite";

export interface MoatRecord {
  requestId: string;
  sagaId: string;
  strategy: string;
  score: number;
  quartile: "Q1" | "Q2" | "Q3" | "Q4";
  dimensions: Record<string, number>;
  createdAt: string;
}

interface MoatRow {
  request_id: string;
  saga_id: string;
  strategy: string;
  score: number;
  quartile: "Q1" | "Q2" | "Q3" | "Q4";
  dimensions_json: string;
  created_at: string;
}

export class MoatRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public create(record: MoatRecord): void {
    this.db
      .prepare(
        `
          INSERT INTO moat_assessments
            (request_id, saga_id, strategy, score, quartile, dimensions_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        record.requestId,
        record.sagaId,
        record.strategy,
        record.score,
        record.quartile,
        JSON.stringify(record.dimensions),
        record.createdAt
      );
  }

  public count(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM moat_assessments")
      .get() as { count: number } | undefined;
    return row?.count ?? 0;
  }

  public latest(): MoatRecord | undefined {
    const row = this.db
      .prepare(
        `
          SELECT request_id, saga_id, strategy, score, quartile, dimensions_json, created_at
          FROM moat_assessments
          ORDER BY created_at DESC
          LIMIT 1
        `
      )
      .get() as MoatRow | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  public listRecent(limit: number): MoatRecord[] {
    const rows = this.db
      .prepare(
        `
          SELECT request_id, saga_id, strategy, score, quartile, dimensions_json, created_at
          FROM moat_assessments
          ORDER BY created_at DESC
          LIMIT ?
        `
      )
      .all(limit) as unknown as MoatRow[];

    return rows.map((row) => {
      return this.mapRow(row);
    });
  }

  private mapRow(row: MoatRow): MoatRecord {
    return {
      requestId: row.request_id,
      sagaId: row.saga_id,
      strategy: row.strategy,
      score: row.score,
      quartile: row.quartile,
      dimensions: JSON.parse(row.dimensions_json) as Record<string, number>,
      createdAt: row.created_at,
    };
  }
}
