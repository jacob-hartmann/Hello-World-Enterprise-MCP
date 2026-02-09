/**
 * Tests for HTML utilities
 */

import { describe, it, expect } from "vitest";
import { escapeHtml } from "./html.js";

describe("escapeHtml", () => {
  it("should escape ampersands", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("should escape less than", () => {
    expect(escapeHtml("foo < bar")).toBe("foo &lt; bar");
  });

  it("should escape greater than", () => {
    expect(escapeHtml("foo > bar")).toBe("foo &gt; bar");
  });

  it("should escape double quotes", () => {
    expect(escapeHtml('foo " bar')).toBe("foo &quot; bar");
  });

  it("should escape multiple special characters", () => {
    expect(escapeHtml('<div class="test">A & B</div>')).toBe(
      "&lt;div class=&quot;test&quot;&gt;A &amp; B&lt;/div&gt;"
    );
  });

  it("should handle empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("should handle string with no special characters", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });
});
