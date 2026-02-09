import type { DatabaseSync } from "node:sqlite";

export interface AiEnrichmentRecord {
  requestId: string;
  sagaId: string;
  traceId: string;
  profile: string;
  modelId: string;
  promptFingerprint: string;
  enhancedGreeting: string;
  sentimentScore: number;
  tokenEstimate: number;
  createdAt: string;
}

interface AiEnrichmentRow {
  request_id: string;
  saga_id: string;
  trace_id: string;
  profile: string;
  model_id: string;
  prompt_fingerprint: string;
  enhanced_greeting: string;
  sentiment_score: number;
  token_estimate: number;
  created_at: string;
}

export class AiEnrichmentRepository {
  public constructor(private readonly db: DatabaseSync) {}

  public create(record: AiEnrichmentRecord): void {
    this.db
      .prepare(
        `
          INSERT INTO ai_enrichment_log
            (request_id, saga_id, trace_id, profile, model_id, prompt_fingerprint, enhanced_greeting, sentiment_score, token_estimate, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        record.requestId,
        record.sagaId,
        record.traceId,
        record.profile,
        record.modelId,
        record.promptFingerprint,
        record.enhancedGreeting,
        record.sentimentScore,
        record.tokenEstimate,
        record.createdAt
      );
  }

  public count(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM ai_enrichment_log")
      .get() as { count: number } | undefined;
    return row?.count ?? 0;
  }

  public latest(): AiEnrichmentRecord | undefined {
    const row = this.db
      .prepare(
        `
          SELECT request_id, saga_id, trace_id, profile, model_id, prompt_fingerprint, enhanced_greeting, sentiment_score, token_estimate, created_at
          FROM ai_enrichment_log
          ORDER BY created_at DESC
          LIMIT 1
        `
      )
      .get() as AiEnrichmentRow | undefined;

    return row ? this.mapRow(row) : undefined;
  }

  public listRecent(limit: number): AiEnrichmentRecord[] {
    const rows = this.db
      .prepare(
        `
          SELECT request_id, saga_id, trace_id, profile, model_id, prompt_fingerprint, enhanced_greeting, sentiment_score, token_estimate, created_at
          FROM ai_enrichment_log
          ORDER BY created_at DESC
          LIMIT ?
        `
      )
      .all(limit) as unknown as AiEnrichmentRow[];

    return rows.map((row) => {
      return this.mapRow(row);
    });
  }

  private mapRow(row: AiEnrichmentRow): AiEnrichmentRecord {
    return {
      requestId: row.request_id,
      sagaId: row.saga_id,
      traceId: row.trace_id,
      profile: row.profile,
      modelId: row.model_id,
      promptFingerprint: row.prompt_fingerprint,
      enhancedGreeting: row.enhanced_greeting,
      sentimentScore: row.sentiment_score,
      tokenEstimate: row.token_estimate,
      createdAt: row.created_at,
    };
  }
}
