/**
 * Shared Constants
 *
 * Centralized constants used across the application.
 */

// ---------------------------------------------------------------------------
// Server Identity
// ---------------------------------------------------------------------------

/** Default greeting message */
export const DEFAULT_GREETING = "Hello World";

/** Enterprise greeting message */
export const ENTERPRISE_GREETING = "Hello World (Enterprise Edition)";

/** v2 orchestrator tool name */
export const ORCHESTRATOR_TOOL_NAME = "hello.enterprise.v2.orchestrate";

/** v2 prompt name */
export const ORCHESTRATOR_PROMPT_NAME = "hello.v2.orchestrate";

/** v2 status resource URI */
export const STATUS_RESOURCE_URI = "hello://v2/status";

/** v2 audit resource URI */
export const AUDIT_RESOURCE_URI = "hello://v2/audit";

/** v2 metrics resource URI */
export const METRICS_RESOURCE_URI = "hello://v2/metrics";

/** Supported locales for strict-default compliance profile */
export const SUPPORTED_LOCALES = ["en-US"] as const;

/** Retained audit event count */
export const AUDIT_EVENT_RETENTION_LIMIT = 100;

// ---------------------------------------------------------------------------
// Timeouts
// ---------------------------------------------------------------------------

/** Timeout for operations in milliseconds (30 seconds) */
export const OPERATION_TIMEOUT_MS = 30_000;
