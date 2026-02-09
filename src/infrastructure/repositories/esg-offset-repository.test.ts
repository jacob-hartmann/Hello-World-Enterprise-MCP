import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { EsgOffsetRepository } from "./esg-offset-repository.js";

describe("EsgOffsetRepository", () => {
  it("stores and lists offsets", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new EsgOffsetRepository(db.connection());
    repository.create({
      requestId: "req-1",
      sagaId: "saga-1",
      provider: "parody-offsets-inc",
      estimatedCo2Grams: 123,
      offsetPurchasedGrams: 123,
      certificateId: "esg-1",
      createdAt: new Date().toISOString(),
    });

    expect(repository.count()).toBe(1);
    expect(repository.latest()?.certificateId).toBe("esg-1");
    expect(repository.listRecent(10)[0]?.provider).toBe("parody-offsets-inc");
  });
});
