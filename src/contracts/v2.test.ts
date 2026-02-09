import { describe, expect, it } from "vitest";
import { createValidRequest } from "../__test-helpers__/request-factory.js";
import { orchestrateRequestSchema } from "./v2.js";

describe("orchestrateRequestSchema", () => {
  it("parses valid payloads with v3 enterprise envelope", () => {
    const parsed = orchestrateRequestSchema.safeParse(createValidRequest());

    expect(parsed.success).toBe(true);
  });

  it("rejects unsupported locales", () => {
    const parsed = orchestrateRequestSchema.safeParse(
      createValidRequest({
        locale: "fr-FR",
      })
    );

    expect(parsed.success).toBe(false);
  });

  it("rejects payloads missing new delivery envelope", () => {
    const request = createValidRequest();
    const { delivery: _delivery, ...withoutDelivery } = request;
    const parsed = orchestrateRequestSchema.safeParse(withoutDelivery);
    expect(parsed.success).toBe(false);
  });

  it("defaults enrichment envelopes when omitted", () => {
    const request = createValidRequest();
    const {
      aiEnhancement: _aiEnhancement,
      esgOffset: _esgOffset,
      moatScore: _moatScore,
      ...withoutEnrichment
    } = request;
    const parsed = orchestrateRequestSchema.safeParse(withoutEnrichment);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error("Expected schema parse to succeed");
    }
    expect(parsed.data.aiEnhancement.enabled).toBe(true);
    expect(parsed.data.aiEnhancement.profile).toBe("investor-friendly");
    expect(parsed.data.esgOffset.provider).toBe("parody-offsets-inc");
    expect(parsed.data.moatScore.minimumViableMoat).toBe(42);
  });
});
