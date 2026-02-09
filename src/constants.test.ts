import { describe, expect, it } from "vitest";
import {
  AUDIT_RESOURCE_URI,
  DEFAULT_GREETING,
  ENTERPRISE_GREETING,
  METRICS_RESOURCE_URI,
  OPERATION_TIMEOUT_MS,
  ORCHESTRATOR_PROMPT_NAME,
  ORCHESTRATOR_TOOL_NAME,
  STATUS_RESOURCE_URI,
  SUPPORTED_LOCALES,
} from "./constants.js";

describe("constants", () => {
  it("exports legacy display constants", () => {
    expect(DEFAULT_GREETING).toBe("Hello World");
    expect(ENTERPRISE_GREETING).toBe("Hello World (Enterprise Edition)");
  });

  it("exports v2 public interface identifiers", () => {
    expect(ORCHESTRATOR_TOOL_NAME).toBe("hello.enterprise.v2.orchestrate");
    expect(ORCHESTRATOR_PROMPT_NAME).toBe("hello.v2.orchestrate");
    expect(STATUS_RESOURCE_URI).toBe("hello://v2/status");
    expect(AUDIT_RESOURCE_URI).toBe("hello://v2/audit");
    expect(METRICS_RESOURCE_URI).toBe("hello://v2/metrics");
  });

  it("exports strict locale defaults", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en-US"]);
    expect(OPERATION_TIMEOUT_MS).toBe(30_000);
  });
});
