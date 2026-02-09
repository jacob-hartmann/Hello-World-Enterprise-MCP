import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { SagaRepository } from "./saga-repository.js";

describe("SagaRepository", () => {
  it("starts and updates saga status", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new SagaRepository(db.connection());

    repository.startSaga("s-1", "r-1", "us-east-1");
    repository.updateStatus("s-1", "completed", "eu-west-1");

    const saga = repository.getSaga("s-1");
    expect(saga?.status).toBe("completed");
    expect(saga?.region).toBe("eu-west-1");
  });
});
