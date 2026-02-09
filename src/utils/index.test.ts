import { describe, expect, it } from "vitest";
import { canonicalStringify, escapeHtml, hashString } from "./index.js";

describe("utils index", () => {
  it("exports escapeHtml", () => {
    expect(typeof escapeHtml).toBe("function");
  });

  it("exported escapeHtml works", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("exports hash helpers", () => {
    expect(hashString("abc")).toHaveLength(64);
    expect(canonicalStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
});
