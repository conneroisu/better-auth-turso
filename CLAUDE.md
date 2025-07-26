# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Better Auth Turso adapter** - a database adapter that enables [Better Auth](https://better-auth.com) to work with [Turso](https://turso.tech/) databases (built on libSQL). The adapter provides full compatibility with Better Auth features including sessions, users, accounts, and verification tokens.

## Core Architecture

- **Main adapter**: `src/index.ts` contains the `tursoAdapter` function and core implementation
- **Database operations**: Uses `@libsql/client` for Turso database operations with automatic table creation and column management
- **Type safety**: Full TypeScript support with proper type inference
- **Testing strategy**: Comprehensive test suite including unit, integration, property-based, and performance tests

## Key Dependencies

- `@libsql/client`: Official libSQL client for Turso databases
- `better-auth`: Peer dependency for adapter interface  
- `vitest`: Testing framework (not Jest or Bun test)
- `fast-check`: Property-based testing library

**⚠️ DEPRECATED PACKAGES - DO NOT USE:**
- `@tursodatabase/turso` - Has connection isolation issues, removed from project

**IMPORTANT**: This adapter uses `@libsql/client` which is the official client for Turso databases. Turso is built on libSQL and provides a drop-in replacement for SQLite with additional features like edge replication.

## Development Commands

**Building:**
```bash
npm run build          # Compile TypeScript to dist/
npm run dev           # Watch mode compilation
npm run typecheck     # Type checking without compilation
```

**Testing:**
```bash
npm run test              # Run all tests with vitest
npm run test:watch        # Watch mode for tests
npm run test:coverage     # Generate coverage report
npm run test:integration  # Integration tests only
npm run test:unit        # Unit tests only  
npm run test:property    # Property-based tests only
npm run test:run         # Single test run (no watch)
```

**Code Quality:**
```bash
npm run lint          # ESLint checking
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
npm run check         # Run typecheck + lint + format:check
npm run precommit     # Full check + test run
```

## Test Configuration

The project uses multiple Vitest configurations:
- `vitest.config.ts` - Main configuration with happy-dom environment
- `vitest.integration.config.ts` - Integration tests with node environment
- `vitest.unit.config.ts` - Unit tests only
- `vitest.property.config.ts` - Property-based tests only

All tests have a 30-60 second timeout due to database operations. Integration tests require longer timeout (60s).

## Adapter Implementation Details

The Turso adapter implements the Better Auth adapter interface with these key features:

- **Dynamic table creation**: Automatically creates tables for user, session, account, verification models when needed
- **Dynamic column management**: Adds columns to existing tables as needed for new fields
- **Data serialization**: Handles conversion between JavaScript types and SQLite-compatible values
- **Embedded replicas support**: Works with local SQLite files that sync to remote Turso databases
- **Debug logging**: Configurable debug output for all adapter operations

## Configuration Options

The adapter accepts either:
- `client`: Pre-configured Turso client instance
- `config`: Turso client configuration object for creating new client
- `debugLogs`: Enable debug logging (boolean or object with operation-specific flags)
- `usePlural`: Use plural table names (default: false)

## Better Auth Integration

When working with Better Auth integration:
- The adapter is designed to pass the official Better Auth adapter test suite
- All standard Better Auth models are supported (user, session, account, verification)
- Custom fields are automatically handled through dynamic column creation
- JSON and complex data types are serialized/deserialized automatically

## Code Style

Follow "Your Style" philosophy emphasizing safety, performance, and developer experience:
- Explicit error handling with meaningful error messages
- Type safety with proper TypeScript usage
- Performance considerations for database operations
- Clear naming conventions and documentation
