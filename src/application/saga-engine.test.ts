import { describe, expect, it } from "vitest";
import { createValidRequest } from "../__test-helpers__/request-factory.js";
import {
  CasualGreetingStrategy,
  FormalGreetingStrategy,
  ProfessionalGreetingStrategy,
} from "../domain/greeting-strategies.js";
import { PolicyEngine } from "../domain/policy-engine.js";
import { GreetingStrategyFactory } from "../domain/strategy-factory.js";
import { AiEnhancementEngine } from "../domain/ai-enhancement-engine.js";
import { EsgOffsetEngine } from "../domain/esg-offset-engine.js";
import { MoatScoringEngine } from "../domain/moat-scoring-engine.js";
import { RunbookGenerationEngine } from "../domain/runbook-generation-engine.js";
import { AiEnrichmentRepository } from "../infrastructure/repositories/ai-enrichment-repository.js";
import { EventLogRepository } from "../infrastructure/repositories/event-log-repository.js";
import { EsgOffsetRepository } from "../infrastructure/repositories/esg-offset-repository.js";
import { IncidentRepository } from "../infrastructure/repositories/incident-repository.js";
import { MetricsRepository } from "../infrastructure/repositories/metrics-repository.js";
import { MoatRepository } from "../infrastructure/repositories/moat-repository.js";
import { RunbookRepository } from "../infrastructure/repositories/runbook-repository.js";
import { RunbookGenerationRepository } from "../infrastructure/repositories/runbook-generation-repository.js";
import { SagaRepository } from "../infrastructure/repositories/saga-repository.js";
import { EnterpriseDatabase } from "../infrastructure/sqlite/database.js";
import { ChaosEngine } from "./chaos-engine.js";
import { CompensationEngine } from "./compensation-engine.js";
import { EnterpriseEnrichmentPipeline } from "./enterprise-enrichment-pipeline.js";
import { OperationsService } from "./operations-service.js";
import { SagaEngine } from "./saga-engine.js";

function createEngine(): {
  engine: SagaEngine;
  metrics: MetricsRepository;
  incidents: IncidentRepository;
} {
  const db = new EnterpriseDatabase(":memory:");
  const metrics = new MetricsRepository();
  const incidents = new IncidentRepository(db.connection());
  const runbookGenerationRepository = new RunbookGenerationRepository(
    db.connection()
  );
  const enrichmentPipeline = new EnterpriseEnrichmentPipeline(
    new AiEnhancementEngine(),
    new EsgOffsetEngine(),
    new MoatScoringEngine(),
    new AiEnrichmentRepository(db.connection()),
    new EsgOffsetRepository(db.connection()),
    new MoatRepository(db.connection()),
    metrics
  );
  const engine = new SagaEngine(
    new GreetingStrategyFactory([
      new CasualGreetingStrategy(),
      new ProfessionalGreetingStrategy(),
      new FormalGreetingStrategy(),
    ]),
    new PolicyEngine(),
    new EventLogRepository(db.connection()),
    new SagaRepository(db.connection()),
    metrics,
    new ChaosEngine(),
    new CompensationEngine(),
    new OperationsService(
      incidents,
      new RunbookRepository(db.connection()),
      runbookGenerationRepository,
      new RunbookGenerationEngine()
    ),
    enrichmentPipeline
  );

  return { engine, metrics, incidents };
}

function findSeedForTimeout(): string {
  const chaos = new ChaosEngine();
  for (let i = 0; i < 5000; i += 1) {
    const seed = `seed-${i}`;
    const decision = chaos.decide({
      seedBase: seed,
      step: "GenerateGreetingStep",
      attempt: 1,
      partitionSimulation: false,
      latencyJitterMs: 0,
    });
    if (decision.timeoutTriggered) {
      return seed;
    }
  }

  return "seed-fallback";
}

describe("SagaEngine", () => {
  it("completes happy path without compensation", () => {
    const { engine } = createEngine();
    const request = createValidRequest({
      delivery: {
        idempotencyKey: "idem-happy",
        timeoutMs: 3000,
        retryBudget: 2,
      },
      chaos: {
        profile: "deterministic",
        seed: "safe-seed",
        partitionSimulation: false,
        latencyJitterMs: 0,
      },
    });
    const result = engine.run(request, { requestId: "r-1", traceId: "t-1" });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") {
      throw new Error("Expected success result");
    }
    expect(result.sagaExecution.status).toBe("completed");
    expect(
      result.sagaExecution.steps.some((s) => s.step === "EnhanceGreetingStep")
    ).toBe(true);
    expect(result.enterpriseMetadata.aiModelId).toBe(
      "deterministic-faux-llm-v1"
    );
    expect(
      result.sagaExecution.steps.some((s) => s.status === "compensated")
    ).toBe(false);
  });

  it("compensates when policy gate fails", () => {
    const { engine, incidents } = createEngine();
    const metadata: Record<string, string> = {};
    for (let i = 0; i < 17; i += 1) {
      metadata[`k${i}`] = "v";
    }
    const request = createValidRequest({
      metadata,
      delivery: {
        idempotencyKey: "idem-policy",
        timeoutMs: 3000,
        retryBudget: 2,
      },
    });
    const result = engine.run(request, { requestId: "r-2", traceId: "t-2" });

    expect(result.kind).toBe("failure");
    if (result.kind !== "failure") {
      throw new Error("Expected failure result");
    }
    expect(result.code).toBe("POLICY_DENIED");
    expect(result.sagaExecution.status).toBe("compensated");
    expect(incidents.count()).toBe(1);
  });

  it("compensates when deterministic chaos timeout occurs", () => {
    const { engine, metrics } = createEngine();
    const seed = findSeedForTimeout();
    const request = createValidRequest({
      delivery: {
        idempotencyKey: "idem-timeout",
        timeoutMs: 3000,
        retryBudget: 2,
      },
      chaos: {
        profile: "deterministic",
        seed,
        partitionSimulation: false,
        latencyJitterMs: 0,
      },
    });
    const result = engine.run(request, { requestId: "r-3", traceId: "t-3" });
    expect(result.kind).toBe("failure");
    if (result.kind !== "failure") {
      throw new Error("Expected failure result");
    }
    expect(result.code).toBe("CHAOS_TIMEOUT");
    expect(metrics.snapshot().counters["saga_compensated_total"]).toBe(1);
  });
});
