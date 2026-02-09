import { describe, expect, it, vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { composeApplication } from "../application/composition-root.js";
import {
  AUDIT_RESOURCE_URI,
  METRICS_RESOURCE_URI,
  ORCHESTRATOR_TOOL_NAME,
  STATUS_RESOURCE_URI,
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

describe("registerResources (v2)", () => {
  it("registers v2 status, audit, and metrics resources", () => {
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

    registerResources(server, composeApplication());

    expect(Array.from(resources.keys()).sort()).toEqual([
      "audit-v2",
      "metrics-v2",
      "status-v2",
    ]);
  });

  it("status resource returns v2 capabilities", async () => {
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

    registerResources(server, composeApplication());
    const result = await resources.get("status-v2")?.();
    const payload = JSON.parse(extractResourceText(result)) as {
      capabilities: { tools: string[]; resources: string[] };
    };

    expect(payload.capabilities.tools).toEqual([ORCHESTRATOR_TOOL_NAME]);
    expect(payload.capabilities.resources).toEqual([
      STATUS_RESOURCE_URI,
      AUDIT_RESOURCE_URI,
      METRICS_RESOURCE_URI,
    ]);
  });

  it("audit and metrics resources return JSON payloads", async () => {
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

    registerResources(server, composeApplication());
    const auditResult = await resources.get("audit-v2")?.();
    const metricsResult = await resources.get("metrics-v2")?.();

    const auditText = extractResourceText(auditResult);
    const metricsText = extractResourceText(metricsResult);

    expect(typeof JSON.parse(auditText)).toBe("object");
    expect(typeof JSON.parse(metricsText)).toBe("object");
  });
});
