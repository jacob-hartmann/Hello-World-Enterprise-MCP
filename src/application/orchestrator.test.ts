import { describe, expect, it } from "vitest";
import {
  CasualGreetingStrategy,
  FormalGreetingStrategy,
  ProfessionalGreetingStrategy,
} from "../domain/greeting-strategies.js";
import { PolicyEngine } from "../domain/policy-engine.js";
import { GreetingStrategyFactory } from "../domain/strategy-factory.js";
import { EventBus } from "../infrastructure/events/event-bus.js";
import { AuditRepository } from "../infrastructure/repositories/audit-repository.js";
import { MetricsRepository } from "../infrastructure/repositories/metrics-repository.js";
import { GreetingOrchestrator } from "./orchestrator.js";

function createOrchestrator(): {
  orchestrator: GreetingOrchestrator;
  auditRepository: AuditRepository;
  metricsRepository: MetricsRepository;
} {
  const eventBus = new EventBus();
  const auditRepository = new AuditRepository();
  const metricsRepository = new MetricsRepository();
  eventBus.subscribe("*", (event) => {
    auditRepository.append(event);
  });

  const orchestrator = new GreetingOrchestrator(
    new GreetingStrategyFactory([
      new CasualGreetingStrategy(),
      new ProfessionalGreetingStrategy(),
      new FormalGreetingStrategy(),
    ]),
    new PolicyEngine(),
    eventBus,
    auditRepository,
    metricsRepository
  );

  return { orchestrator, auditRepository, metricsRepository };
}

describe("GreetingOrchestrator", () => {
  it("executes successful workflow", () => {
    const { orchestrator } = createOrchestrator();
    const result = orchestrator.execute({
      recipient: "World",
      formality: "professional",
      locale: "en-US",
      includeTimestamp: false,
      policies: {
        complianceProfile: "strict-default",
        enforceMetadataRules: true,
      },
      telemetry: {
        includeTrace: true,
        includePolicyDecisions: true,
      },
      metadata: {
        team: "platform",
      },
    });

    if ("error" in result) {
      throw new Error("Expected success response");
    }

    expect(result.greeting.rendered).toBe("Hello, World");
    expect(result.policy.outcome).toBe("allowed");
    expect(result.metrics.counters["requests_total"]).toBe(1);
    expect(result.audit.eventCount).toBeGreaterThan(0);
  });

  it("fails closed for unsupported locale", () => {
    const { orchestrator, metricsRepository, auditRepository } =
      createOrchestrator();
    const result = orchestrator.execute({
      recipient: "World",
      formality: "professional",
      locale: "de-DE",
      includeTimestamp: false,
      policies: {
        complianceProfile: "strict-default",
        enforceMetadataRules: true,
      },
      telemetry: {
        includeTrace: true,
        includePolicyDecisions: true,
      },
    });

    expect("error" in result).toBe(true);
    if (!("error" in result)) {
      throw new Error("Expected error response");
    }

    expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(
      metricsRepository.snapshot().counters["outcome_validation_error_total"]
    ).toBe(1);
    expect(auditRepository.count()).toBeGreaterThan(0);
  });
});
