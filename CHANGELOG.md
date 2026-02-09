# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enterprise Orchestrator v2 architecture with DI container, strategy factory, policy engine, in-memory event bus, audit repository, and metrics repository
- New v2 tool `hello.enterprise.v2.orchestrate` with strict request schema and fail-closed error envelope
- New v2 resources `hello://v2/status`, `hello://v2/audit`, and `hello://v2/metrics`
- New prompt `hello.v2.orchestrate` for orchestrator payload guidance
- Domain, infrastructure, contract, and application-layer unit tests for v2 components

### Changed

- **Breaking:** Removed v1 interfaces `hello.world`, `hello.enterprise.greet`, `hello://status`, and `hello.greet`
- Updated server instructions and capability reporting to v2 namespace
- Bumped package version to `1.0.0` to reflect breaking interface changes

### Fixed

### Security
