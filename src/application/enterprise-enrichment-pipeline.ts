import type {
  EnterpriseMetadata,
  EsgOffsetReport,
  MoatAssessment,
  OrchestrateRequest,
  AiEnhancementReport,
} from "../contracts/v2.js";
import type {
  AiEnhancementEngine,
  AiEnhancementResult,
} from "../domain/ai-enhancement-engine.js";
import type { EsgOffsetEngine } from "../domain/esg-offset-engine.js";
import type { MoatScoringEngine } from "../domain/moat-scoring-engine.js";
import type { MetricsRepository } from "../infrastructure/repositories/metrics-repository.js";
import type { AiEnrichmentRepository } from "../infrastructure/repositories/ai-enrichment-repository.js";
import type { EsgOffsetRepository } from "../infrastructure/repositories/esg-offset-repository.js";
import type { MoatRepository } from "../infrastructure/repositories/moat-repository.js";

export interface EnrichmentContext {
  requestId: string;
  traceId: string;
  sagaId: string;
  selectedRegion: string;
  baseGreeting: string;
  eventVolume: number;
}

export interface EnrichmentBundle {
  aiEnhancementReport: AiEnhancementReport;
  esgOffsetReport: EsgOffsetReport;
  moatAssessment: MoatAssessment;
  enterpriseMetadata: EnterpriseMetadata;
}

export class EnterpriseEnrichmentPipeline {
  public constructor(
    private readonly aiEnhancementEngine: AiEnhancementEngine,
    private readonly esgOffsetEngine: EsgOffsetEngine,
    private readonly moatScoringEngine: MoatScoringEngine,
    private readonly aiEnrichmentRepository: AiEnrichmentRepository,
    private readonly esgOffsetRepository: EsgOffsetRepository,
    private readonly moatRepository: MoatRepository,
    private readonly metricsRepository: MetricsRepository
  ) {}

  public run(
    request: OrchestrateRequest,
    context: EnrichmentContext
  ): EnrichmentBundle {
    const aiResult = this.aiEnhancementEngine.enhance({
      requestId: context.requestId,
      traceId: context.traceId,
      recipient: request.recipient,
      baseGreeting: context.baseGreeting,
      profile: request.aiEnhancement.profile,
      personalizationDepth: request.aiEnhancement.personalizationDepth,
      enabled: request.aiEnhancement.enabled,
      ...(request.aiEnhancement.seed
        ? { seed: request.aiEnhancement.seed }
        : {}),
    });

    const sentimentScore = this.computeSentimentScore(aiResult, request);
    const esgResult = this.esgOffsetEngine.calculate({
      requestId: context.requestId,
      sagaId: context.sagaId,
      selectedRegion: context.selectedRegion,
      greetingLength: aiResult.report.enhancedGreeting.length,
      enabled: request.esgOffset.enabled,
      targetNetZero: request.esgOffset.targetNetZero,
      provider: request.esgOffset.provider,
      ...(request.esgOffset.regionIntensityOverride !== undefined
        ? { regionIntensityOverride: request.esgOffset.regionIntensityOverride }
        : {}),
    });
    const moatResult = this.moatScoringEngine.assess({
      requestId: context.requestId,
      sagaId: context.sagaId,
      strategy: request.moatScore.strategy,
      includeArchitectureTheater: request.moatScore.includeArchitectureTheater,
      minimumViableMoat: request.moatScore.minimumViableMoat,
      eventVolume: context.eventVolume,
      enabled: request.moatScore.enabled,
    });

    const enterpriseMetadata: EnterpriseMetadata = {
      genAiSentimentScore: sentimentScore,
      aiModelId: aiResult.report.modelId,
      aiPromptFingerprint: aiResult.report.promptFingerprint,
      aiTokenEstimate: aiResult.tokenEstimate,
      esgEstimatedCo2Grams: esgResult.report.estimatedCo2Grams,
      esgOffsetPurchasedGrams: esgResult.report.offsetPurchasedGrams,
      esgCertificateId: esgResult.report.certificateId,
      moatScore: moatResult.assessment.score,
      moatQuartile: moatResult.assessment.quartile,
    };

    return {
      aiEnhancementReport: aiResult.report,
      esgOffsetReport: esgResult.report,
      moatAssessment: moatResult.assessment,
      enterpriseMetadata,
    };
  }

  public persistArtifacts(
    request: OrchestrateRequest,
    context: EnrichmentContext,
    bundle: EnrichmentBundle
  ): void {
    const now = new Date().toISOString();
    this.aiEnrichmentRepository.create({
      requestId: context.requestId,
      sagaId: context.sagaId,
      traceId: context.traceId,
      profile: bundle.aiEnhancementReport.profile,
      modelId: bundle.aiEnhancementReport.modelId,
      promptFingerprint: bundle.aiEnhancementReport.promptFingerprint,
      enhancedGreeting: bundle.aiEnhancementReport.enhancedGreeting,
      sentimentScore: bundle.enterpriseMetadata.genAiSentimentScore,
      tokenEstimate: bundle.enterpriseMetadata.aiTokenEstimate,
      createdAt: now,
    });
    this.esgOffsetRepository.create({
      requestId: context.requestId,
      sagaId: context.sagaId,
      provider: bundle.esgOffsetReport.provider,
      estimatedCo2Grams: bundle.esgOffsetReport.estimatedCo2Grams,
      offsetPurchasedGrams: bundle.esgOffsetReport.offsetPurchasedGrams,
      certificateId: bundle.esgOffsetReport.certificateId,
      createdAt: now,
    });
    this.moatRepository.create({
      requestId: context.requestId,
      sagaId: context.sagaId,
      strategy: request.moatScore.strategy,
      score: bundle.moatAssessment.score,
      quartile: bundle.moatAssessment.quartile,
      dimensions: bundle.moatAssessment.dimensions,
      createdAt: now,
    });

    this.metricsRepository.increment("ai_enrichment_total");
    this.metricsRepository.increment("esg_offset_total");
    this.metricsRepository.increment("moat_assessment_total");
    this.metricsRepository.increment(
      "esg_offset_grams_total",
      bundle.esgOffsetReport.offsetPurchasedGrams
    );
    this.metricsRepository.increment(
      `sentiment_${this.sentimentBucket(bundle.enterpriseMetadata.genAiSentimentScore)}_total`
    );
    if (!request.aiEnhancement.enabled) {
      this.metricsRepository.increment("ai_enrichment_disabled_total");
    }
    if (!request.esgOffset.enabled) {
      this.metricsRepository.increment("esg_offset_disabled_total");
    }
    if (!request.moatScore.enabled) {
      this.metricsRepository.increment("moat_assessment_disabled_total");
    }
  }

  private computeSentimentScore(
    aiResult: AiEnhancementResult,
    request: OrchestrateRequest
  ): number {
    const riskPenalty = request.governance.riskClass === "high" ? 15 : 0;
    const adjusted = Math.max(
      0,
      Math.min(100, aiResult.sentimentScore - riskPenalty)
    );
    return adjusted;
  }

  private sentimentBucket(score: number): "low" | "mid" | "high" {
    if (score >= 67) {
      return "high";
    }
    if (score >= 34) {
      return "mid";
    }
    return "low";
  }
}
