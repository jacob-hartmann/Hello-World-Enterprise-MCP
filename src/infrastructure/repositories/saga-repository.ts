import type { DatabaseSync } from "node:sqlite";

export interface SagaInstance {
  sagaId: string;
  requestId: string;
  status: "completed" | "compensated" | "failed" | "running";
  region: string;
  createdAt: string;
  updatedAt: string;
}

interface SagaRow {
  saga_id: string;
  request_id: string;
  status: SagaInstance["status"];
  region: string;
  created_at: string;
  updated_at: string;
}

export class SagaRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public startSaga(
    sagaId: string,
    requestId: string,
    region: string,
    status: SagaInstance["status"] = "running"
  ): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
          INSERT INTO saga_instances (saga_id, request_id, status, region, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      )
      .run(sagaId, requestId, status, region, now, now);
  }

  public updateStatus(
    sagaId: string,
    status: SagaInstance["status"],
    region: string
  ): void {
    this.db
      .prepare(
        `
          UPDATE saga_instances
          SET status = ?, region = ?, updated_at = ?
          WHERE saga_id = ?
        `
      )
      .run(status, region, new Date().toISOString(), sagaId);
  }

  public getSaga(sagaId: string): SagaInstance | undefined {
    const row = this.db
      .prepare(
        `
          SELECT saga_id, request_id, status, region, created_at, updated_at
          FROM saga_instances
          WHERE saga_id = ?
        `
      )
      .get(sagaId) as SagaRow | undefined;
    if (!row) {
      return undefined;
    }
    return {
      sagaId: row.saga_id,
      requestId: row.request_id,
      status: row.status,
      region: row.region,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
