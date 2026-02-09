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
        "Guides callers through constructing a valid v2 orchestration request payload",
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
          .describe("Locale (strict allowlist in v2, default: en-US)"),
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
                `Call ${ORCHESTRATOR_TOOL_NAME} with a strict-default enterprise payload.\n\n` +
                `Suggested payload:\n` +
                `{\n` +
                `  "recipient": "${recipient}",\n` +
                `  "formality": "${formality}",\n` +
                `  "locale": "${locale}",\n` +
                `  "includeTimestamp": true,\n` +
                `  "policies": {\n` +
                `    "complianceProfile": "strict-default",\n` +
                `    "enforceMetadataRules": true\n` +
                `  },\n` +
                `  "telemetry": {\n` +
                `    "includeTrace": true,\n` +
                `    "includePolicyDecisions": true\n` +
                `  },\n` +
                `  "metadata": {\n` +
                `    "department": "Platform",\n` +
                `    "program": "GreetingTransformation"\n` +
                `  }\n` +
                `}\n\n` +
                `If policy checks fail, expect a fail-closed error envelope instead of greeting output.`,
            },
          },
        ],
      };
    }
  );
}
