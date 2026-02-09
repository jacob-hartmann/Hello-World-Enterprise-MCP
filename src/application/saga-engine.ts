import { randomUUID } from "node:crypto";
import { ENTERPRISE_GREETING } from "../constants.js";
import type {
  AiEnhancementReport,
  EnterpriseMetadata,
  EsgOffsetReport,
  MoatAssessment,
  OrchestrateRequest,
  PolicyOutcome,
  SagaExecution,
  StepResult,
} from "../contracts/v2.js";
import type { PolicyEngine } from "../domain/policy-engine.js";
import type { GreetingStrategyFactory } from "../domain/strategy-factory.js";
import type { EventLogRepository } from "../infrastructure/repositories/event-log-repository.js";
import type { MetricsRepository } from "../infrastructure/repositories/metrics-repository.js";
import type { SagaRepository } from "../infrastructure/repositories/saga-repository.js";
import type { ChaosEngine } from "./chaos-engine.js";
import type { CompensationEngine } from "./compensation-engine.js";
import type {
  EnterpriseEnrichmentPipeline,
  EnrichmentBundle,
} from "./enterprise-enrichment-pipeline.js";
import type { OperationsService } from "./operations-service.js";

export interface SagaRunContext {
  requestId: string;
  traceId: string;
}

export interface SagaRunSuccess {
  kind: "success";
  greeting: {
    rendered: string;
    edition: string;
    locale: string;
    formality: OrchestrateRequest["formality"];
    timestamp?: string;
  };
  policy: PolicyOutcome;
  sagaExecution: SagaExecution;
  routingDecision: {
    selectedRegion: string;
    attempts: number;
    fallbackUsed: boolean;
  };
  chaosReport: {
    injectedFaults: string[];
    deterministicKey: string;
    simulatedLatencyMs: number;
  };
  runbook: {
    id: string;
    title: string;
    actions: string[];
  };
  aiEnhancementReport: AiEnhancementReport;
  esgOffsetReport: EsgOffsetReport;
  moatAssessment: MoatAssessment;
  enterpriseMetadata: EnterpriseMetadata;
  incident: {
    created: false;
  };
}

export interface SagaRunFailure {
  kind: "failure";
  code: string;
  message: string;
  details: Record<string, unknown>;
  sagaExecution: SagaExecution;
  routingDecision: {
    selectedRegion: string;
    attempts: number;
    fallbackUsed: boolean;
  };
  chaosReport: {
    injectedFaults: string[];
    deterministicKey: string;
    simulatedLatencyMs: number;
  };
  runbook: {
    id: string;
    title: string;
    actions: string[];
  };
  aiEnhancementReport: AiEnhancementReport;
  esgOffsetReport: EsgOffsetReport;
  moatAssessment: MoatAssessment;
  enterpriseMetadata: EnterpriseMetadata;
  incident: {
    created: true;
    id: string;
    severity: "sev-3" | "sev-2" | "sev-1";
  };
}

export type SagaRunResult = SagaRunSuccess | SagaRunFailure;

export class SagaEngine {
  public constructor(
    private readonly strategyFactory: GreetingStrategyFactory,
    private readonly policyEngine: PolicyEngine,
    private readonly eventLogRepository: EventLogRepository,
    private readonly sagaRepository: SagaRepository,
    private readonly metricsRepository: MetricsRepository,
    private readonly chaosEngine: ChaosEngine,
    private readonly compensationEngine: CompensationEngine,
    private readonly operationsService: OperationsService,
    private readonly enrichmentPipeline: EnterpriseEnrichmentPipeline
  ) {}

  public run(
    request: OrchestrateRequest,
    context: SagaRunContext
  ): SagaRunResult {
    const sagaId = randomUUID();
    const steps: StepResult[] = [];
    let selectedRegion: string = request.routing.preferredRegion;
    let attempts = 1;
    let fallbackUsed = false;
    let accumulatedLatencyMs = 0;
    const injectedFaults: string[] = [];
    let lastDeterministicKey = "";

    this.sagaRepository.startSaga(
      sagaId,
      context.requestId,
      selectedRegion,
      "running"
    );
    this.writeEvent(context, sagaId, "ValidateRequestStep", "step.completed", {
      changeTicket: request.governance.changeTicket,
      riskClass: request.governance.riskClass,
    });
    steps.push({
      step: "ValidateRequestStep",
      status: "completed",
      message: "Request schema and governance envelope accepted",
    });

    const routeChaos = this.chaosEngine.decide({
      seedBase: request.chaos.seed ?? context.requestId,
      step: "RouteRegionStep",
      attempt: 1,
      partitionSimulation: request.chaos.partitionSimulation,
      latencyJitterMs: request.chaos.latencyJitterMs,
    });
    accumulatedLatencyMs += routeChaos.simulatedLatencyMs;
    injectedFaults.push(...routeChaos.injectedFaults);
    lastDeterministicKey = routeChaos.deterministicKey;

    if (
      routeChaos.partitionTriggered &&
      request.routing.fallbackRegions.length > 0
    ) {
      selectedRegion = request.routing.fallbackRegions[0] ?? selectedRegion;
      fallbackUsed = true;
      attempts = 2;
    }
    this.metricsRepository.increment(`region_${selectedRegion}_selected_total`);
    steps.push({
      step: "RouteRegionStep",
      status: "completed",
      message: `Selected region ${selectedRegion}`,
    });
    this.writeEvent(context, sagaId, "RouteRegionStep", "step.completed", {
      selectedRegion,
      fallbackUsed,
      attempts,
    });

    const policy = this.policyEngine.evaluate(request);
    if (policy.outcome === "denied") {
      steps.push({
        step: "PolicyGateStep",
        status: "failed",
        message: policy.decisions.join("; "),
      });
      this.writeEvent(context, sagaId, "PolicyGateStep", "step.failed", {
        decisions: policy.decisions,
      });
      return this.compensateAndFail(
        context,
        sagaId,
        steps,
        selectedRegion,
        attempts,
        fallbackUsed,
        injectedFaults,
        lastDeterministicKey,
        accumulatedLatencyMs,
        "POLICY_DENIED",
        "Request rejected by strict-default policy",
        { decisions: policy.decisions }
      );
    }

    steps.push({
      step: "PolicyGateStep",
      status: "completed",
      message: "Policy checks passed",
    });
    this.writeEvent(context, sagaId, "PolicyGateStep", "step.completed", {
      decisions: policy.decisions,
    });

    const generationChaos = this.chaosEngine.decide({
      seedBase: request.chaos.seed ?? context.requestId,
      step: "GenerateGreetingStep",
      attempt: 1,
      partitionSimulation: false,
      latencyJitterMs: request.chaos.latencyJitterMs,
    });
    accumulatedLatencyMs += generationChaos.simulatedLatencyMs;
    injectedFaults.push(...generationChaos.injectedFaults);
    lastDeterministicKey = generationChaos.deterministicKey;

    if (generationChaos.timeoutTriggered) {
      steps.push({
        step: "GenerateGreetingStep",
        status: "failed",
        message: "Synthetic timeout injected by deterministic chaos engine",
      });
      this.writeEvent(context, sagaId, "GenerateGreetingStep", "step.failed", {
        deterministicKey: generationChaos.deterministicKey,
      });
      return this.compensateAndFail(
        context,
        sagaId,
        steps,
        selectedRegion,
        attempts,
        fallbackUsed,
        injectedFaults,
        lastDeterministicKey,
        accumulatedLatencyMs,
        "CHAOS_TIMEOUT",
        "Deterministic chaos timeout in greeting generation",
        { deterministicKey: generationChaos.deterministicKey }
      );
    }

    const renderedGreeting = this.strategyFactory
      .resolve(request.formality)
      .render(request.recipient);
    steps.push({
      step: "GenerateGreetingStep",
      status: "completed",
      message: "Greeting rendered by formality strategy",
    });
    this.writeEvent(context, sagaId, "GenerateGreetingStep", "step.completed", {
      formality: request.formality,
      recipient: request.recipient,
    });

    let enrichment: EnrichmentBundle;
    try {
      enrichment = this.enrichmentPipeline.run(request, {
        requestId: context.requestId,
        traceId: context.traceId,
        sagaId,
        selectedRegion,
        baseGreeting: renderedGreeting,
        eventVolume: this.eventLogRepository.count(),
      });
    } catch (error: unknown) {
      steps.push({
        step: "EnhanceGreetingStep",
        status: "failed",
        message: "Enrichment pipeline failed before persistence",
      });
      this.writeEvent(context, sagaId, "EnhanceGreetingStep", "step.failed", {
        error: error instanceof Error ? error.message : "unknown-error",
      });
      return this.compensateAndFail(
        context,
        sagaId,
        steps,
        selectedRegion,
        attempts,
        fallbackUsed,
        injectedFaults,
        lastDeterministicKey,
        accumulatedLatencyMs,
        "ENRICHMENT_PIPELINE_FAILED",
        "Enrichment pipeline execution failed",
        {
          stage: "run",
          error: error instanceof Error ? error.message : "unknown-error",
        }
      );
    }

    steps.push({
      step: "EnhanceGreetingStep",
      status: "completed",
      message: "Greeting enhanced by deterministic faux-LLM",
    });
    this.writeEvent(context, sagaId, "EnhanceGreetingStep", "step.completed", {
      promptFingerprint: enrichment.aiEnhancementReport.promptFingerprint,
      profile: enrichment.aiEnhancementReport.profile,
    });

    steps.push({
      step: "ComputeSentimentStep",
      status: "completed",
      message: "Sentiment score calibrated for AI-native observability",
    });
    this.writeEvent(context, sagaId, "ComputeSentimentStep", "step.completed", {
      genAiSentimentScore: enrichment.enterpriseMetadata.genAiSentimentScore,
    });

    steps.push({
      step: "CalculateEsgOffsetStep",
      status: "completed",
      message: "Carbon offset calculations posted to synthetic ledger",
    });
    this.writeEvent(
      context,
      sagaId,
      "CalculateEsgOffsetStep",
      "step.completed",
      {
        certificateId: enrichment.esgOffsetReport.certificateId,
        offsetPurchasedGrams: enrichment.esgOffsetReport.offsetPurchasedGrams,
      }
    );

    steps.push({
      step: "AssessMoatStep",
      status: "completed",
      message: "Moat scoring dimensions computed for diligence theater",
    });
    this.writeEvent(context, sagaId, "AssessMoatStep", "step.completed", {
      score: enrichment.moatAssessment.score,
      quartile: enrichment.moatAssessment.quartile,
    });

    try {
      this.enrichmentPipeline.persistArtifacts(
        request,
        {
          requestId: context.requestId,
          traceId: context.traceId,
          sagaId,
          selectedRegion,
          baseGreeting: renderedGreeting,
          eventVolume: this.eventLogRepository.count(),
        },
        enrichment
      );
    } catch (error: unknown) {
      steps.push({
        step: "PersistEnrichmentArtifactsStep",
        status: "failed",
        message: "Durable enrichment writes failed",
      });
      this.writeEvent(
        context,
        sagaId,
        "PersistEnrichmentArtifactsStep",
        "step.failed",
        {
          error: error instanceof Error ? error.message : "unknown-error",
        }
      );
      return this.compensateAndFail(
        context,
        sagaId,
        steps,
        selectedRegion,
        attempts,
        fallbackUsed,
        injectedFaults,
        lastDeterministicKey,
        accumulatedLatencyMs,
        "ENRICHMENT_PERSIST_FAILED",
        "Failed to persist enrichment artifacts",
        {
          stage: "persist",
          error: error instanceof Error ? error.message : "unknown-error",
          aiPromptFingerprint: enrichment.aiEnhancementReport.promptFingerprint,
        },
        enrichment
      );
    }
    steps.push({
      step: "PersistEnrichmentArtifactsStep",
      status: "completed",
      message: "Enrichment artifacts persisted to durable ledgers",
    });
    this.writeEvent(
      context,
      sagaId,
      "PersistEnrichmentArtifactsStep",
      "step.completed",
      {
        aiFingerprint: enrichment.aiEnhancementReport.promptFingerprint,
        esgCertificateId: enrichment.esgOffsetReport.certificateId,
      }
    );

    steps.push({
      step: "PersistOutcomeStep",
      status: "completed",
      message: "Outcome persisted to event log",
    });
    this.writeEvent(context, sagaId, "PersistOutcomeStep", "step.completed");

    this.metricsRepository.increment("telemetry_published_total");
    steps.push({
      step: "PublishTelemetryStep",
      status: "completed",
      message: "Telemetry counters updated",
    });
    this.writeEvent(context, sagaId, "PublishTelemetryStep", "step.completed");

    this.sagaRepository.updateStatus(sagaId, "completed", selectedRegion);
    this.writeEvent(context, sagaId, "SagaLifecycle", "saga.completed", {
      selectedRegion,
      attempts,
      fallbackUsed,
    });

    const runbook = {
      id: randomUUID(),
      title: "Steady State Runbook",
      actions: [
        "Observe green dashboard and celebrate unnecessary complexity.",
        "Archive audit trail for future architecture review board.",
      ],
    };

    return {
      kind: "success",
      greeting: {
        rendered: enrichment.aiEnhancementReport.enhancedGreeting,
        edition: ENTERPRISE_GREETING,
        locale: request.locale,
        formality: request.formality,
        ...(request.includeTimestamp
          ? { timestamp: new Date().toISOString() }
          : {}),
      },
      policy,
      sagaExecution: {
        sagaId,
        status: "completed",
        steps,
      },
      routingDecision: {
        selectedRegion,
        attempts,
        fallbackUsed,
      },
      chaosReport: {
        injectedFaults,
        deterministicKey: lastDeterministicKey,
        simulatedLatencyMs: accumulatedLatencyMs,
      },
      runbook,
      aiEnhancementReport: enrichment.aiEnhancementReport,
      esgOffsetReport: enrichment.esgOffsetReport,
      moatAssessment: enrichment.moatAssessment,
      enterpriseMetadata: enrichment.enterpriseMetadata,
      incident: {
        created: false,
      },
    };
  }

  private compensateAndFail(
    context: SagaRunContext,
    sagaId: string,
    steps: StepResult[],
    selectedRegion: string,
    attempts: number,
    fallbackUsed: boolean,
    injectedFaults: string[],
    deterministicKey: string,
    accumulatedLatencyMs: number,
    code: string,
    message: string,
    details: Record<string, unknown>,
    enrichment?: EnrichmentBundle
  ): SagaRunFailure {
    const compensationSteps = this.compensationEngine.compensate(steps);
    for (const compensation of compensationSteps) {
      this.writeEvent(context, sagaId, compensation.step, "step.compensated", {
        message: compensation.message,
      });
    }
    steps.push(...compensationSteps);

    this.sagaRepository.updateStatus(sagaId, "compensated", selectedRegion);
    this.writeEvent(context, sagaId, "SagaLifecycle", "saga.compensated", {
      code,
      message,
    });

    this.metricsRepository.increment("saga_compensated_total");
    this.metricsRepository.increment(
      `region_${selectedRegion}_compensated_total`
    );
    this.metricsRepository.increment(
      "chaos_injected_faults_total",
      injectedFaults.length
    );

    const raised = this.operationsService.raiseIncident({
      severity: "sev-2",
      title: `${code} during orchestration`,
      details: message,
      code,
      requestId: context.requestId,
      sagaId,
    });

    return {
      kind: "failure",
      code,
      message,
      details,
      sagaExecution: {
        sagaId,
        status: "compensated",
        steps,
      },
      routingDecision: {
        selectedRegion,
        attempts,
        fallbackUsed,
      },
      chaosReport: {
        injectedFaults,
        deterministicKey,
        simulatedLatencyMs: accumulatedLatencyMs,
      },
      runbook: {
        id: raised.runbook.id,
        title: raised.runbook.title,
        actions: raised.runbook.actions,
      },
      aiEnhancementReport: enrichment?.aiEnhancementReport ?? {
        enhancedGreeting: "enrichment unavailable",
        profile: "unavailable",
        promptFingerprint: "unavailable",
        modelId: "deterministic-faux-llm-v1",
      },
      esgOffsetReport: enrichment?.esgOffsetReport ?? {
        estimatedCo2Grams: 0,
        offsetPurchasedGrams: 0,
        certificateId: "unavailable",
        provider: "unavailable",
      },
      moatAssessment: enrichment?.moatAssessment ?? {
        score: 0,
        quartile: "Q4",
        dimensions: {
          narrative: 0,
          complexity: 0,
          defensibility: 0,
        },
      },
      enterpriseMetadata: enrichment?.enterpriseMetadata ?? {
        genAiSentimentScore: 0,
        aiModelId: "deterministic-faux-llm-v1",
        aiPromptFingerprint: "unavailable",
        aiTokenEstimate: 0,
        esgEstimatedCo2Grams: 0,
        esgOffsetPurchasedGrams: 0,
        esgCertificateId: "unavailable",
        moatScore: 0,
        moatQuartile: "Q4",
      },
      incident: {
        created: true,
        id: raised.incident.id,
        severity: raised.incident.severity,
      },
    };
  }

  private writeEvent(
    context: SagaRunContext,
    sagaId: string,
    step: string,
    eventType:
      | "step.completed"
      | "step.failed"
      | "step.compensated"
      | "saga.completed"
      | "saga.compensated"
      | "saga.failed",
    payload?: Record<string, unknown>
  ): void {
    this.eventLogRepository.append({
      timestamp: new Date().toISOString(),
      sagaId,
      requestId: context.requestId,
      traceId: context.traceId,
      step,
      eventType,
      ...(payload ? { payload } : {}),
    });
  }
}
