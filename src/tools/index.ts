/**
 * MCP Tools Registration
 *
 * Registers all available tools with the MCP server.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DEFAULT_GREETING, ENTERPRISE_GREETING } from "../constants.js";

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: McpServer): void {
  // Simple Hello World tool
  server.registerTool(
    "hello.world",
    {
      description: "Returns a simple 'Hello World' greeting",
      inputSchema: z.object({}),
    },
    (_args, _extra) => {
      return {
        content: [
          {
            type: "text" as const,
            text: DEFAULT_GREETING,
          },
        ],
      };
    }
  );

  // Enterprise Hello World tool (intentionally over-parameterized)
  server.registerTool(
    "hello.enterprise.greet",
    {
      description:
        "Enterprise-grade greeting system with comprehensive parameterization, " +
        "configuration options, and extensibility patterns (a parody of over-engineering)",
      inputSchema: z.object({
        recipient: z
          .string()
          .optional()
          .describe("The recipient of the greeting (default: 'World')"),
        formality: z
          .enum(["casual", "professional", "formal"])
          .optional()
          .describe("The formality level of the greeting (default: 'casual')"),
        includeTimestamp: z
          .boolean()
          .optional()
          .describe(
            "Include ISO 8601 timestamp in the response (default: false)"
          ),
        locale: z
          .string()
          .optional()
          .describe(
            "Locale identifier (currently unused, reserved for future i18n support)"
          ),
        metadata: z
          .record(z.string(), z.string())
          .optional()
          .describe("Additional metadata to include in the response"),
      }),
    },
    (args, _extra) => {
      const recipient = args.recipient ?? "World";
      const formality = args.formality ?? "casual";
      const includeTimestamp = args.includeTimestamp ?? false;
      const metadata = args.metadata ?? {};

      // Construct greeting based on formality
      let greeting: string;
      switch (formality) {
        case "formal":
          greeting = `Greetings, ${recipient}`;
          break;
        case "professional":
          greeting = `Hello, ${recipient}`;
          break;
        case "casual":
        default:
          greeting = `Hello ${recipient}`;
          break;
      }

      const response: {
        greeting: string;
        edition: string;
        formality: string;
        timestamp?: string;
        metadata?: Record<string, string>;
      } = {
        greeting,
        edition: ENTERPRISE_GREETING,
        formality,
      };

      if (includeTimestamp) {
        response.timestamp = new Date().toISOString();
      }

      if (Object.keys(metadata).length > 0) {
        response.metadata = metadata;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );
}
