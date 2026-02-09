/**
 * MCP Tools Registration
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApplicationServices } from "../application/composition-root.js";
import {
  INCIDENT_SIMULATION_TOOL_NAME,
  ORCHESTRATOR_TOOL_NAME,
  PROJECTION_REPLAY_TOOL_NAME,
} from "../constants.js";
import { orchestrateRequestSchema } from "../contracts/v2.js";

export function registerTools(
  server: McpServer,
  services: Pick<
    ApplicationServices,
    "orchestrator" | "operationsService" | "projectionReplayService"
  >
): void {
  server.registerTool(
    ORCHESTRATOR_TOOL_NAME,
    {
      description:
        "Executes the enterprise orchestration saga with deterministic chaos and durable replayable events",
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

  server.registerTool(
    INCIDENT_SIMULATION_TOOL_NAME,
    {
      description:
        "Creates a synthetic enterprise incident and associated runbook for operations rehearsal",
      inputSchema: z.object({
        severity: z.enum(["sev-3", "sev-2", "sev-1"]).default("sev-3"),
        title: z.string().min(1).max(128),
        details: z.string().min(1).max(512),
      }),
    },
    (args) => {
      const raised = services.operationsService.raiseIncident({
        severity: args.severity,
        title: args.title,
        details: args.details,
        code: "SIMULATED_INCIDENT",
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                incident: raised.incident,
                runbook: raised.runbook,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    PROJECTION_REPLAY_TOOL_NAME,
    {
      description:
        "Rebuilds projection metrics from the durable event log and returns deterministic checksum",
      inputSchema: z.object({}),
    },
    () => {
      const replay = services.projectionReplayService.replay();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(replay, null, 2),
          },
        ],
      };
    }
  );
}
