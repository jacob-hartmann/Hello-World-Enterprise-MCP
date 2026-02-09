import { describe, expect, it } from "vitest";
import { createValidRequest } from "../__test-helpers__/request-factory.js";
import { composeApplication } from "../application/composition-root.js";
import {
  INCIDENT_SIMULATION_TOOL_NAME,
  ORCHESTRATOR_TOOL_NAME,
  PROJECTION_REPLAY_TOOL_NAME,
} from "../constants.js";
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

describe("registerTools (v3 over v2 names)", () => {
  it("registers orchestrator and ops tools", () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server, composeApplication({ dbPath: ":memory:" }));
    expect(Array.from(ctx.tools.keys()).sort()).toEqual([
      INCIDENT_SIMULATION_TOOL_NAME,
      ORCHESTRATOR_TOOL_NAME,
      PROJECTION_REPLAY_TOOL_NAME,
    ]);
  });

  it("orchestrator returns expanded saga/durability response", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server, composeApplication({ dbPath: ":memory:" }));

    const result = await ctx.callTool(
      ORCHESTRATOR_TOOL_NAME,
      createValidRequest()
    );
    const payload = JSON.parse(extractFirstContentText(result)) as {
      deliveryStatus: string;
      sagaExecution: { status: string };
      routingDecision: { selectedRegion: string };
      chaosReport: { deterministicKey: string };
      durability: { replayable: boolean };
      enterpriseMetadata: { genAiSentimentScore: number; moatScore: number };
    };

    expect(payload.deliveryStatus).toBe("processed");
    expect(payload.sagaExecution.status).toBe("completed");
    expect(payload.routingDecision.selectedRegion.length).toBeGreaterThan(0);
    expect(payload.chaosReport.deterministicKey.length).toBeGreaterThan(0);
    expect(payload.durability.replayable).toBe(true);
    expect(
      payload.enterpriseMetadata.genAiSentimentScore
    ).toBeGreaterThanOrEqual(0);
    expect(payload.enterpriseMetadata.moatScore).toBeGreaterThanOrEqual(0);
  });

  it("ops tools simulate incidents and replay projections", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server, composeApplication({ dbPath: ":memory:" }));

    const incidentResult = await ctx.callTool(INCIDENT_SIMULATION_TOOL_NAME, {
      severity: "sev-2",
      title: "Synthetic incident",
      details: "Triggered for test",
    });
    const incidentPayload = JSON.parse(
      extractFirstContentText(incidentResult)
    ) as { incident: { id: string }; runbook: { id: string } };
    expect(incidentPayload.incident.id.length).toBeGreaterThan(0);
    expect(incidentPayload.runbook.id.length).toBeGreaterThan(0);

    const replayResult = await ctx.callTool(PROJECTION_REPLAY_TOOL_NAME, {});
    const replayPayload = JSON.parse(extractFirstContentText(replayResult)) as {
      projectionVersion: number;
      checksum: string;
    };
    expect(replayPayload.projectionVersion).toBeGreaterThanOrEqual(1);
    expect(replayPayload.checksum.length).toBeGreaterThan(0);
  });
});
