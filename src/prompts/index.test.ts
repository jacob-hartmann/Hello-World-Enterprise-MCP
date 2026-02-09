import { describe, expect, it, vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ORCHESTRATOR_PROMPT_NAME,
  ORCHESTRATOR_TOOL_NAME,
} from "../constants.js";
import { registerPrompts } from "./index.js";

describe("registerPrompts (v3 guidance)", () => {
  it("registers orchestrator prompt with same identifier", () => {
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

  it("returns enterprise envelope guidance", () => {
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

    const text = payload.messages[0]?.content.text ?? "";
    expect(text).toContain(ORCHESTRATOR_TOOL_NAME);
    expect(text).toContain('"delivery"');
    expect(text).toContain('"chaos"');
    expect(text).toContain('"aiEnhancement"');
    expect(text).toContain('"esgOffset"');
    expect(text).toContain('"moatScore"');
    expect(text).toContain("Compensated-path tip");
  });
});
