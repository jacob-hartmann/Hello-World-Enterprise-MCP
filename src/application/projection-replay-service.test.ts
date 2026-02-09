import { describe, expect, it } from "vitest";
import { EnterpriseDatabase } from "../infrastructure/sqlite/database.js";
import { EventLogRepository } from "../infrastructure/repositories/event-log-repository.js";
import { ProjectionRepository } from "../infrastructure/repositories/projection-repository.js";
import { ProjectionReplayService } from "./projection-replay-service.js";

describe("ProjectionReplayService", () => {
  it("builds projections from event log", () => {
    const db = new EnterpriseDatabase(":memory:");
    const eventLog = new EventLogRepository(db.connection());
    const projection = new ProjectionRepository(db.connection());
    const service = new ProjectionReplayService(eventLog, projection);

    eventLog.append({
      timestamp: new Date().toISOString(),
      sagaId: "s1",
      requestId: "r1",
      traceId: "t1",
      step: "ValidateRequestStep",
      eventType: "step.completed",
    });
    const result = service.replay();
    expect(result.projectionVersion).toBe(1);
    expect(result.replayCheckpoint).toBe(1);
  });

  it("returns deterministic checksum for same replay input", () => {
    const db = new EnterpriseDatabase(":memory:");
    const eventLog = new EventLogRepository(db.connection());
    const projection = new ProjectionRepository(db.connection());
    const service = new ProjectionReplayService(eventLog, projection);

    eventLog.append({
      timestamp: new Date().toISOString(),
      sagaId: "s1",
      requestId: "r1",
      traceId: "t1",
      step: "ValidateRequestStep",
      eventType: "step.completed",
    });

    const first = service.replay().checksum;
    const second = service.replay().checksum;
    expect(first).toBe(second);
  });
});
