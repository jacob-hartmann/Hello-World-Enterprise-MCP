import type { ChaosDecision } from "../contracts/v2.js";
import { hashString } from "../utils/hash.js";

export interface ChaosInput {
  seedBase: string;
  step: string;
  attempt: number;
  partitionSimulation: boolean;
  latencyJitterMs: number;
}

export class ChaosEngine {
  public decide(input: ChaosInput): ChaosDecision {
    const deterministicKey = hashString(
      `${input.seedBase}:${input.step}:${input.attempt}`
    );
    const signal = parseInt(deterministicKey.slice(0, 8), 16);
    const simulatedLatencyMs =
      input.latencyJitterMs === 0 ? 0 : signal % (input.latencyJitterMs + 1);
    const timeoutTriggered = signal % 23 === 0;
    const partitionTriggered =
      input.partitionSimulation && input.step === "RouteRegionStep"
        ? signal % 5 === 0
        : false;

    const injectedFaults: string[] = [];
    if (timeoutTriggered) {
      injectedFaults.push(`timeout:${input.step}`);
    }
    if (partitionTriggered) {
      injectedFaults.push(`partition:${input.step}`);
    }
    if (simulatedLatencyMs > 0) {
      injectedFaults.push(`latency:${input.step}:${simulatedLatencyMs}ms`);
    }

    return {
      step: input.step,
      deterministicKey,
      simulatedLatencyMs,
      injectedFaults,
      timeoutTriggered,
      partitionTriggered,
    };
  }
}
