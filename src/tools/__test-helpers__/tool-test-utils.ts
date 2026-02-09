/**
 * Shared test utilities for tool tests.
 *
 * Provides mock server and helpers to eliminate boilerplate
 * across all tool test files.
 */

import { vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerRequest,
  ServerNotification,
} from "@modelcontextprotocol/sdk/types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToolHandler = (
  args: Record<string, unknown>,
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) => Promise<Record<string, unknown>> | Record<string, unknown>;

export interface ToolTestContext {
  server: McpServer;
  tools: Map<string, ToolHandler>;
  callTool: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a test context with a mock server that captures registerTool calls.
 */
export function createToolTestContext(): ToolTestContext {
  const tools = new Map<string, ToolHandler>();

  const server = {
    registerTool: vi.fn(
      (name: string, _config: unknown, handler: ToolHandler) => {
        tools.set(name, handler);
      }
    ),
  } as unknown as McpServer;

  const mockExtra = {} as RequestHandlerExtra<
    ServerRequest,
    ServerNotification
  >;

  const callTool = (name: string, args: Record<string, unknown>) => {
    const handler = tools.get(name);
    if (!handler) throw new Error(`Tool "${name}" not registered`);
    return handler(args, mockExtra);
  };

  return { server, tools, callTool };
}
