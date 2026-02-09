/**
 * Tests for tools registration
 */

import { describe, it, expect } from "vitest";
import { registerTools } from "./index.js";
import { createToolTestContext } from "./__test-helpers__/tool-test-utils.js";

describe("registerTools", () => {
  it("should register hello.world tool", () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server);
    expect(ctx.tools.has("hello.world")).toBe(true);
  });

  it("should register hello.enterprise.greet tool", () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server);
    expect(ctx.tools.has("hello.enterprise.greet")).toBe(true);
  });

  it("hello.world should return Hello World", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server);
    const result = await ctx.callTool("hello.world", {});
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Hello World",
        },
      ],
    });
  });

  it("hello.enterprise.greet should return enterprise greeting with defaults", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server);
    const result = await ctx.callTool("hello.enterprise.greet", {});
    expect(result).toHaveProperty("content");
    const content = (result as { content: { type: string; text: string }[] })
      .content;
    expect(content).toHaveLength(1);
    expect(content[0]?.type).toBe("text");
    const parsed = JSON.parse(content[0]?.text ?? "{}");
    expect(parsed).toHaveProperty("greeting", "Hello World");
    expect(parsed).toHaveProperty(
      "edition",
      "Hello World (Enterprise Edition)"
    );
    expect(parsed).toHaveProperty("formality", "casual");
  });

  it("hello.enterprise.greet should handle custom recipient", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server);
    const result = await ctx.callTool("hello.enterprise.greet", {
      recipient: "Enterprise",
    });
    const content = (result as { content: { type: string; text: string }[] })
      .content;
    const parsed = JSON.parse(content[0]?.text ?? "{}");
    expect(parsed.greeting).toBe("Hello Enterprise");
  });

  it("hello.enterprise.greet should handle formality levels", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server);

    // Test formal
    let result = await ctx.callTool("hello.enterprise.greet", {
      formality: "formal",
    });
    let content = (result as { content: { type: string; text: string }[] })
      .content;
    let parsed = JSON.parse(content[0]?.text ?? "{}");
    expect(parsed.greeting).toBe("Greetings, World");

    // Test professional
    result = await ctx.callTool("hello.enterprise.greet", {
      formality: "professional",
    });
    content = (result as { content: { type: string; text: string }[] }).content;
    parsed = JSON.parse(content[0]?.text ?? "{}");
    expect(parsed.greeting).toBe("Hello, World");
  });

  it("hello.enterprise.greet should include timestamp when requested", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server);
    const result = await ctx.callTool("hello.enterprise.greet", {
      includeTimestamp: true,
    });
    const content = (result as { content: { type: string; text: string }[] })
      .content;
    const parsed = JSON.parse(content[0]?.text ?? "{}");
    expect(parsed).toHaveProperty("timestamp");
    expect(typeof parsed.timestamp).toBe("string");
  });

  it("hello.enterprise.greet should include metadata when provided", async () => {
    const ctx = createToolTestContext();
    registerTools(ctx.server);
    const result = await ctx.callTool("hello.enterprise.greet", {
      metadata: { key: "value", foo: "bar" },
    });
    const content = (result as { content: { type: string; text: string }[] })
      .content;
    const parsed = JSON.parse(content[0]?.text ?? "{}");
    expect(parsed).toHaveProperty("metadata");
    expect(parsed.metadata).toEqual({ key: "value", foo: "bar" });
  });
});
