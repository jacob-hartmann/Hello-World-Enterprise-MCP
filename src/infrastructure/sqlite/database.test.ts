import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "./database.js";

describe("EnterpriseDatabase", () => {
  it("creates schema on initialization", () => {
    const database = new EnterpriseDatabase(":memory:");
    const db = database.connection();
    const eventLogTable = db
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM sqlite_master
          WHERE type = 'table' AND name = 'event_log'
        `
      )
      .get() as { count: number };
    const enrichmentTables = db
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM sqlite_master
          WHERE type = 'table' AND name IN (
            'ai_enrichment_log',
            'esg_offset_ledger',
            'moat_assessments',
            'runbook_generation_log'
          )
        `
      )
      .get() as { count: number };
    const enrichmentIndexes = db
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM sqlite_master
          WHERE type = 'index' AND name IN (
            'idx_ai_enrichment_request_saga_created',
            'idx_esg_offset_request_saga_created',
            'idx_moat_request_saga_created',
            'idx_runbook_generation_request_saga_created'
          )
        `
      )
      .get() as { count: number };

    expect(eventLogTable.count).toBe(1);
    expect(enrichmentTables.count).toBe(4);
    expect(enrichmentIndexes.count).toBe(4);
  });
});
