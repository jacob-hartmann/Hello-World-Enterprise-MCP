import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { AiEnrichmentRepository } from "./ai-enrichment-repository.js";

describe("AiEnrichmentRepository", () => {
  it("stores and retrieves enrichment records", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new AiEnrichmentRepository(db.connection());
    repository.create({
      requestId: "req-1",
      sagaId: "saga-1",
      traceId: "trace-1",
      profile: "investor-friendly",
      modelId: "deterministic-faux-llm-v1",
      promptFingerprint: "abc",
      enhancedGreeting: "Hello World",
      sentimentScore: 88,
      tokenEstimate: 42,
      createdAt: new Date().toISOString(),
    });

    expect(repository.count()).toBe(1);
    expect(repository.latest()?.promptFingerprint).toBe("abc");
    expect(repository.listRecent(10)[0]?.modelId).toBe(
      "deterministic-faux-llm-v1"
    );
  });
});
