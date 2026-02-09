import type { DatabaseSync } from "node:sqlite";

export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  responseJson: string;
  createdAt: string;
}

interface IdempotencyRow {
  key: string;
  request_hash: string;
  response_json: string;
  created_at: string;
}

export class IdempotencyRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public find(key: string): IdempotencyRecord | undefined {
    const row = this.db
      .prepare(
        `
          SELECT key, request_hash, response_json, created_at
          FROM idempotency_keys
          WHERE key = ?
        `
      )
      .get(key) as IdempotencyRow | undefined;

    if (!row) {
      return undefined;
    }

    return {
      key: row.key,
      requestHash: row.request_hash,
      responseJson: row.response_json,
      createdAt: row.created_at,
    };
  }

  public save(key: string, requestHash: string, responseJson: string): void {
    this.db
      .prepare(
        `
          INSERT INTO idempotency_keys (key, request_hash, response_json, created_at)
          VALUES (?, ?, ?, ?)
        `
      )
      .run(key, requestHash, responseJson, new Date().toISOString());
  }
}
