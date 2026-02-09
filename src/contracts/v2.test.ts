import { describe, expect, it } from "vitest";
import { orchestrateRequestSchema } from "./v2.js";

describe("orchestrateRequestSchema", () => {
  it("parses valid payloads", () => {
    const parsed = orchestrateRequestSchema.safeParse({
      recipient: "World",
      formality: "professional",
      locale: "en-US",
      includeTimestamp: true,
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

    expect(parsed.success).toBe(true);
  });

  it("rejects unsupported locales", () => {
    const parsed = orchestrateRequestSchema.safeParse({
      recipient: "World",
      formality: "professional",
      locale: "fr-FR",
      includeTimestamp: true,
      policies: {
        complianceProfile: "strict-default",
        enforceMetadataRules: true,
      },
      telemetry: {
        includeTrace: true,
        includePolicyDecisions: true,
      },
    });

    expect(parsed.success).toBe(false);
  });
});
