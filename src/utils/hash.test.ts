import { describe, expect, it } from "vitest";
import { canonicalStringify, hashString } from "./hash.js";

describe("hash utilities", () => {
  it("creates deterministic hashes", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abcd"));
  });

  it("canonicalizes object key ordering", () => {
    const a = canonicalStringify({ b: 1, a: 2 });
    const b = canonicalStringify({ a: 2, b: 1 });
    expect(a).toBe(b);
  });
});
