# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- v3 distributed-theater orchestration with always-on Saga + Compensation workflow
- Deterministic chaos engine with seed-based fault injection and bounded jitter
- SQLite durability layer (`node:sqlite`) with migrations and replayable event log
- Idempotency repository and deduplicated delivery semantics
- Projection replay service with deterministic checksum snapshots
- New ops tools: `hello.enterprise.v2.incident.simulate` and `hello.enterprise.v2.replay.projections`
- New ops resources: `hello://v2/topology`, `hello://v2/runbooks`, and `hello://v2/incidents`
- Expanded orchestrator request schema with required `delivery`, `traceContext`, `routing`, `saga`, `chaos`, and `governance` envelopes
- Expanded orchestrator response fields: `sagaExecution`, `routingDecision`, `chaosReport`, `durability`, `runbook`, and `incident`
- Additional test coverage for saga paths, chaos determinism, replay/projection, idempotency, and ops surfaces

### Changed

- Kept existing v2 MCP identifiers while expanding contracts and runtime behavior for v3 architecture
- Updated README examples for distributed-theater payloads and operations tooling
- Added local SQLite path defaults and gitignore rules for durable runtime storage

### Fixed

### Security
