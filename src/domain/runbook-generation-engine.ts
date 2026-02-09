import { canonicalStringify, hashString } from "../utils/hash.js";

const ACTION_POOL = [
  "Assemble virtual war-room with governance observer.",
  "Capture deterministic replay checksum for investor packet.",
  "Compare regional failover telemetry against policy envelope.",
  "Validate idempotency ledger for payload drift anomalies.",
  "Escalate to architecture theater review board.",
  "Issue carbon-neutral remediation narrative to stakeholders.",
  "Run synthetic recovery game-day before closeout.",
  "Archive enriched traces in compliance annex.",
] as const;

export const RUNBOOK_GENERATOR_ID = "deterministic-runbook-synth-v1";

export interface RunbookGenerationInput {
  incidentId: string;
  severity: "sev-3" | "sev-2" | "sev-1";
  title: string;
  details: string;
  code: string;
}

export interface RunbookGenerationResult {
  title: string;
  actions: string[];
  fingerprint: string;
  generatorId: typeof RUNBOOK_GENERATOR_ID;
}

export class RunbookGenerationEngine {
  public generate(input: RunbookGenerationInput): RunbookGenerationResult {
    const fingerprint = hashString(canonicalStringify(input));
    const signal = parseInt(fingerprint.slice(0, 8), 16);
    const actionCount = 3 + (signal % 3);
    const actions: string[] = [];
    for (let idx = 0; idx < actionCount; idx += 1) {
      const pick = ACTION_POOL[(signal + idx) % ACTION_POOL.length];
      actions.push(`${idx + 1}. ${pick ?? ACTION_POOL[0]}`);
    }

    return {
      title: `Runbook for ${input.code} (${input.severity})`,
      actions,
      fingerprint,
      generatorId: RUNBOOK_GENERATOR_ID,
    };
  }
}
