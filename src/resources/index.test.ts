/**
 * Tests for resources registration
 */

import { describe, it, expect, vi } from "vitest";
import { registerResources } from "./index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("registerResources", () => {
  it("should register hello://status resource", () => {
    const resources = new Map<string, () => Promise<unknown>>();
    const server = {
      registerResource: vi.fn(
        (
          name: string,
          _uri: string,
          _config: unknown,
          handler: () => Promise<unknown>
        ) => {
          resources.set(name, handler);
        }
      ),
    } as unknown as McpServer;

    registerResources(server);
    expect(resources.has("status")).toBe(true);
  });

  it("hello://status should return server status", async () => {
    const resources = new Map<string, () => Promise<unknown>>();
    const server = {
      registerResource: vi.fn(
        (
          name: string,
          _uri: string,
          _config: unknown,
          handler: () => Promise<unknown>
        ) => {
          resources.set(name, handler);
        }
      ),
    } as unknown as McpServer;

    registerResources(server);
    const handler = resources.get("status");
    expect(handler).toBeDefined();

    const result = await handler!();
    expect(result).toHaveProperty("contents");
    const response = result as {
      contents: { uri: string; mimeType: string; text: string }[];
    };
    expect(response.contents).toHaveLength(1);
    expect(response.contents[0]?.uri).toBe("hello://status");
    expect(response.contents[0]?.mimeType).toBe("application/json");

    const status = JSON.parse(response.contents[0]?.text ?? "{}");
    expect(status).toHaveProperty("server", "hello-world-enterprise-mcp");
    expect(status).toHaveProperty("status", "operational");
    expect(status).toHaveProperty("capabilities");
  });
});
