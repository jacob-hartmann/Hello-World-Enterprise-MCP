import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { RunbookRepository } from "./runbook-repository.js";

describe("RunbookRepository", () => {
  it("stores and lists runbooks", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new RunbookRepository(db.connection());

    repository.create({
      id: "rb-1",
      createdAt: new Date().toISOString(),
      title: "Runbook",
      actions: ["a", "b"],
    });

    const result = repository.listRecent(10);
    expect(result[0]?.id).toBe("rb-1");
    expect(result[0]?.actions).toEqual(["a", "b"]);
  });
});
