import { describe, expect, it } from "vitest";
import { MetricsRepository } from "./metrics-repository.js";

describe("MetricsRepository", () => {
  it("increments and snapshots counters", () => {
    const repository = new MetricsRepository();
    repository.increment("requests_total");
    repository.increment("requests_total");
    repository.increment("success_total", 3);

    const snapshot = repository.snapshot();
    expect(snapshot.counters["requests_total"]).toBe(2);
    expect(snapshot.counters["success_total"]).toBe(3);
  });
});
