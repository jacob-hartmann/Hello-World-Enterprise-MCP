export interface MetricsSnapshot {
  counters: Record<string, number>;
}

export class MetricsRepository {
  private readonly counters = new Map<string, number>();

  public increment(counter: string, value = 1): void {
    const current = this.counters.get(counter) ?? 0;
    this.counters.set(counter, current + value);
  }

  public snapshot(): MetricsSnapshot {
    const counters: Record<string, number> = {};
    this.counters.forEach((value, key) => {
      counters[key] = value;
    });
    return { counters };
  }
}
