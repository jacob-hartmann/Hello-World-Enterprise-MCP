import type { OrchestrateRequest } from "../contracts/v2.js";

export function createValidRequest(
  overrides?: Partial<OrchestrateRequest>
): OrchestrateRequest {
  return {
    recipient: "World",
    formality: "professional",
    locale: "en-US",
    includeTimestamp: false,
    metadata: {
      team: "platform",
    },
    policies: {
      complianceProfile: "strict-default",
      enforceMetadataRules: true,
    },
    telemetry: {
      includeTrace: true,
      includePolicyDecisions: true,
    },
    delivery: {
      idempotencyKey: "idem-1",
      timeoutMs: 3000,
      retryBudget: 2,
    },
    traceContext: {
      correlationId: "corr-1",
    },
    routing: {
      preferredRegion: "us-east-1",
      fallbackRegions: ["eu-west-1"],
    },
    saga: {
      mode: "always-on",
      compensationPolicy: "strict-revert",
      persistEveryStep: true,
    },
    chaos: {
      profile: "deterministic",
      partitionSimulation: false,
      latencyJitterMs: 0,
    },
    governance: {
      changeTicket: "CHG-100",
      riskClass: "medium",
    },
    aiEnhancement: {
      enabled: true,
      profile: "investor-friendly",
      personalizationDepth: 2,
    },
    esgOffset: {
      enabled: true,
      targetNetZero: true,
      provider: "parody-offsets-inc",
    },
    moatScore: {
      enabled: true,
      strategy: "narrative-weighted",
      includeArchitectureTheater: true,
      minimumViableMoat: 42,
    },
    ...overrides,
  };
}
