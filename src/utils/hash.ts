import { createHash } from "node:crypto";

export function hashString(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function canonicalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item));
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => {
        return a.localeCompare(b);
      }
    );
    const normalized: Record<string, unknown> = {};
    for (const [key, entryValue] of entries) {
      normalized[key] = canonicalizeValue(entryValue);
    }
    return normalized;
  }

  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalizeValue(value));
}
