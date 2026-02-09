import type { DatabaseSync } from "node:sqlite";

export interface EsgOffsetRecord {
  requestId: string;
  sagaId: string;
  provider: string;
  estimatedCo2Grams: number;
  offsetPurchasedGrams: number;
  certificateId: string;
  createdAt: string;
}

interface EsgOffsetRow {
  request_id: string;
  saga_id: string;
  provider: string;
  estimated_co2_grams: number;
  offset_purchased_grams: number;
  certificate_id: string;
  created_at: string;
}

export class EsgOffsetRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public create(record: EsgOffsetRecord): void {
    this.db
      .prepare(
        `
          INSERT INTO esg_offset_ledger
            (request_id, saga_id, provider, estimated_co2_grams, offset_purchased_grams, certificate_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        record.requestId,
        record.sagaId,
        record.provider,
        record.estimatedCo2Grams,
        record.offsetPurchasedGrams,
        record.certificateId,
        record.createdAt
      );
  }

  public count(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM esg_offset_ledger")
      .get() as { count: number } | undefined;
    return row?.count ?? 0;
  }

  public latest(): EsgOffsetRecord | undefined {
    const row = this.db
      .prepare(
        `
          SELECT request_id, saga_id, provider, estimated_co2_grams, offset_purchased_grams, certificate_id, created_at
          FROM esg_offset_ledger
          ORDER BY created_at DESC
          LIMIT 1
        `
      )
      .get() as EsgOffsetRow | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  public listRecent(limit: number): EsgOffsetRecord[] {
    const rows = this.db
      .prepare(
        `
          SELECT request_id, saga_id, provider, estimated_co2_grams, offset_purchased_grams, certificate_id, created_at
          FROM esg_offset_ledger
          ORDER BY created_at DESC
          LIMIT ?
        `
      )
      .all(limit) as unknown as EsgOffsetRow[];

    return rows.map((row) => {
      return this.mapRow(row);
    });
  }

  private mapRow(row: EsgOffsetRow): EsgOffsetRecord {
    return {
      requestId: row.request_id,
      sagaId: row.saga_id,
      provider: row.provider,
      estimatedCo2Grams: row.estimated_co2_grams,
      offsetPurchasedGrams: row.offset_purchased_grams,
      certificateId: row.certificate_id,
      createdAt: row.created_at,
    };
  }
}
