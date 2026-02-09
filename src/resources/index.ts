/**
 * MCP Resources Registration
 *
 * Registers all available resources with the MCP server.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as {
  version: string;
  name: string;
  description: string;
};

/**
 * Register all resources with the MCP server
 */
export function registerResources(server: McpServer): void {
  server.registerResource(
    "status",
    "hello://status",
    {
      title: "Server Status",
      description:
        "Current status and metadata for the Hello World Enterprise MCP server",
    },
    () => {
      const status = {
        server: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        status: "operational",
        timestamp: new Date().toISOString(),
        capabilities: {
          tools: ["hello.world", "hello.enterprise.greet"],
          resources: ["hello://status"],
          prompts: ["hello.greet"],
        },
      };

      return {
        contents: [
          {
            uri: "hello://status",
            mimeType: "application/json",
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }
  );
}
