import type { DatabaseSync } from "node:sqlite";
import type { SagaEvent } from "../../contracts/v2.js";

interface EventLogRow {
  id: number;
  timestamp: string;
  saga_id: string;
  request_id: string;
  trace_id: string;
  step: string;
  event_type: SagaEvent["eventType"];
  payload_json: string | null;
}

export class EventLogRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public append(event: SagaEvent): number {
    const result = this.db
      .prepare(
        `
          INSERT INTO event_log (timestamp, saga_id, request_id, trace_id, step, event_type, payload_json)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        event.timestamp,
        event.sagaId,
        event.requestId,
        event.traceId,
        event.step,
        event.eventType,
        event.payload ? JSON.stringify(event.payload) : null
      );

    return Number(result.lastInsertRowid);
  }

  public count(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM event_log")
      .get() as { count: number } | undefined;
    return row?.count ?? 0;
  }

  public latestOffset(): number {
    const row = this.db
      .prepare("SELECT COALESCE(MAX(id), 0) AS max_id FROM event_log")
      .get() as { max_id: number } | undefined;
    return row?.max_id ?? 0;
  }

  public listRecent(limit: number): (SagaEvent & { offset: number })[] {
    const rows = this.db
      .prepare(
        `
          SELECT id, timestamp, saga_id, request_id, trace_id, step, event_type, payload_json
          FROM event_log
          ORDER BY id DESC
          LIMIT ?
        `
      )
      .all(limit) as unknown as EventLogRow[];

    return rows
      .map((row) => {
        return {
          offset: row.id,
          timestamp: row.timestamp,
          sagaId: row.saga_id,
          requestId: row.request_id,
          traceId: row.trace_id,
          step: row.step,
          eventType: row.event_type,
          ...(row.payload_json
            ? {
                payload: JSON.parse(row.payload_json) as Record<
                  string,
                  unknown
                >,
              }
            : {}),
        };
      })
      .reverse();
  }

  public replayAll(): (SagaEvent & { offset: number })[] {
    const rows = this.db
      .prepare(
        `
          SELECT id, timestamp, saga_id, request_id, trace_id, step, event_type, payload_json
          FROM event_log
          ORDER BY id ASC
        `
      )
      .all() as unknown as EventLogRow[];

    return rows.map((row) => {
      return {
        offset: row.id,
        timestamp: row.timestamp,
        sagaId: row.saga_id,
        requestId: row.request_id,
        traceId: row.trace_id,
        step: row.step,
        eventType: row.event_type,
        ...(row.payload_json
          ? {
              payload: JSON.parse(row.payload_json) as Record<string, unknown>,
            }
          : {}),
      };
    });
  }
}
