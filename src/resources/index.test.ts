import { describe, expect, it, vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { composeApplication } from "../application/composition-root.js";
import {
  AUDIT_RESOURCE_URI,
  INCIDENTS_RESOURCE_URI,
  METRICS_RESOURCE_URI,
  ORCHESTRATOR_TOOL_NAME,
  RUNBOOKS_RESOURCE_URI,
  STATUS_RESOURCE_URI,
  TOPOLOGY_RESOURCE_URI,
} from "../constants.js";
import { registerResources } from "./index.js";

type ResourceHandler = () => unknown;

function extractResourceText(result: unknown): string {
  if (
    typeof result !== "object" ||
    result === null ||
    !("contents" in result) ||
    !Array.isArray(result.contents)
  ) {
    throw new Error("Invalid resource response");
  }

  const first = result.contents[0];
  if (
    typeof first !== "object" ||
    first === null ||
    !("text" in first) ||
    typeof (first as { text?: unknown }).text !== "string"
  ) {
    throw new Error("Resource response missing text content");
  }

  return (first as { text: string }).text;
}

describe("registerResources (v3 over v2 names)", () => {
  it("registers status, audit, metrics, topology, runbooks, and incidents", () => {
    const resources = new Map<string, ResourceHandler>();
    const server = {
      registerResource: vi.fn(
        (
          name: string,
          _uri: string,
          _config: unknown,
          handler: ResourceHandler
        ) => {
          resources.set(name, handler);
        }
      ),
    } as unknown as McpServer;

    registerResources(server, composeApplication({ dbPath: ":memory:" }));

    expect(Array.from(resources.keys()).sort()).toEqual([
      "audit-v2",
      "incidents-v2",
      "metrics-v2",
      "runbooks-v2",
      "status-v2",
      "topology-v2",
    ]);
  });

  it("status resource returns unchanged core tool name with expanded capabilities", async () => {
    const resources = new Map<string, ResourceHandler>();
    const server = {
      registerResource: vi.fn(
        (
          name: string,
          _uri: string,
          _config: unknown,
          handler: ResourceHandler
        ) => {
          resources.set(name, handler);
        }
      ),
    } as unknown as McpServer;

    registerResources(server, composeApplication({ dbPath: ":memory:" }));
    const result = await resources.get("status-v2")?.();
    const payload = JSON.parse(extractResourceText(result)) as {
      capabilities: { tools: string[]; resources: string[] };
      projection: { replayCheckpoint: number };
      enrichment: {
        capabilities: {
          aiEnhancement: boolean;
          esgOffset: boolean;
          moatScoring: boolean;
        };
      };
    };

    expect(payload.capabilities.tools).toContain(ORCHESTRATOR_TOOL_NAME);
    expect(payload.capabilities.resources).toEqual([
      STATUS_RESOURCE_URI,
      AUDIT_RESOURCE_URI,
      METRICS_RESOURCE_URI,
      TOPOLOGY_RESOURCE_URI,
      RUNBOOKS_RESOURCE_URI,
      INCIDENTS_RESOURCE_URI,
    ]);
    expect(payload.projection.replayCheckpoint).toBeGreaterThanOrEqual(0);
    expect(payload.enrichment.capabilities.aiEnhancement).toBe(true);
  });

  it("ops resources return topology/incidents/runbooks payloads", async () => {
    const resources = new Map<string, ResourceHandler>();
    const services = composeApplication({ dbPath: ":memory:" });
    services.operationsService.raiseIncident({
      severity: "sev-2",
      title: "Synthetic incident",
      details: "Generated for resource test",
      code: "SIMULATED_INCIDENT",
    });
    const server = {
      registerResource: vi.fn(
        (
          name: string,
          _uri: string,
          _config: unknown,
          handler: ResourceHandler
        ) => {
          resources.set(name, handler);
        }
      ),
    } as unknown as McpServer;

    registerResources(server, services);

    const topology = JSON.parse(
      extractResourceText(await resources.get("topology-v2")?.())
    ) as { services: { name: string }[] };
    const incidents = JSON.parse(
      extractResourceText(await resources.get("incidents-v2")?.())
    ) as { incidents: unknown[] };
    const runbooks = JSON.parse(
      extractResourceText(await resources.get("runbooks-v2")?.())
    ) as { runbooks: { generation: unknown }[] };
    const metrics = JSON.parse(
      extractResourceText(await resources.get("metrics-v2")?.())
    ) as { enrichment: { aiRecords: number }; sentimentDistribution: unknown };

    expect(topology.services.length).toBeGreaterThanOrEqual(6);
    expect(Array.isArray(incidents.incidents)).toBe(true);
    expect(Array.isArray(runbooks.runbooks)).toBe(true);
    expect(metrics.enrichment.aiRecords).toBeGreaterThanOrEqual(0);
    expect(runbooks.runbooks[0]?.generation).not.toBeNull();
  });
});
