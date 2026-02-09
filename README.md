# Hello World Enterprise MCP Server

[![CI](https://github.com/jacob-hartmann/hello-world-enterprise-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/jacob-hartmann/hello-world-enterprise-mcp/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/jacob-hartmann/hello-world-enterprise-mcp)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that's a parody of enterprise over-engineering. This project demonstrates what happens when you apply every enterprise software pattern, abstraction layer, and "best practice" to the simple task of saying "Hello World". Please, please don't deploy this in production.

**Warning:** This is a satirical project. It intentionally over-engineers simple concepts for comedic and educational purposes.

## Quick Start

### Prerequisites

- Node.js v22 or higher
- An MCP client (Claude Desktop, Claude Code, Cursor, etc.)

### Installation

Add to your MCP client configuration:

#### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hello-world-enterprise": {
      "command": "npx",
      "args": ["-y", "hello-world-enterprise-mcp"]
    }
  }
}
```

#### Claude Code (CLI)

Add to `~/.claude/mcp.json` or project-level:

```json
{
  "mcpServers": {
    "hello-world-enterprise": {
      "command": "npx",
      "args": ["-y", "hello-world-enterprise-mcp"]
    }
  }
}
```

#### Cursor

In Cursor settings, add an MCP server:

```json
{
  "mcpServers": {
    "hello-world-enterprise": {
      "command": "npx",
      "args": ["-y", "hello-world-enterprise-mcp"]
    }
  }
}
```

## Features

### Tools

The server provides one intentionally over-engineered v2 orchestration tool:

#### `hello.enterprise.v2.orchestrate`

Executes a strict enterprise greeting workflow with:

- request validation stage
- policy enforcement stage (fail closed)
- strategy-based greeting generation
- event publication + audit capture
- metrics aggregation
- response assembly with trace/audit/metrics envelope

**Request payload:**

- `requestId` (string, optional)
- `recipient` (string, required)
- `formality` (`"casual" | "professional" | "formal"`, required)
- `locale` (string, required, strict allowlist)
- `includeTimestamp` (boolean, required)
- `metadata` (`Record<string, string>`, optional)
- `policies` (required)
- `telemetry` (required)

**Example:**

```typescript
await client.callTool("hello.enterprise.v2.orchestrate", {
  recipient: "Enterprise Architect",
  formality: "formal",
  locale: "en-US",
  includeTimestamp: true,
  metadata: {
    department: "Engineering",
    project: "HelloWorld-v2.0",
  },
  policies: {
    complianceProfile: "strict-default",
    enforceMetadataRules: true,
  },
  telemetry: {
    includeTrace: true,
    includePolicyDecisions: true,
  },
});
```

**Success response (structured JSON text):**

```json
{
  "requestId": "7ea4ea4f-73ab-4c63-a406-b9669ca12633",
  "traceId": "49f11a5b-cafb-41f7-ac62-84ff10940c76",
  "greeting": {
    "rendered": "Greetings, Enterprise Architect",
    "edition": "Hello World (Enterprise Edition)",
    "locale": "en-US",
    "formality": "formal",
    "timestamp": "2026-02-09T12:34:56.789Z"
  },
  "policy": {
    "outcome": "allowed",
    "decisions": [
      "Locale \"en-US\" accepted",
      "Metadata rules enforced (2 entries within limit)"
    ]
  },
  "audit": {
    "eventCount": 5,
    "storedIn": "in-memory"
  },
  "metrics": {
    "counters": {
      "requests_total": 1
    }
  }
}
```

**Fail-closed error response:**

```json
{
  "requestId": "external-id",
  "traceId": "3f85f89f-204f-4c00-aefc-060197dcb132",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request payload failed schema validation",
    "details": {}
  }
}
```

### Resources

#### `hello://v2/status`

Operational status, package metadata, health snapshot, and v2 capabilities.

#### `hello://v2/audit`

In-memory append-only event stream (recent retained events).

#### `hello://v2/metrics`

In-memory counter snapshot for requests, outcomes, and formality dimensions.

**Returns:**

```json
{
  "server": "hello-world-enterprise-mcp",
  "version": "1.0.0",
  "description": "A parody MCP server demonstrating enterprise over-engineering",
  "status": "operational",
  "timestamp": "2026-02-09T12:34:56.789Z",
  "health": {
    "eventSubscriptions": 1,
    "auditEventCount": 12
  },
  "capabilities": {
    "tools": ["hello.enterprise.v2.orchestrate"],
    "resources": [
      "hello://v2/status",
      "hello://v2/audit",
      "hello://v2/metrics"
    ],
    "prompts": ["hello.v2.orchestrate"]
  }
}
```

### Prompts

#### `hello.v2.orchestrate`

Guided prompt for constructing a strict-default orchestration payload.

**Parameters:**

- `recipient` (string, optional) - Who to greet
- `formality` (enum, optional) - Greeting formality
- `locale` (string, optional) - Locale (strict allowlist)

## Why This Exists

This project is a humorous take on enterprise software development patterns. It's meant to:

1. **Educate** - Demonstrate MCP server patterns in an accessible way
2. **Entertain** - Poke fun at over-engineering tendencies
3. **Inspire** - Show what's possible with the Model Context Protocol

## Development

### Setup

```bash
git clone https://github.com/jacob-hartmann/hello-world-enterprise-mcp.git
cd hello-world-enterprise-mcp
pnpm install
```

### Scripts

- `pnpm dev` - Watch mode for development
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm check` - Run all quality checks

### Testing

```bash
pnpm test
pnpm test:coverage
```

## Breaking Changes in v2

Removed v1 interfaces:

- `hello.world`
- `hello.enterprise.greet`
- `hello://status`
- `hello.greet`

Replacements:

- `hello.enterprise.v2.orchestrate`
- `hello://v2/status`
- `hello://v2/audit`
- `hello://v2/metrics`
- `hello.v2.orchestrate`

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

This is a parody project with no guaranteed support. See [SUPPORT.md](./SUPPORT.md) for details.

## Security

For security concerns, please see [SECURITY.md](./SECURITY.md).
