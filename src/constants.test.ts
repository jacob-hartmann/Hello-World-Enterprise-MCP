/**
 * Tests for constants
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_GREETING,
  ENTERPRISE_GREETING,
  OPERATION_TIMEOUT_MS,
} from "./constants.js";

describe("constants", () => {
  it("should export DEFAULT_GREETING", () => {
    expect(DEFAULT_GREETING).toBe("Hello World");
  });

  it("should export ENTERPRISE_GREETING", () => {
    expect(ENTERPRISE_GREETING).toBe("Hello World (Enterprise Edition)");
  });

  it("should export OPERATION_TIMEOUT_MS", () => {
    expect(OPERATION_TIMEOUT_MS).toBe(30_000);
  });
});
