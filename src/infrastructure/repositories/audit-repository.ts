import { AUDIT_EVENT_RETENTION_LIMIT } from "../../constants.js";
import type { WorkflowEvent } from "../events/event-bus.js";

export class AuditRepository {
  private readonly events: WorkflowEvent[] = [];

  public append(event: WorkflowEvent): void {
    this.events.push(event);
    if (this.events.length > AUDIT_EVENT_RETENTION_LIMIT) {
      this.events.shift();
    }
  }

  public listRecent(limit = AUDIT_EVENT_RETENTION_LIMIT): WorkflowEvent[] {
    return this.events.slice(-limit);
  }

  public count(): number {
    return this.events.length;
  }
}
