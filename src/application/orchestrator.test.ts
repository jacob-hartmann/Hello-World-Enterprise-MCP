import { describe, expect, it } from "vitest";
import { createValidRequest } from "../__test-helpers__/request-factory.js";
import { composeApplication } from "./composition-root.js";

describe("GreetingOrchestrator", () => {
  it("returns processed response on first request", () => {
    const services = composeApplication({ dbPath: ":memory:" });
    const result = services.orchestrator.execute(createValidRequest());

    expect("error" in result).toBe(false);
    if ("error" in result) {
      throw new Error("Expected success response");
    }

    expect(result.deliveryStatus).toBe("processed");
    expect(result.sagaExecution.status).toBe("completed");
    expect(result.durability.replayable).toBe(true);
    expect(
      result.enterpriseMetadata.genAiSentimentScore
    ).toBeGreaterThanOrEqual(0);
    expect(result.enterpriseMetadata.aiModelId).toBe(
      "deterministic-faux-llm-v1"
    );
  });

  it("returns deduplicated response for repeated idempotency key", () => {
    const services = composeApplication({ dbPath: ":memory:" });
    const request = createValidRequest({
      delivery: {
        idempotencyKey: "same-key",
        timeoutMs: 3000,
        retryBudget: 2,
      },
    });
    const first = services.orchestrator.execute(request);
    const second = services.orchestrator.execute(request);

    expect("error" in first).toBe(false);
    expect("error" in second).toBe(false);
    if ("error" in second) {
      throw new Error("Expected deduplicated success response");
    }
    expect(second.deliveryStatus).toBe("deduplicated");
  });

  it("returns idempotency conflict for same key with different payload", () => {
    const services = composeApplication({ dbPath: ":memory:" });
    const base = createValidRequest({
      delivery: {
        idempotencyKey: "conflict-key",
        timeoutMs: 3000,
        retryBudget: 2,
      },
    });
    services.orchestrator.execute(base);

    const changed = createValidRequest({
      recipient: "Changed",
      delivery: {
        idempotencyKey: "conflict-key",
        timeoutMs: 3000,
        retryBudget: 2,
      },
    });
    const result = services.orchestrator.execute(changed);

    expect("error" in result).toBe(true);
    if (!("error" in result)) {
      throw new Error("Expected error response");
    }
    expect(result.error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("deduplicates when defaults are omitted vs explicit", () => {
    const services = composeApplication({ dbPath: ":memory:" });
    const explicit = createValidRequest({
      delivery: {
        idempotencyKey: "defaults-key",
        timeoutMs: 3000,
        retryBudget: 2,
      },
    });
    const first = services.orchestrator.execute(explicit);
    expect("error" in first).toBe(false);

    const {
      aiEnhancement: _aiEnhancement,
      esgOffset: _esgOffset,
      moatScore: _moatScore,
      ...omittedDefaults
    } = explicit;
    const second = services.orchestrator.execute(omittedDefaults);
    expect("error" in second).toBe(false);
    if ("error" in second) {
      throw new Error("Expected deduplicated success response");
    }
    expect(second.deliveryStatus).toBe("deduplicated");
  });
});
