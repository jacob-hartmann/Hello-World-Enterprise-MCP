import { SUPPORTED_LOCALES } from "../constants.js";
import type { OrchestrateRequest, PolicyOutcome } from "../contracts/v2.js";

const MAX_METADATA_ENTRIES = 16;

export class PolicyEngine {
  public evaluate(request: OrchestrateRequest): PolicyOutcome {
    const decisions: string[] = [];

    if (!(SUPPORTED_LOCALES as readonly string[]).includes(request.locale)) {
      return {
        outcome: "denied",
        decisions: [`Locale "${request.locale}" is not allowed`],
      };
    }
    decisions.push(`Locale "${request.locale}" accepted`);

    if (request.policies.enforceMetadataRules) {
      const metadataEntryCount = Object.keys(request.metadata ?? {}).length;
      if (metadataEntryCount > MAX_METADATA_ENTRIES) {
        return {
          outcome: "denied",
          decisions: [
            `Metadata contains ${metadataEntryCount} entries; maximum is ${MAX_METADATA_ENTRIES}`,
          ],
        };
      }

      decisions.push(
        `Metadata rules enforced (${metadataEntryCount} entries within limit)`
      );
    } else {
      decisions.push("Metadata rules not enforced by policy");
    }

    return {
      outcome: "allowed",
      decisions,
    };
  }
}
