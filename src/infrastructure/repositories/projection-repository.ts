import type { DatabaseSync } from "node:sqlite";
import type { ReplayResult } from "../../contracts/v2.js";

interface ProjectionRow {
  projection_version: number;
  replay_checkpoint: number;
  replay_duration_ms: number;
  checksum: string;
  counters_json: string;
}

export class ProjectionRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public load(): ReplayResult {
    const row = this.db
      .prepare(
        `
          SELECT projection_version, replay_checkpoint, replay_duration_ms, checksum, counters_json
          FROM projections_metrics
          WHERE id = 1
        `
      )
      .get() as unknown as ProjectionRow;

    return {
      projectionVersion: row.projection_version,
      replayCheckpoint: row.replay_checkpoint,
      replayDurationMs: row.replay_duration_ms,
      checksum: row.checksum,
      counters: JSON.parse(row.counters_json) as Record<string, number>,
    };
  }

  public save(snapshot: ReplayResult): void {
    this.db
      .prepare(
        `
          UPDATE projections_metrics
          SET projection_version = ?, replay_checkpoint = ?, replay_duration_ms = ?, checksum = ?, counters_json = ?, updated_at = ?
          WHERE id = 1
        `
      )
      .run(
        snapshot.projectionVersion,
        snapshot.replayCheckpoint,
        snapshot.replayDurationMs,
        snapshot.checksum,
        JSON.stringify(snapshot.counters),
        new Date().toISOString()
      );
  }
}
