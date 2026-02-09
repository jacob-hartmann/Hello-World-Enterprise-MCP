import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { IdempotencyRepository } from "./idempotency-repository.js";

describe("IdempotencyRepository", () => {
  it("stores and retrieves idempotency records", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new IdempotencyRepository(db.connection());

    repository.save("k1", "hash1", '{"ok":true}');
    const record = repository.find("k1");
    expect(record?.requestHash).toBe("hash1");
    expect(record?.responseJson).toContain("ok");
  });
});
