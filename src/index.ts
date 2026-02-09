#!/usr/bin/env node
/**
 * Hello World Enterprise MCP Server
 *
 * A Model Context Protocol (MCP) server demonstrating enterprise
 * over-engineering of "Hello World".
 *
 * This server provides:
 * - Tool: hello.enterprise.v2.orchestrate - Enterprise workflow orchestration
 * - Tool: hello.enterprise.v2.incident.simulate - Synthetic incident creation
 * - Tool: hello.enterprise.v2.replay.projections - Projection replay from event log
 * - Resources: hello://v2/status, hello://v2/audit, hello://v2/metrics, hello://v2/topology, hello://v2/runbooks, hello://v2/incidents
 * - Prompt: hello.v2.orchestrate - Instructions for building workflow payloads
 *
 * Transport: stdio (JSON-RPC over stdin/stdout)
 *
 * All logging goes to stderr to avoid corrupting JSON-RPC over stdout.
 *
 * @see https://modelcontextprotocol.io/
 */

import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { composeApplication } from "./application/composition-root.js";
import { registerTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

const SERVER_NAME = "hello-world-enterprise-mcp";

// Read version from package.json to keep it in sync
const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version: string };
const SERVER_VERSION = packageJson.version;

/**
 * Start the server in stdio mode
 */
async function startStdioServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${SERVER_NAME}] Server running on stdio transport`);
}

/**
 * Create an MCP server with all handlers registered
 */
function createServer(): McpServer {
  const services = composeApplication();
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Hello World Enterprise MCP server v3. A parody of enterprise over-engineering. " +
        "Use hello.enterprise.v2.orchestrate for always-on saga orchestration with deterministic chaos.",
    }
  );

  registerTools(server, services);
  registerResources(server, services);
  registerPrompts(server);

  return server;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.error(
    `[${SERVER_NAME}] Starting server v${SERVER_VERSION} (stdio transport)...`
  );
  const server = createServer();

  process.on("SIGTERM", () => {
    void server.close();
  });
  process.on("SIGINT", () => {
    void server.close();
  });

  await startStdioServer(server);
}

// Run the server
main().catch((error: unknown) => {
  console.error(`[${SERVER_NAME}] Fatal error:`, error);
  process.exit(1);
});
