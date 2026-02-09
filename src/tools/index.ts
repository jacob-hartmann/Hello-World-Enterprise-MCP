/**
 * MCP Tools Registration
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApplicationServices } from "../application/composition-root.js";
import { ORCHESTRATOR_TOOL_NAME } from "../constants.js";
import { orchestrateRequestSchema } from "../contracts/v2.js";

export function registerTools(
  server: McpServer,
  services: Pick<ApplicationServices, "orchestrator">
): void {
  server.registerTool(
    ORCHESTRATOR_TOOL_NAME,
    {
      description:
        "Executes the enterprise greeting orchestration pipeline (v2, strict policy mode)",
      inputSchema: orchestrateRequestSchema,
    },
    (args) => {
      const result = services.orchestrator.execute(args);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
