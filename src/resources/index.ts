/**
 * MCP Resources Registration
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApplicationServices } from "../application/composition-root.js";
import {
  AUDIT_RESOURCE_URI,
  INCIDENTS_RESOURCE_URI,
  INCIDENT_SIMULATION_TOOL_NAME,
  METRICS_RESOURCE_URI,
  ORCHESTRATOR_PROMPT_NAME,
  ORCHESTRATOR_TOOL_NAME,
  PROJECTION_REPLAY_TOOL_NAME,
  RUNBOOKS_RESOURCE_URI,
  STATUS_RESOURCE_URI,
  TOPOLOGY_RESOURCE_URI,
} from "../constants.js";

export function registerResources(
  server: McpServer,
  services: Pick<
    ApplicationServices,
    | "eventBus"
    | "auditRepository"
    | "eventLogRepository"
    | "incidentRepository"
    | "runbookRepository"
    | "runbookGenerationRepository"
    | "aiEnrichmentRepository"
    | "esgOffsetRepository"
    | "moatRepository"
    | "metricsRepository"
    | "projectionReplayService"
    | "packageInfo"
  >
): void {
  server.registerResource(
    "status-v2",
    STATUS_RESOURCE_URI,
    {
      title: "Server Status (v2)",
      description:
        "Operational status, topology summary, and replay checkpoints",
    },
    () => {
      const projection = services.projectionReplayService.snapshot();
      const latestAi = services.aiEnrichmentRepository.latest();
      const latestEsg = services.esgOffsetRepository.latest();
      const latestMoat = services.moatRepository.latest();
      const latestRunbookGeneration =
        services.runbookGenerationRepository.latest();
      const status = {
        server: services.packageInfo.name,
        version: services.packageInfo.version,
        description: services.packageInfo.description,
        status: "operational",
        timestamp: new Date().toISOString(),
        topologySummary: {
          services: 6,
          healthy: true,
        },
        projection: {
          lagEvents:
            services.eventLogRepository.latestOffset() -
            projection.replayCheckpoint,
          replayCheckpoint: projection.replayCheckpoint,
          projectionVersion: projection.projectionVersion,
        },
        health: {
          eventSubscriptions: services.eventBus.handlerCount(),
          memoryAuditEventCount: services.auditRepository.count(),
          durableEventCount: services.eventLogRepository.count(),
          incidentCount: services.incidentRepository.count(),
        },
        enrichment: {
          capabilities: {
            aiEnhancement: true,
            esgOffset: true,
            moatScoring: true,
            runbookGeneration: true,
          },
          checkpoints: {
            ai: latestAi
              ? {
                  promptFingerprint: latestAi.promptFingerprint,
                  sentimentScore: latestAi.sentimentScore,
                  createdAt: latestAi.createdAt,
                }
              : null,
            esg: latestEsg
              ? {
                  certificateId: latestEsg.certificateId,
                  offsetPurchasedGrams: latestEsg.offsetPurchasedGrams,
                  createdAt: latestEsg.createdAt,
                }
              : null,
            moat: latestMoat
              ? {
                  score: latestMoat.score,
                  quartile: latestMoat.quartile,
                  createdAt: latestMoat.createdAt,
                }
              : null,
            runbookGeneration: latestRunbookGeneration
              ? {
                  runbookId: latestRunbookGeneration.runbookId,
                  fingerprint: latestRunbookGeneration.fingerprint,
                  createdAt: latestRunbookGeneration.createdAt,
                }
              : null,
          },
        },
        capabilities: {
          tools: [
            ORCHESTRATOR_TOOL_NAME,
            INCIDENT_SIMULATION_TOOL_NAME,
            PROJECTION_REPLAY_TOOL_NAME,
          ],
          resources: [
            STATUS_RESOURCE_URI,
            AUDIT_RESOURCE_URI,
            METRICS_RESOURCE_URI,
            TOPOLOGY_RESOURCE_URI,
            RUNBOOKS_RESOURCE_URI,
            INCIDENTS_RESOURCE_URI,
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
      description: "Durable saga events and compensation history",
    },
    () => {
      const response = {
        retainedMemoryEvents: services.auditRepository.count(),
        durableEventCount: services.eventLogRepository.count(),
        events: services.eventLogRepository.listRecent(100),
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
      description: "Runtime counters and projection replay counters",
    },
    () => {
      const runtime = services.metricsRepository.snapshot();
      const projection = services.projectionReplayService.snapshot();
      const sentimentDistribution = {
        low: runtime.counters["sentiment_low_total"] ?? 0,
        mid: runtime.counters["sentiment_mid_total"] ?? 0,
        high: runtime.counters["sentiment_high_total"] ?? 0,
      };
      const enrichment = {
        aiRecords: services.aiEnrichmentRepository.count(),
        esgRecords: services.esgOffsetRepository.count(),
        moatRecords: services.moatRepository.count(),
        runbookGenerationRecords: services.runbookGenerationRepository.count(),
      };
      return {
        contents: [
          {
            uri: METRICS_RESOURCE_URI,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                runtime,
                projection,
                sentimentDistribution,
                enrichment,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerResource(
    "topology-v2",
    TOPOLOGY_RESOURCE_URI,
    {
      title: "Distributed Topology (v2)",
      description: "Synthetic service map for enterprise distributed theater",
    },
    () => {
      const topology = {
        services: [
          { name: "gateway", health: "green" },
          { name: "orchestrator", health: "green" },
          { name: "policy-sidecar", health: "green" },
          { name: "regional-workers", health: "green" },
          { name: "audit-writer", health: "green" },
          { name: "projection-rebuilder", health: "green" },
        ],
      };
      return {
        contents: [
          {
            uri: TOPOLOGY_RESOURCE_URI,
            mimeType: "application/json",
            text: JSON.stringify(topology, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "runbooks-v2",
    RUNBOOKS_RESOURCE_URI,
    {
      title: "Runbook Registry (v2)",
      description: "Recent generated runbooks mapped from incident conditions",
    },
    () => {
      const runbooks = services.runbookRepository.listRecent(50);
      const provenanceByRunbookId =
        services.runbookGenerationRepository.findByRunbookIds(
          runbooks.map((runbook) => {
            return runbook.id;
          })
        );
      return {
        contents: [
          {
            uri: RUNBOOKS_RESOURCE_URI,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                runbooks: runbooks.map((runbook) => {
                  const provenance = provenanceByRunbookId[runbook.id];
                  return {
                    ...runbook,
                    generation: provenance
                      ? {
                          generatorId: provenance.generatorId,
                          fingerprint: provenance.fingerprint,
                          code: provenance.code,
                          ...(provenance.requestId
                            ? { requestId: provenance.requestId }
                            : {}),
                          ...(provenance.sagaId
                            ? { sagaId: provenance.sagaId }
                            : {}),
                          createdAt: provenance.createdAt,
                        }
                      : null,
                  };
                }),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerResource(
    "incidents-v2",
    INCIDENTS_RESOURCE_URI,
    {
      title: "Incident Feed (v2)",
      description: "Recent synthetic incidents from compensation/failure flows",
    },
    () => {
      return {
        contents: [
          {
            uri: INCIDENTS_RESOURCE_URI,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                incidents: services.incidentRepository.listRecent(50),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
