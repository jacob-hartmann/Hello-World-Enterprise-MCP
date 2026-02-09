/**
 * Tests for prompts registration
 */

import { describe, it, expect, vi } from "vitest";
import { registerPrompts } from "./index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("registerPrompts", () => {
  it("should register hello.greet prompt", () => {
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
    expect(prompts.has("hello.greet")).toBe(true);
  });

  it("hello.greet should return simple greeting instructions by default", () => {
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
    const handler = prompts.get("hello.greet");
    expect(handler).toBeDefined();

    const result = handler!({});
    expect(result).toHaveProperty("messages");
    const response = result as {
      messages: { role: string; content: { type: string; text: string } }[];
    };
    expect(response.messages).toHaveLength(1);
    expect(response.messages[0]?.content.text).toContain("hello.world");
  });

  it("hello.greet should return enterprise instructions when useEnterprise is true", () => {
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
    const handler = prompts.get("hello.greet");
    const result = handler!({ useEnterprise: true });
    const response = result as {
      messages: { role: string; content: { type: string; text: string } }[];
    };
    expect(response.messages[0]?.content.text).toContain(
      "hello.enterprise.greet"
    );
    expect(response.messages[0]?.content.text).toContain("formality");
  });

  it("hello.greet should use custom recipient", () => {
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
    const handler = prompts.get("hello.greet");
    const result = handler!({ recipient: "Universe", useEnterprise: true });
    const response = result as {
      messages: { role: string; content: { type: string; text: string } }[];
    };
    expect(response.messages[0]?.content.text).toContain("Universe");
  });
});
