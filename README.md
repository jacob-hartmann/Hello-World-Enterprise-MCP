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

The server provides two greeting tools:

#### `hello.world`

A simple, straightforward "Hello World" greeting. No parameters, no complexity, just pure greeting functionality.

**Usage:**

```typescript
// Returns: "Hello World"
await client.callTool("hello.world", {});
```

#### `hello.enterprise.greet`

An over-engineered greeting system with enterprise-grade features:

- **Configurable recipient** - Who to greet (default: "World")
- **Formality levels** - Choose from casual, professional, or formal
- **Timestamp support** - Include ISO 8601 timestamps in responses
- **Metadata extensibility** - Add custom key-value pairs
- **Future-proof locale support** - Reserved parameter for i18n (not yet implemented)

**Parameters:**

- `recipient` (string, optional) - The recipient of the greeting
- `formality` (enum, optional) - One of: "casual", "professional", "formal"
- `includeTimestamp` (boolean, optional) - Include ISO 8601 timestamp
- `locale` (string, optional) - Reserved for future internationalization
- `metadata` (object, optional) - Custom key-value pairs

**Example:**

```typescript
await client.callTool("hello.enterprise.greet", {
  recipient: "Enterprise Architect",
  formality: "formal",
  includeTimestamp: true,
  metadata: {
    department: "Engineering",
    project: "HelloWorld-v2.0",
  },
});
```

**Response:**

```json
{
  "greeting": "Greetings, Enterprise Architect",
  "edition": "Hello World (Enterprise Edition)",
  "formality": "formal",
  "timestamp": "2026-02-09T12:34:56.789Z",
  "metadata": {
    "department": "Engineering",
    "project": "HelloWorld-v2.0"
  }
}
```

### Resources

#### `hello://status`

Server status and metadata resource. Provides real-time information about the server's operational state and capabilities.

**Returns:**

```json
{
  "server": "hello-world-enterprise-mcp",
  "version": "0.1.0",
  "description": "A parody MCP server demonstrating enterprise over-engineering",
  "status": "operational",
  "timestamp": "2026-02-09T12:34:56.789Z",
  "capabilities": {
    "tools": ["hello.world", "hello.enterprise.greet"],
    "resources": ["hello://status"],
    "prompts": ["hello.greet"]
  }
}
```

### Prompts

#### `hello.greet`

Guided prompt for choosing between simple and enterprise greeting options.

**Parameters:**

- `recipient` (string, optional) - Who to greet
- `useEnterprise` (boolean, optional) - Use enterprise features

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

## Future "Enterprise Features"

This is just the beginning. Future releases may include:

- Dependency Injection Container
- Abstract Factory Pattern for Greetings
- Strategy Pattern for Formality Selection
- Observer Pattern for Greeting Events
- Repository Pattern for Greeting Storage
- Saga Pattern for Distributed Greetings
- Circuit Breaker for Greeting Resilience
- Comprehensive Logging Framework
- Metrics and Observability Dashboard
- Multi-Region Greeting Replication

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

This is a parody project with no guaranteed support. See [SUPPORT.md](./SUPPORT.md) for details.

## Security

For security concerns, please see [SECURITY.md](./SECURITY.md).
