import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { ENTERPRISE_GREETING } from "../constants.js";
import {
  orchestrateRequestSchema,
  type ErrorEnvelope,
  type OrchestratorResult,
  type OrchestrateRequest,
  type SuccessResponse,
} from "../contracts/v2.js";
import type { PolicyEngine } from "../domain/policy-engine.js";
import type { GreetingStrategyFactory } from "../domain/strategy-factory.js";
import type {
  EventBus,
  WorkflowEvent,
} from "../infrastructure/events/event-bus.js";
import type { AuditRepository } from "../infrastructure/repositories/audit-repository.js";
import type { MetricsRepository } from "../infrastructure/repositories/metrics-repository.js";

interface StageContext {
  requestId: string;
  traceId: string;
  startedAtMs: number;
}

export class GreetingOrchestrator {
  public constructor(
    private readonly strategyFactory: GreetingStrategyFactory,
    private readonly policyEngine: PolicyEngine,
    private readonly eventBus: EventBus,
    private readonly auditRepository: AuditRepository,
    private readonly metricsRepository: MetricsRepository
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

    this.publishEvent("request.validated", context);

    const policy = this.policyEnforcementStage(request);
    if (policy.outcome === "denied") {
      this.metricsRepository.increment("policy_denied_total");
      this.metricsStage("denied", context.startedAtMs);
      this.publishEvent("policy.denied", context, {
        decisions: policy.decisions,
      });
      return this.fail(
        context,
        "POLICY_DENIED",
        "Request rejected by strict-default policy",
        {
          decisions: policy.decisions,
        }
      );
    }

    this.publishEvent("policy.allowed", context, {
      decisions: policy.decisions,
    });

    const greeting = this.greetingGenerationStage(request);
    this.metricsRepository.increment(`formality_${request.formality}_total`);
    this.metricsRepository.increment("success_total");
    this.metricsStage("success", context.startedAtMs);

    const response = this.responseAssemblyStage(
      context,
      request,
      greeting,
      policy.decisions
    );

    this.publishEvent("response.generated", context, {
      formality: request.formality,
    });

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

  private policyEnforcementStage(request: OrchestrateRequest): {
    outcome: "allowed" | "denied";
    decisions: string[];
  } {
    return this.policyEngine.evaluate(request);
  }

  private greetingGenerationStage(request: OrchestrateRequest): string {
    return this.strategyFactory
      .resolve(request.formality)
      .render(request.recipient);
  }

  private metricsStage(
    outcome: "success" | "denied" | "validation_error",
    startedAtMs: number
  ): void {
    this.metricsRepository.increment(`outcome_${outcome}_total`);
    const elapsedMs = Math.round(performance.now() - startedAtMs);
    this.metricsRepository.increment("latency_ms_total", elapsedMs);
  }

  private responseAssemblyStage(
    context: StageContext,
    request: OrchestrateRequest,
    renderedGreeting: string,
    policyDecisions: string[]
  ): SuccessResponse {
    const greeting = {
      rendered: renderedGreeting,
      edition: ENTERPRISE_GREETING,
      locale: request.locale,
      formality: request.formality,
      ...(request.includeTimestamp
        ? { timestamp: new Date().toISOString() }
        : {}),
    };

    return {
      requestId: context.requestId,
      traceId: request.telemetry.includeTrace ? context.traceId : "suppressed",
      greeting,
      policy: {
        outcome: "allowed",
        decisions: request.telemetry.includePolicyDecisions
          ? policyDecisions
          : [],
      },
      audit: {
        eventCount: this.auditStage(),
        storedIn: "in-memory",
      },
      metrics: this.metricsRepository.snapshot(),
    };
  }

  private auditStage(): number {
    return this.auditRepository.count();
  }

  private publishEvent(
    name: WorkflowEvent["name"],
    context: StageContext,
    details?: Record<string, unknown>
  ): void {
    const event: WorkflowEvent = {
      name,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      traceId: context.traceId,
      ...(details ? { details } : {}),
    };
    this.eventBus.publish(event);
  }

  private fail(
    context: StageContext,
    code: string,
    message: string,
    details?: Record<string, unknown>
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
      error,
    };
  }
}
