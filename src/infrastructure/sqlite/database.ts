import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export class EnterpriseDatabase {
  private readonly db: DatabaseSync;

  public constructor(path: string) {
    if (path !== ":memory:") {
      mkdirSync(dirname(path), { recursive: true });
    }

    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.runMigrations();
  }

  public connection(): DatabaseSync {
    return this.db;
  }

  private runMigrations(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS event_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        saga_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        step TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload_json TEXT
      );

      CREATE TABLE IF NOT EXISTS saga_instances (
        saga_id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        status TEXT NOT NULL,
        region TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        request_hash TEXT NOT NULL,
        response_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        details TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS runbooks (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        incident_id TEXT,
        title TEXT NOT NULL,
        actions_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projections_metrics (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        projection_version INTEGER NOT NULL,
        replay_checkpoint INTEGER NOT NULL,
        replay_duration_ms INTEGER NOT NULL,
        checksum TEXT NOT NULL,
        counters_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ai_enrichment_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT NOT NULL,
        saga_id TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        profile TEXT NOT NULL,
        model_id TEXT NOT NULL,
        prompt_fingerprint TEXT NOT NULL,
        enhanced_greeting TEXT NOT NULL,
        sentiment_score INTEGER NOT NULL,
        token_estimate INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS esg_offset_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT NOT NULL,
        saga_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        estimated_co2_grams INTEGER NOT NULL,
        offset_purchased_grams INTEGER NOT NULL,
        certificate_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS moat_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT NOT NULL,
        saga_id TEXT NOT NULL,
        strategy TEXT NOT NULL,
        score INTEGER NOT NULL,
        quartile TEXT NOT NULL,
        dimensions_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS runbook_generation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT,
        saga_id TEXT,
        runbook_id TEXT NOT NULL,
        incident_id TEXT NOT NULL,
        code TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        generator_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ai_enrichment_request_saga_created
        ON ai_enrichment_log (request_id, saga_id, created_at);

      CREATE INDEX IF NOT EXISTS idx_esg_offset_request_saga_created
        ON esg_offset_ledger (request_id, saga_id, created_at);

      CREATE INDEX IF NOT EXISTS idx_moat_request_saga_created
        ON moat_assessments (request_id, saga_id, created_at);

      CREATE INDEX IF NOT EXISTS idx_runbook_generation_request_saga_created
        ON runbook_generation_log (request_id, saga_id, created_at);
    `);

    const existingProjection = this.db
      .prepare("SELECT id FROM projections_metrics WHERE id = 1")
      .get() as { id?: number } | undefined;
    if (!existingProjection?.id) {
      this.db
        .prepare(
          `
            INSERT INTO projections_metrics
              (id, projection_version, replay_checkpoint, replay_duration_ms, checksum, counters_json, updated_at)
            VALUES (1, 0, 0, 0, '', '{}', ?)
          `
        )
        .run(new Date().toISOString());
    }
  }
}
