import { describe, expect, it, vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ORCHESTRATOR_PROMPT_NAME,
  ORCHESTRATOR_TOOL_NAME,
} from "../constants.js";
import { registerPrompts } from "./index.js";

describe("registerPrompts (v2)", () => {
  it("registers only the v2 orchestrator prompt", () => {
    const prompts = new Map<
      string,
      (args: Record<string, unknown>) => unknown
    >();
    const server = {
      registerPrompt: vi.fn(
        (
          name: string,
          _config: unknown,
          handler: (args: Record<string, unknown>) => unknown
        ) => {
          prompts.set(name, handler);
        }
      ),
    } as unknown as McpServer;

    registerPrompts(server);
    expect(Array.from(prompts.keys())).toEqual([ORCHESTRATOR_PROMPT_NAME]);
  });

  it("returns workflow guidance containing the v2 tool name", () => {
    const prompts = new Map<
      string,
      (args: Record<string, unknown>) => unknown
    >();
    const server = {
      registerPrompt: vi.fn(
        (
          name: string,
          _config: unknown,
          handler: (args: Record<string, unknown>) => unknown
        ) => {
          prompts.set(name, handler);
        }
      ),
    } as unknown as McpServer;

    registerPrompts(server);
    const payload = prompts.get(ORCHESTRATOR_PROMPT_NAME)?.({
      recipient: "Universe",
      formality: "formal",
      locale: "en-US",
    }) as {
      messages: { content: { text: string } }[];
    };

    expect(payload.messages[0]?.content.text).toContain(ORCHESTRATOR_TOOL_NAME);
    expect(payload.messages[0]?.content.text).toContain("strict-default");
    expect(payload.messages[0]?.content.text).toContain("Universe");
  });
});
