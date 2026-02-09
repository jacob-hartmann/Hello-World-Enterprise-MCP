export type WorkflowEventName =
  | "request.received"
  | "request.validated"
  | "policy.allowed"
  | "policy.denied"
  | "response.generated"
  | "response.failed";

export interface WorkflowEvent {
  name: WorkflowEventName;
  timestamp: string;
  requestId: string;
  traceId: string;
  details?: Record<string, unknown>;
}

type EventHandler = (event: WorkflowEvent) => void;
type SubscriptionKey = WorkflowEventName | "*";

export class EventBus {
  private readonly handlers = new Map<SubscriptionKey, Set<EventHandler>>();

  public publish(event: WorkflowEvent): void {
    this.getHandlers(event.name).forEach((handler) => {
      handler(event);
    });

    this.getHandlers("*").forEach((handler) => {
      handler(event);
    });
  }

  public subscribe(name: SubscriptionKey, handler: EventHandler): () => void {
    const handlerSet = this.getHandlers(name);
    handlerSet.add(handler);

    return () => {
      handlerSet.delete(handler);
    };
  }

  public handlerCount(): number {
    return Array.from(this.handlers.values()).reduce((count, handlers) => {
      return count + handlers.size;
    }, 0);
  }

  private getHandlers(name: SubscriptionKey): Set<EventHandler> {
    const existing = this.handlers.get(name);
    if (existing) {
      return existing;
    }

    const created = new Set<EventHandler>();
    this.handlers.set(name, created);
    return created;
  }
}
