import { describe, expect, it } from "vitest";
import { AuditRepository } from "./audit-repository.js";

describe("AuditRepository", () => {
  it("appends and lists events", () => {
    const repository = new AuditRepository();
    repository.append({
      name: "request.received",
      timestamp: new Date().toISOString(),
      requestId: "r-1",
      traceId: "t-1",
    });

    expect(repository.count()).toBe(1);
    expect(repository.listRecent()).toHaveLength(1);
  });
});
