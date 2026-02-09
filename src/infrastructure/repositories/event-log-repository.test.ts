import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../sqlite/database.js";
import { EventLogRepository } from "./event-log-repository.js";

describe("EventLogRepository", () => {
  it("appends and replays events", () => {
    const db = new EnterpriseDatabase(":memory:");
    const repository = new EventLogRepository(db.connection());

    const offset = repository.append({
      timestamp: new Date().toISOString(),
      sagaId: "saga-1",
      requestId: "req-1",
      traceId: "trace-1",
      step: "ValidateRequestStep",
      eventType: "step.completed",
      payload: { ok: true },
    });

    expect(offset).toBeGreaterThan(0);
    expect(repository.count()).toBe(1);
    expect(repository.latestOffset()).toBe(1);
    expect(repository.replayAll()).toHaveLength(1);
  });
});
