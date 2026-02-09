#!/usr/bin/env node
/**
 * Hello World Enterprise MCP Server
 *
 * A Model Context Protocol (MCP) server demonstrating enterprise
 * over-engineering of "Hello World".
 *
 * This server provides:
 * - Tool: hello.world - Simple Hello World greeting
 * - Tool: hello.enterprise.greet - Enterprise-grade greeting (over-parameterized)
 * - Resource: hello://status - Server status information
 * - Prompt: hello.greet - Instructions for using the greeting tools
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
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Hello World Enterprise MCP server. A parody of enterprise over-engineering. " +
        "Start with hello.world for a simple greeting, or use hello.enterprise.greet " +
        "for the full enterprise experience with extensive parameterization.",
    }
  );

  registerTools(server);
  registerResources(server);
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
