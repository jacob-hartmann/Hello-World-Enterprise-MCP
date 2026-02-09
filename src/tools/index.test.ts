import { describe, expect, it } from "vitest";
import { composeApplication } from "../application/composition-root.js";
import { ORCHESTRATOR_TOOL_NAME } from "../constants.js";
import { registerTools } from "./index.js";
import { createToolTestContext } from "./__test-helpers__/tool-test-utils.js";

function extractFirstContentText(result: Record<string, unknown>): string {
  const content = result["content"];
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error("Tool result does not contain content");
  }

  const first = content[0];
  if (
    typeof first !== "object" ||
    first === null ||
    !("text" in first) ||
    typeof (first as { text?: unknown }).text !== "string"
  ) {
    throw new Error("Tool content does not include a text field");
  }

  return (first as { text: string }).text;
}

describe("registerTools (v2)", () => {
  it("registers only the v2 orchestrator tool", () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server, composeApplication());
    expect(Array.from(ctx.tools.keys())).toEqual([ORCHESTRATOR_TOOL_NAME]);
  });

  it("returns a structured success payload for valid requests", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server, composeApplication());

    const result = await ctx.callTool(ORCHESTRATOR_TOOL_NAME, {
      recipient: "Enterprise Architect",
      formality: "formal",
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
        department: "Engineering",
      },
    });

    const payload = JSON.parse(extractFirstContentText(result)) as {
      requestId: string;
      traceId: string;
      greeting: { rendered: string; timestamp?: string };
      policy: { outcome: string; decisions: string[] };
      audit: { eventCount: number; storedIn: string };
      metrics: { counters: Record<string, number> };
    };

    expect(payload.requestId.length).toBeGreaterThan(0);
    expect(payload.traceId.length).toBeGreaterThan(0);
    expect(payload.greeting.rendered).toBe("Greetings, Enterprise Architect");
    expect(payload.greeting.timestamp).toMatch(/Z$/);
    expect(payload.policy.outcome).toBe("allowed");
    expect(payload.policy.decisions.length).toBeGreaterThan(0);
    expect(payload.audit.storedIn).toBe("in-memory");
    expect(payload.audit.eventCount).toBeGreaterThan(0);
    expect(payload.metrics.counters["requests_total"]).toBe(1);
  });

  it("returns fail-closed error envelope for policy-denied requests", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server, composeApplication());
    const metadata: Record<string, string> = {};
    for (let i = 0; i < 17; i += 1) {
      metadata[`key_${i}`] = "value";
    }

    const result = await ctx.callTool(ORCHESTRATOR_TOOL_NAME, {
      recipient: "World",
      formality: "casual",
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
      metadata,
    });

    const payload = JSON.parse(extractFirstContentText(result)) as {
      error?: {
        code: string;
        message: string;
        details?: { decisions?: string[] };
      };
    };

    expect(payload.error?.code).toBe("POLICY_DENIED");
    expect(payload.error?.message).toContain("strict-default");
  });
});
