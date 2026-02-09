import { describe, expect, it } from "vitest";
import {
  AUDIT_RESOURCE_URI,
  DEFAULT_GREETING,
  ENTERPRISE_GREETING,
  INCIDENTS_RESOURCE_URI,
  INCIDENT_SIMULATION_TOOL_NAME,
  METRICS_RESOURCE_URI,
  OPERATION_TIMEOUT_MS,
  ORCHESTRATOR_PROMPT_NAME,
  ORCHESTRATOR_TOOL_NAME,
  PROJECTION_REPLAY_TOOL_NAME,
  RUNBOOKS_RESOURCE_URI,
  SQLITE_DB_PATH,
  STATUS_RESOURCE_URI,
  SUPPORTED_LOCALES,
  TOPOLOGY_RESOURCE_URI,
} from "./constants.js";

describe("constants", () => {
  it("exports legacy display constants", () => {
    expect(DEFAULT_GREETING).toBe("Hello World");
    expect(ENTERPRISE_GREETING).toBe("Hello World (Enterprise Edition)");
  });

  it("exports v2 public interface identifiers", () => {
    expect(ORCHESTRATOR_TOOL_NAME).toBe("hello.enterprise.v2.orchestrate");
    expect(INCIDENT_SIMULATION_TOOL_NAME).toBe(
      "hello.enterprise.v2.incident.simulate"
    );
    expect(PROJECTION_REPLAY_TOOL_NAME).toBe(
      "hello.enterprise.v2.replay.projections"
    );
    expect(ORCHESTRATOR_PROMPT_NAME).toBe("hello.v2.orchestrate");
    expect(STATUS_RESOURCE_URI).toBe("hello://v2/status");
    expect(AUDIT_RESOURCE_URI).toBe("hello://v2/audit");
    expect(METRICS_RESOURCE_URI).toBe("hello://v2/metrics");
    expect(TOPOLOGY_RESOURCE_URI).toBe("hello://v2/topology");
    expect(RUNBOOKS_RESOURCE_URI).toBe("hello://v2/runbooks");
    expect(INCIDENTS_RESOURCE_URI).toBe("hello://v2/incidents");
  });

  it("exports strict locale and storage defaults", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en-US"]);
    expect(SQLITE_DB_PATH).toContain(".sqlite");
    expect(OPERATION_TIMEOUT_MS).toBe(30_000);
  });
});
