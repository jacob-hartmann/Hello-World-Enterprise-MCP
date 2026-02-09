import type {
  AiEnhancementReport,
  OrchestrateRequest,
} from "../contracts/v2.js";
import { canonicalStringify, hashString } from "../utils/hash.js";

export const DETERMINISTIC_FAUX_LLM_MODEL_ID = "deterministic-faux-llm-v1";

export interface AiEnhancementInput {
  requestId: string;
  traceId: string;
  recipient: string;
  baseGreeting: string;
  profile: OrchestrateRequest["aiEnhancement"]["profile"];
  personalizationDepth: OrchestrateRequest["aiEnhancement"]["personalizationDepth"];
  enabled: boolean;
  seed?: string;
}

export interface AiEnhancementResult {
  report: AiEnhancementReport;
  sentimentScore: number;
  tokenEstimate: number;
}

const VALUE_WORDS = [
  "synergy",
  "resilience",
  "optionality",
  "governance",
  "leverage",
  "alpha",
] as const;

export class AiEnhancementEngine {
  public enhance(input: AiEnhancementInput): AiEnhancementResult {
    if (!input.enabled) {
      return {
        report: {
          enhancedGreeting: `${input.baseGreeting} [ai-enhancement:disabled]`,
          profile: "disabled",
          promptFingerprint: "disabled",
          modelId: DETERMINISTIC_FAUX_LLM_MODEL_ID,
        },
        sentimentScore: 0,
        tokenEstimate: 0,
      };
    }

    const fingerprint = hashString(
      canonicalStringify({
        requestId: input.requestId,
        traceId: input.traceId,
        recipient: input.recipient,
        baseGreeting: input.baseGreeting,
        profile: input.profile,
        personalizationDepth: input.personalizationDepth,
        seed: input.seed ?? "default-seed",
      })
    );

    const signal = parseInt(fingerprint.slice(0, 8), 16);
    const emphasis = VALUE_WORDS[signal % VALUE_WORDS.length] ?? "synergy";
    const suffixParts = Array.from({ length: input.personalizationDepth }).map(
      (_, idx) => {
        const word =
          VALUE_WORDS[(signal + idx) % VALUE_WORDS.length] ?? "resilience";
        return `${word}-${idx + 1}`;
      }
    );
    const suffix = suffixParts.join(", ");
    const enhancedGreeting =
      suffix.length > 0
        ? `${input.baseGreeting}. Strategic emphasis: ${emphasis}. Signals: ${suffix}.`
        : `${input.baseGreeting}. Strategic emphasis: ${emphasis}.`;

    const sentimentScore = signal % 101;
    const tokenEstimate = Math.max(12, Math.ceil(enhancedGreeting.length / 5));

    return {
      report: {
        enhancedGreeting,
        profile: input.profile,
        promptFingerprint: fingerprint,
        modelId: DETERMINISTIC_FAUX_LLM_MODEL_ID,
      },
      sentimentScore,
      tokenEstimate,
    };
  }
}
