import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { IncidentRepository } from "./incident-repository.js";

describe("IncidentRepository", () => {
  it("stores and lists incidents", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new IncidentRepository(db.connection());

    repository.create({
      id: "inc-1",
      createdAt: new Date().toISOString(),
      severity: "sev-2",
      title: "Test incident",
      details: "details",
    });

    expect(repository.count()).toBe(1);
    expect(repository.listRecent(10)[0]?.id).toBe("inc-1");
  });
});
