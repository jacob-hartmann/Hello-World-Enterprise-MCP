import { describe, expect, it } from "vitest";
import { createValidRequest } from "../__test-helpers__/request-factory.js";
import { AiEnhancementEngine } from "../domain/ai-enhancement-engine.js";
import { EsgOffsetEngine } from "../domain/esg-offset-engine.js";
import { MoatScoringEngine } from "../domain/moat-scoring-engine.js";
import { AiEnrichmentRepository } from "../infrastructure/repositories/ai-enrichment-repository.js";
import { EsgOffsetRepository } from "../infrastructure/repositories/esg-offset-repository.js";
import { MetricsRepository } from "../infrastructure/repositories/metrics-repository.js";
import { MoatRepository } from "../infrastructure/repositories/moat-repository.js";
import { EnterpriseDatabase } from "../infrastructure/sqlite/database.js";
import { EnterpriseEnrichmentPipeline } from "./enterprise-enrichment-pipeline.js";

function createPipeline() {
  const db = new EnterpriseDatabase(":memory:");
  const metrics = new MetricsRepository();
  return {
    pipeline: new EnterpriseEnrichmentPipeline(
      new AiEnhancementEngine(),
      new EsgOffsetEngine(),
      new MoatScoringEngine(),
      new AiEnrichmentRepository(db.connection()),
      new EsgOffsetRepository(db.connection()),
      new MoatRepository(db.connection()),
      metrics
    ),
    db,
    metrics,
  };
}

describe("EnterpriseEnrichmentPipeline", () => {
  it("produces deterministic bundle", () => {
    const { pipeline } = createPipeline();
    const request = createValidRequest();
    const context = {
      requestId: "req-1",
      traceId: "trace-1",
      sagaId: "saga-1",
      selectedRegion: "us-east-1",
      baseGreeting: "Hello World",
      eventVolume: 3,
    } as const;

    const first = pipeline.run(request, context);
    const second = pipeline.run(request, context);
    expect(first.enterpriseMetadata.genAiSentimentScore).toBe(
      second.enterpriseMetadata.genAiSentimentScore
    );
    expect(first.esgOffsetReport.certificateId).toBe(
      second.esgOffsetReport.certificateId
    );
    expect(first.moatAssessment.score).toBe(second.moatAssessment.score);
  });

  it("persists enrichment artifacts and updates metrics", () => {
    const { pipeline, db, metrics } = createPipeline();
    const request = createValidRequest();
    const context = {
      requestId: "req-2",
      traceId: "trace-2",
      sagaId: "saga-2",
      selectedRegion: "eu-west-1",
      baseGreeting: "Hello World",
      eventVolume: 5,
    };
    const bundle = pipeline.run(request, context);
    pipeline.persistArtifacts(request, context, bundle);

    const aiRow = db
      .connection()
      .prepare("SELECT COUNT(*) AS count FROM ai_enrichment_log")
      .get() as { count: number };
    const counters = metrics.snapshot().counters;
    expect(aiRow.count).toBe(1);
    expect(counters["ai_enrichment_total"]).toBe(1);
    expect(counters["moat_assessment_total"]).toBe(1);
  });
});
