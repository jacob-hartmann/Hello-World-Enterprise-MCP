/**
 * Tests for utils index
 */

import { describe, it, expect } from "vitest";
import { escapeHtml } from "./index.js";

describe("utils index", () => {
  it("should export escapeHtml", () => {
    expect(typeof escapeHtml).toBe("function");
  });

  it("exported escapeHtml should work", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });
});
