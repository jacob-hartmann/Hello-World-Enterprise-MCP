import { z } from "zod";
import { SUPPORTED_LOCALES } from "../constants.js";

export const formalitySchema = z.enum(["casual", "professional", "formal"]);

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
});

export type OrchestrateRequest = z.infer<typeof orchestrateRequestSchema>;
export type Formality = z.infer<typeof formalitySchema>;

export interface PolicyOutcome {
  outcome: "allowed" | "denied";
  decisions: string[];
}

export interface SuccessResponse {
  requestId: string;
  traceId: string;
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
    storedIn: "in-memory";
  };
  metrics: {
    counters: Record<string, number>;
  };
}

export interface ErrorEnvelope {
  requestId?: string;
  traceId?: string;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type OrchestratorResult = SuccessResponse | ErrorEnvelope;
