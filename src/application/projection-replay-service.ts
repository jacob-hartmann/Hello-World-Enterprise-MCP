import { performance } from "node:perf_hooks";
import type { ReplayResult } from "../contracts/v2.js";
import type { EventLogRepository } from "../infrastructure/repositories/event-log-repository.js";
import type { ProjectionRepository } from "../infrastructure/repositories/projection-repository.js";
import { canonicalStringify, hashString } from "../utils/hash.js";

export class ProjectionReplayService {
  public constructor(
    private readonly eventLogRepository: EventLogRepository,
    private readonly projectionRepository: ProjectionRepository
  ) {}

  public replay(): ReplayResult {
    const startedAt = performance.now();
    const events = this.eventLogRepository.replayAll();

    const counters: Record<string, number> = {};
    for (const event of events) {
      const key = `event_${event.eventType.replace(".", "_")}_total`;
      counters[key] = (counters[key] ?? 0) + 1;
    }

    const duration = Math.round(performance.now() - startedAt);
    const previous = this.projectionRepository.load();
    const checksum = hashString(
      canonicalStringify({
        replayCheckpoint: events.length,
        counters,
      })
    );

    const snapshot: ReplayResult = {
      projectionVersion: previous.projectionVersion + 1,
      replayCheckpoint: events.length,
      replayDurationMs: duration,
      checksum,
      counters,
    };
    this.projectionRepository.save(snapshot);

    return snapshot;
  }

  public snapshot(): ReplayResult {
    return this.projectionRepository.load();
  }
}
