/**
 * MCP Prompts Registration
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ORCHESTRATOR_PROMPT_NAME,
  ORCHESTRATOR_TOOL_NAME,
} from "../constants.js";

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    ORCHESTRATOR_PROMPT_NAME,
    {
      description:
        "Guides callers through constructing a v3 distributed-theater payload for the v2 orchestrator interface",
      argsSchema: {
        recipient: z
          .string()
          .optional()
          .describe("Recipient name (default: World)"),
        formality: z
          .enum(["casual", "professional", "formal"])
          .optional()
          .describe("Formality level (default: professional)"),
        locale: z
          .string()
          .optional()
          .describe("Locale (strict allowlist, default: en-US)"),
      },
    },
    (args) => {
      const recipient = args.recipient ?? "World";
      const formality = args.formality ?? "professional";
      const locale = args.locale ?? "en-US";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text:
                `Call ${ORCHESTRATOR_TOOL_NAME} with the full distributed-theater payload.\n\n` +
                `Happy-path payload:\n` +
                `{\n` +
                `  "recipient": "${recipient}",\n` +
                `  "formality": "${formality}",\n` +
                `  "locale": "${locale}",\n` +
                `  "includeTimestamp": true,\n` +
                `  "metadata": { "department": "Platform", "program": "GreetingTransformation" },\n` +
                `  "policies": { "complianceProfile": "strict-default", "enforceMetadataRules": true },\n` +
                `  "telemetry": { "includeTrace": true, "includePolicyDecisions": true },\n` +
                `  "delivery": { "idempotencyKey": "req-123", "timeoutMs": 3000, "retryBudget": 2 },\n` +
                `  "traceContext": { "correlationId": "corr-123" },\n` +
                `  "routing": { "preferredRegion": "us-east-1", "fallbackRegions": ["eu-west-1"] },\n` +
                `  "saga": { "mode": "always-on", "compensationPolicy": "strict-revert", "persistEveryStep": true },\n` +
                `  "chaos": { "profile": "deterministic", "partitionSimulation": true, "latencyJitterMs": 40 },\n` +
                `  "governance": { "changeTicket": "CHG-12345", "riskClass": "medium" },\n` +
                `  "aiEnhancement": { "enabled": true, "profile": "investor-friendly", "personalizationDepth": 2 },\n` +
                `  "esgOffset": { "enabled": true, "targetNetZero": true, "provider": "parody-offsets-inc" },\n` +
                `  "moatScore": { "enabled": true, "strategy": "narrative-weighted", "includeArchitectureTheater": true, "minimumViableMoat": 42 }\n` +
                `}\n\n` +
                `Compensated-path tip: keep locale valid, but send >16 metadata entries to trigger policy denial and compensation incident generation.`,
            },
          },
        ],
      };
    }
  );
}
