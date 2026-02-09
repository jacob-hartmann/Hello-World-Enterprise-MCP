/**
 * MCP Resources Registration
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApplicationServices } from "../application/composition-root.js";
import {
  AUDIT_RESOURCE_URI,
  METRICS_RESOURCE_URI,
  ORCHESTRATOR_PROMPT_NAME,
  ORCHESTRATOR_TOOL_NAME,
  STATUS_RESOURCE_URI,
} from "../constants.js";

export function registerResources(
  server: McpServer,
  services: Pick<
    ApplicationServices,
    "auditRepository" | "eventBus" | "metricsRepository" | "packageInfo"
  >
): void {
  server.registerResource(
    "status-v2",
    STATUS_RESOURCE_URI,
    {
      title: "Server Status (v2)",
      description:
        "Operational status and capability metadata for Enterprise Orchestrator v2",
    },
    () => {
      const status = {
        server: services.packageInfo.name,
        version: services.packageInfo.version,
        description: services.packageInfo.description,
        status: "operational",
        timestamp: new Date().toISOString(),
        health: {
          eventSubscriptions: services.eventBus.handlerCount(),
          auditEventCount: services.auditRepository.count(),
        },
        capabilities: {
          tools: [ORCHESTRATOR_TOOL_NAME],
          resources: [
            STATUS_RESOURCE_URI,
            AUDIT_RESOURCE_URI,
            METRICS_RESOURCE_URI,
          ],
          prompts: [ORCHESTRATOR_PROMPT_NAME],
        },
      };

      return {
        contents: [
          {
            uri: STATUS_RESOURCE_URI,
            mimeType: "application/json",
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "audit-v2",
    AUDIT_RESOURCE_URI,
    {
      title: "Audit Trail (v2)",
      description: "Recent orchestration events (in-memory append-only stream)",
    },
    () => {
      const response = {
        retainedEvents: services.auditRepository.count(),
        events: services.auditRepository.listRecent(),
      };

      return {
        contents: [
          {
            uri: AUDIT_RESOURCE_URI,
            mimeType: "application/json",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "metrics-v2",
    METRICS_RESOURCE_URI,
    {
      title: "Metrics Snapshot (v2)",
      description:
        "In-memory counters for orchestration outcomes and dimensions",
    },
    () => {
      const snapshot = services.metricsRepository.snapshot();
      return {
        contents: [
          {
            uri: METRICS_RESOURCE_URI,
            mimeType: "application/json",
            text: JSON.stringify(snapshot, null, 2),
          },
        ],
      };
    }
  );
}
