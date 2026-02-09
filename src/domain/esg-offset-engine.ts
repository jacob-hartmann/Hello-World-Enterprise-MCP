import type { EsgOffsetReport, OrchestrateRequest } from "../contracts/v2.js";
import { canonicalStringify, hashString } from "../utils/hash.js";

const DEFAULT_REGION_INTENSITY: Record<string, number> = {
  "us-east-1": 410,
  "eu-west-1": 220,
};

export interface EsgOffsetInput {
  requestId: string;
  sagaId: string;
  selectedRegion: string;
  greetingLength: number;
  enabled: boolean;
  targetNetZero: boolean;
  provider: OrchestrateRequest["esgOffset"]["provider"];
  regionIntensityOverride?: number;
}

export interface EsgOffsetResult {
  report: EsgOffsetReport;
}

export class EsgOffsetEngine {
  public calculate(input: EsgOffsetInput): EsgOffsetResult {
    if (!input.enabled) {
      return {
        report: {
          estimatedCo2Grams: 0,
          offsetPurchasedGrams: 0,
          certificateId: "disabled",
          provider: "disabled",
        },
      };
    }

    const regionIntensity =
      input.regionIntensityOverride ??
      DEFAULT_REGION_INTENSITY[input.selectedRegion] ??
      350;
    const estimatedCo2Grams = Math.round(
      Math.max(1, (input.greetingLength * regionIntensity) / 100)
    );
    const offsetPurchasedGrams = input.targetNetZero
      ? estimatedCo2Grams
      : Math.round(estimatedCo2Grams * 0.5);
    const certificateFingerprint = hashString(
      canonicalStringify({
        requestId: input.requestId,
        sagaId: input.sagaId,
        selectedRegion: input.selectedRegion,
        estimatedCo2Grams,
        offsetPurchasedGrams,
        provider: input.provider,
      })
    );

    return {
      report: {
        estimatedCo2Grams,
        offsetPurchasedGrams,
        certificateId: `esg-${certificateFingerprint.slice(0, 16)}`,
        provider: input.provider,
      },
    };
  }
}
