import type { MoatAssessment, OrchestrateRequest } from "../contracts/v2.js";
import { canonicalStringify, hashString } from "../utils/hash.js";

export interface MoatScoringInput {
  requestId: string;
  sagaId: string;
  strategy: OrchestrateRequest["moatScore"]["strategy"];
  includeArchitectureTheater: boolean;
  minimumViableMoat: number;
  eventVolume: number;
  enabled: boolean;
}

export interface MoatScoringResult {
  assessment: MoatAssessment;
}

function toQuartile(score: number): MoatAssessment["quartile"] {
  if (score >= 75) {
    return "Q1";
  }
  if (score >= 50) {
    return "Q2";
  }
  if (score >= 25) {
    return "Q3";
  }
  return "Q4";
}

export class MoatScoringEngine {
  public assess(input: MoatScoringInput): MoatScoringResult {
    if (!input.enabled) {
      return {
        assessment: {
          score: 0,
          quartile: "Q4",
          dimensions: {
            narrative: 0,
            complexity: 0,
            defensibility: 0,
          },
        },
      };
    }

    const fingerprint = hashString(
      canonicalStringify({
        requestId: input.requestId,
        sagaId: input.sagaId,
        strategy: input.strategy,
        includeArchitectureTheater: input.includeArchitectureTheater,
        minimumViableMoat: input.minimumViableMoat,
        eventVolume: input.eventVolume,
      })
    );
    const signal = parseInt(fingerprint.slice(0, 8), 16);
    const complexityBoost = input.includeArchitectureTheater ? 18 : 4;
    const strategyBias = input.strategy === "complexity-max" ? 14 : 7;
    const rawScore =
      (signal % 45) + input.minimumViableMoat + complexityBoost + strategyBias;
    const score = Math.max(0, Math.min(100, rawScore));
    const quartile = toQuartile(score);
    const narrative = Math.max(0, Math.min(100, Math.round(score * 0.9)));
    const complexity = Math.max(0, Math.min(100, Math.round(score * 1.05)));
    const defensibility = Math.max(
      0,
      Math.min(100, Math.round((score + input.eventVolume) * 0.8))
    );

    return {
      assessment: {
        score,
        quartile,
        dimensions: {
          narrative,
          complexity,
          defensibility,
        },
      },
    };
  }
}
