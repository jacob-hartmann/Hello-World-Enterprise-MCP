/**
 * MCP Prompts Registration
 *
 * Registers all available prompts with the MCP server.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register all prompts with the MCP server
 */
export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "hello.greet",
    {
      description:
        "Guide for using the Hello World Enterprise greeting tools. " +
        "Helps users choose between the simple and enterprise greeting options.",
      argsSchema: {
        recipient: z
          .string()
          .optional()
          .describe("Who to greet (default: 'World')"),
        useEnterprise: z
          .boolean()
          .optional()
          .describe("Use the enterprise greeting tool (default: false)"),
      },
    },
    (args) => {
      const recipient = args.recipient ?? "World";
      const useEnterprise = args.useEnterprise ?? false;

      if (useEnterprise) {
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text:
                  `Use the hello.enterprise.greet tool to greet "${recipient}" with full enterprise features.\n\n` +
                  `Available options:\n` +
                  `- formality: Choose 'casual', 'professional', or 'formal'\n` +
                  `- includeTimestamp: Add ISO 8601 timestamp\n` +
                  `- metadata: Include custom key-value pairs\n\n` +
                  `Example: Call hello.enterprise.greet with recipient="${recipient}", formality="professional", and includeTimestamp=true`,
              },
            },
          ],
        };
      }

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text:
                `Use the hello.world tool to get a simple greeting.\n\n` +
                `For a basic greeting, just call hello.world with no arguments.\n` +
                `For enterprise features, use hello.enterprise.greet instead with recipient="${recipient}".`,
            },
          },
        ],
      };
    }
  );
}
