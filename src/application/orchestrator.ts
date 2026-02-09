import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  orchestrateRequestSchema,
  type ErrorEnvelope,
  type OrchestratorResult,
  type OrchestrateRequest,
  type SuccessResponse,
} from "../contracts/v2.js";
import type { EventBus } from "../infrastructure/events/event-bus.js";
import type { AuditRepository } from "../infrastructure/repositories/audit-repository.js";
import type { EventLogRepository } from "../infrastructure/repositories/event-log-repository.js";
import type { IdempotencyRepository } from "../infrastructure/repositories/idempotency-repository.js";
import type { MetricsRepository } from "../infrastructure/repositories/metrics-repository.js";
import type { ProjectionReplayService } from "./projection-replay-service.js";
import type { SagaEngine } from "./saga-engine.js";
import { canonicalStringify, hashString } from "../utils/hash.js";

interface StageContext {
  requestId: string;
  traceId: string;
  startedAtMs: number;
}

export class GreetingOrchestrator {
  public constructor(
    private readonly sagaEngine: SagaEngine,
    private readonly eventBus: EventBus,
    private readonly auditRepository: AuditRepository,
    private readonly eventLogRepository: EventLogRepository,
    private readonly idempotencyRepository: IdempotencyRepository,
    private readonly metricsRepository: MetricsRepository,
    private readonly projectionReplayService: ProjectionReplayService
  ) {}

  public execute(rawInput: unknown): OrchestratorResult {
    const context = this.createContext(rawInput);
    this.publishEvent("request.received", context);
    this.metricsRepository.increment("requests_total");

    const request = this.requestValidationStage(rawInput);
    if ("error" in request) {
      this.metricsStage("validation_error", context.startedAtMs);
      return this.fail(
        context,
        request.error.code,
        request.error.message,
        request.error.details
      );
    }

    const requestHash = hashString(canonicalStringify(request));
    const existing = this.idempotencyRepository.find(
      request.delivery.idempotencyKey
    );
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return this.fail(
          context,
          "IDEMPOTENCY_CONFLICT",
          "Idempotency key reuse detected with mismatched payload",
          {
            idempotencyKey: request.delivery.idempotencyKey,
          },
          "deduplicated"
        );
      }

      const replayed = JSON.parse(existing.responseJson) as OrchestratorResult;
      if ("error" in replayed) {
        return {
          ...replayed,
          deliveryStatus: "deduplicated",
        };
      }

      return {
        ...replayed,
        deliveryStatus: "deduplicated",
      };
    }

    this.publishEvent("request.validated", context);
    const saga = this.sagaEngine.run(request, {
      requestId: context.requestId,
      traceId: context.traceId,
    });

    const projectionSnapshot = this.projectionReplayService.snapshot();
    const baseResponse = this.buildResponse(
      context,
      request,
      saga,
      projectionSnapshot.projectionVersion
    );

    this.idempotencyRepository.save(
      request.delivery.idempotencyKey,
      requestHash,
      JSON.stringify(baseResponse)
    );

    this.metricsStage(
      "error" in baseResponse ? "denied" : "success",
      context.startedAtMs
    );
    this.publishEvent("response.generated", context, {
      outcome: "error" in baseResponse ? "error" : "success",
    });

    return baseResponse;
  }

  private buildResponse(
    context: StageContext,
    request: OrchestrateRequest,
    saga: ReturnType<SagaEngine["run"]>,
    projectionVersion: number
  ): OrchestratorResult {
    const eventLogOffset = this.eventLogRepository.latestOffset();
    const commonDurability = {
      eventLogOffset,
      projectionVersion,
      replayable: true as const,
    };

    if (saga.kind === "failure") {
      this.metricsRepository.increment("policy_denied_total");
      return {
        requestId: context.requestId,
        traceId: context.traceId,
        deliveryStatus: "processed",
        error: {
          code: saga.code,
          message: saga.message,
          details: {
            ...saga.details,
            sagaExecution: saga.sagaExecution,
            routingDecision: saga.routingDecision,
            chaosReport: saga.chaosReport,
            durability: commonDurability,
            runbook: saga.runbook,
            aiEnhancementReport: saga.aiEnhancementReport,
            esgOffsetReport: saga.esgOffsetReport,
            moatAssessment: saga.moatAssessment,
            enterpriseMetadata: saga.enterpriseMetadata,
            incident: saga.incident,
          },
        },
      };
    }

    const response: SuccessResponse = {
      requestId: context.requestId,
      traceId: request.telemetry.includeTrace ? context.traceId : "suppressed",
      deliveryStatus: "processed",
      greeting: saga.greeting,
      policy: {
        outcome: saga.policy.outcome,
        decisions: request.telemetry.includePolicyDecisions
          ? saga.policy.decisions
          : [],
      },
      audit: {
        eventCount: this.auditRepository.count(),
        storedIn: "sqlite+memory",
      },
      metrics: this.metricsRepository.snapshot(),
      sagaExecution: saga.sagaExecution,
      routingDecision: saga.routingDecision,
      chaosReport: saga.chaosReport,
      durability: commonDurability,
      runbook: saga.runbook,
      aiEnhancementReport: saga.aiEnhancementReport,
      esgOffsetReport: saga.esgOffsetReport,
      moatAssessment: saga.moatAssessment,
      enterpriseMetadata: saga.enterpriseMetadata,
      incident: saga.incident,
    };
    return response;
  }

  private createContext(rawInput: unknown): StageContext {
    const requestedId = this.extractRequestId(rawInput);
    return {
      requestId: requestedId ?? randomUUID(),
      traceId: randomUUID(),
      startedAtMs: performance.now(),
    };
  }

  private extractRequestId(rawInput: unknown): string | undefined {
    if (
      typeof rawInput === "object" &&
      rawInput !== null &&
      "requestId" in rawInput &&
      typeof rawInput.requestId === "string" &&
      rawInput.requestId.length > 0
    ) {
      return rawInput.requestId;
    }

    return undefined;
  }

  private requestValidationStage(
    rawInput: unknown
  ): OrchestrateRequest | { error: ErrorEnvelope["error"] } {
    const parsed = orchestrateRequestSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => {
        return {
          path: issue.path.join("."),
          message: issue.message,
        };
      });
      return {
        error: {
          code: "VALIDATION_FAILED",
          message: "Request payload failed schema validation",
          details: {
            issues,
          },
        },
      };
    }

    return parsed.data;
  }

  private metricsStage(
    outcome: "success" | "validation_error" | "denied",
    startedAtMs: number
  ): void {
    this.metricsRepository.increment(`outcome_${outcome}_total`);
    const elapsedMs = Math.round(performance.now() - startedAtMs);
    this.metricsRepository.increment("latency_ms_total", elapsedMs);
  }

  private publishEvent(
    name:
      | "request.received"
      | "request.validated"
      | "policy.allowed"
      | "policy.denied"
      | "response.generated"
      | "response.failed",
    context: StageContext,
    details?: Record<string, unknown>
  ): void {
    this.eventBus.publish({
      name,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      traceId: context.traceId,
      ...(details ? { details } : {}),
    });
  }

  private fail(
    context: StageContext,
    code: string,
    message: string,
    details?: Record<string, unknown>,
    deliveryStatus: "processed" | "deduplicated" = "processed"
  ): ErrorEnvelope {
    this.publishEvent("response.failed", context, {
      code,
    });
    const error = {
      code,
      message,
      ...(details ? { details } : {}),
    };

    return {
      requestId: context.requestId,
      traceId: context.traceId,
      deliveryStatus,
      error,
    };
  }
}
