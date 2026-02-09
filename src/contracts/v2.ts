import { z } from "zod";
import { SUPPORTED_LOCALES } from "../constants.js";

export const formalitySchema = z.enum(["casual", "professional", "formal"]);
export type Formality = z.infer<typeof formalitySchema>;

export const policySchema = z.object({
  complianceProfile: z.literal("strict-default"),
  enforceMetadataRules: z.boolean(),
});

export const telemetrySchema = z.object({
  includeTrace: z.boolean(),
  includePolicyDecisions: z.boolean(),
});

export const metadataSchema = z
  .record(
    z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9._-]+$/),
    z.string().min(1).max(256)
  )
  .optional();

export const deliverySchema = z.object({
  idempotencyKey: z.string().min(1).max(128),
  timeoutMs: z.number().int().min(100).max(120_000),
  retryBudget: z.number().int().min(0).max(10),
});

export const traceContextSchema = z.object({
  correlationId: z.string().min(1).max(128),
  causationId: z.string().min(1).max(128).optional(),
});

export const routingSchema = z.object({
  preferredRegion: z.enum(["us-east-1", "eu-west-1"]),
  fallbackRegions: z.array(z.string().min(1).max(32)).max(5),
});

export const sagaSchema = z.object({
  mode: z.literal("always-on"),
  compensationPolicy: z.literal("strict-revert"),
  persistEveryStep: z.literal(true),
});

export const chaosSchema = z.object({
  profile: z.literal("deterministic"),
  seed: z.string().min(1).max(128).optional(),
  partitionSimulation: z.boolean(),
  latencyJitterMs: z.number().int().min(0).max(2_000),
});

export const governanceSchema = z.object({
  changeTicket: z.string().min(1).max(64),
  riskClass: z.enum(["low", "medium", "high"]),
});

const aiEnhancementDefaults = {
  enabled: true,
  profile: "investor-friendly" as const,
  personalizationDepth: 2 as const,
};

export const aiEnhancementSchema = z
  .object({
    enabled: z.boolean(),
    profile: z.enum(["investor-friendly", "board-ready", "earnings-call"]),
    personalizationDepth: z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
    ]),
    seed: z.string().min(1).max(128).optional(),
  })
  .partial()
  .optional()
  .transform((value) => {
    return {
      enabled: value?.enabled ?? aiEnhancementDefaults.enabled,
      profile: value?.profile ?? aiEnhancementDefaults.profile,
      personalizationDepth:
        value?.personalizationDepth ??
        aiEnhancementDefaults.personalizationDepth,
      ...(value?.seed ? { seed: value.seed } : {}),
    };
  });

const esgOffsetDefaults = {
  enabled: true,
  targetNetZero: true,
  provider: "parody-offsets-inc" as const,
};

export const esgOffsetSchema = z
  .object({
    enabled: z.boolean(),
    targetNetZero: z.boolean(),
    provider: z.literal("parody-offsets-inc"),
    regionIntensityOverride: z.number().min(0).max(2_000).optional(),
  })
  .partial()
  .optional()
  .transform((value) => {
    return {
      enabled: value?.enabled ?? esgOffsetDefaults.enabled,
      targetNetZero: value?.targetNetZero ?? esgOffsetDefaults.targetNetZero,
      provider: value?.provider ?? esgOffsetDefaults.provider,
      ...(value?.regionIntensityOverride !== undefined
        ? { regionIntensityOverride: value.regionIntensityOverride }
        : {}),
    };
  });

const moatScoreDefaults = {
  enabled: true,
  strategy: "narrative-weighted" as const,
  includeArchitectureTheater: true,
  minimumViableMoat: 42,
};

export const moatScoreSchema = z
  .object({
    enabled: z.boolean(),
    strategy: z.enum(["narrative-weighted", "complexity-max"]),
    includeArchitectureTheater: z.boolean(),
    minimumViableMoat: z.number().int().min(0).max(100),
  })
  .partial()
  .optional()
  .transform((value) => {
    return {
      enabled: value?.enabled ?? moatScoreDefaults.enabled,
      strategy: value?.strategy ?? moatScoreDefaults.strategy,
      includeArchitectureTheater:
        value?.includeArchitectureTheater ??
        moatScoreDefaults.includeArchitectureTheater,
      minimumViableMoat:
        value?.minimumViableMoat ?? moatScoreDefaults.minimumViableMoat,
    };
  });

export const orchestrateRequestSchema = z.object({
  requestId: z.string().min(1).max(128).optional(),
  recipient: z.string().min(1).max(256),
  formality: formalitySchema,
  locale: z.string().refine((value) => {
    return (SUPPORTED_LOCALES as readonly string[]).includes(value);
  }, "Locale is not supported by strict-default policy"),
  includeTimestamp: z.boolean(),
  metadata: metadataSchema,
  policies: policySchema,
  telemetry: telemetrySchema,
  delivery: deliverySchema,
  traceContext: traceContextSchema,
  routing: routingSchema,
  saga: sagaSchema,
  chaos: chaosSchema,
  governance: governanceSchema,
  aiEnhancement: aiEnhancementSchema,
  esgOffset: esgOffsetSchema,
  moatScore: moatScoreSchema,
});

export type OrchestrateRequest = z.infer<typeof orchestrateRequestSchema>;

export interface PolicyOutcome {
  outcome: "allowed" | "denied";
  decisions: string[];
}

export interface StepResult {
  step: string;
  status: "completed" | "compensated" | "failed";
  message: string;
}

export interface SagaExecution {
  sagaId: string;
  status: "completed" | "compensated" | "failed";
  steps: StepResult[];
}

export interface ChaosDecision {
  step: string;
  deterministicKey: string;
  simulatedLatencyMs: number;
  injectedFaults: string[];
  timeoutTriggered: boolean;
  partitionTriggered: boolean;
}

export interface SagaEvent {
  timestamp: string;
  sagaId: string;
  requestId: string;
  traceId: string;
  step: string;
  eventType:
    | "step.completed"
    | "step.failed"
    | "step.compensated"
    | "saga.completed"
    | "saga.compensated"
    | "saga.failed";
  payload?: Record<string, unknown>;
}

export interface IncidentRecord {
  id: string;
  createdAt: string;
  severity: "sev-3" | "sev-2" | "sev-1";
  title: string;
  details: string;
}

export interface ReplayResult {
  projectionVersion: number;
  replayCheckpoint: number;
  replayDurationMs: number;
  checksum: string;
  counters: Record<string, number>;
}

export interface AiEnhancementReport {
  enhancedGreeting: string;
  profile: string;
  promptFingerprint: string;
  modelId: "deterministic-faux-llm-v1";
}

export interface EsgOffsetReport {
  estimatedCo2Grams: number;
  offsetPurchasedGrams: number;
  certificateId: string;
  provider: string;
}

export interface MoatAssessment {
  score: number;
  quartile: "Q1" | "Q2" | "Q3" | "Q4";
  dimensions: Record<string, number>;
}

export interface EnterpriseMetadata {
  genAiSentimentScore: number;
  aiModelId: string;
  aiPromptFingerprint: string;
  aiTokenEstimate: number;
  esgEstimatedCo2Grams: number;
  esgOffsetPurchasedGrams: number;
  esgCertificateId: string;
  moatScore: number;
  moatQuartile: "Q1" | "Q2" | "Q3" | "Q4";
}

export interface SuccessResponse {
  requestId: string;
  traceId: string;
  deliveryStatus: "processed" | "deduplicated";
  greeting: {
    rendered: string;
    edition: string;
    locale: string;
    formality: Formality;
    timestamp?: string;
  };
  policy: PolicyOutcome;
  audit: {
    eventCount: number;
    storedIn: "sqlite+memory";
  };
  metrics: {
    counters: Record<string, number>;
  };
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
  durability: {
    eventLogOffset: number;
    projectionVersion: number;
    replayable: true;
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
    created: boolean;
    id?: string;
    severity?: "sev-3" | "sev-2" | "sev-1";
  };
}

export interface ErrorEnvelope {
  requestId?: string;
  traceId?: string;
  deliveryStatus?: "processed" | "deduplicated";
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type OrchestratorResult = SuccessResponse | ErrorEnvelope;
