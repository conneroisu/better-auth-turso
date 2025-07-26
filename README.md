# Better Auth Turso Adapter

A [Better Auth](https://better-auth.com) database adapter for [Turso](https://turso.tech/) - the edge database built on libSQL.

## Features

- 🚀 **High Performance**: Built on libSQL for maximum speed and efficiency
- 🌍 **Edge Ready**: Deploy databases globally with Turso's edge network
- 🔄 **Embedded Replicas**: Local SQLite with remote sync for optimal performance
- 📱 **Full Better Auth Support**: Complete compatibility with all Better Auth features
- 🛡️ **Type Safe**: Full TypeScript support with proper type inference
- 🧪 **Well Tested**: Comprehensive test suite including official Better Auth adapter tests

## Installation

```bash
npm install better-auth-turso @libsql/client
```

## Quick Start

### Remote Database

```typescript
import { betterAuth } from "better-auth";
import { tursoAdapter } from "better-auth-turso";

export const auth = betterAuth({
  database: tursoAdapter({
    config: {
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    },
  }),
  // ... other Better Auth options
});
```

### Local Database with Remote Sync (Embedded Replicas)

```typescript
import { betterAuth } from "better-auth";
import { tursoAdapter } from "better-auth-turso";

export const auth = betterAuth({
  database: tursoAdapter({
    config: {
      url: "file:local.db",
      syncUrl: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
      syncInterval: 60000, // Sync every minute
    },
  }),
  // ... other Better Auth options
});
```

### Using Existing Client

```typescript
import { betterAuth } from "better-auth";
import { tursoAdapter } from "better-auth-turso";
import { createClient } from "@libsql/client";

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const auth = betterAuth({
  database: tursoAdapter({
    client: tursoClient,
  }),
  // ... other Better Auth options
});
```

## Configuration Options

### TursoAdapterConfig

| Option | Type | Description |
|--------|------|-------------|
| `client` | `Client` | Pre-configured Turso client instance |
| `config` | `Config` | Turso client configuration (used if `client` not provided) |
| `debugLogs` | `AdapterDebugLogs` | Enable debug logging for adapter operations |
| `usePlural` | `boolean` | Use plural table names (default: `false`) |

**Note**: Either `client` or `config` must be provided.

### Debug Logs

Enable debug logging for specific operations:

```typescript
tursoAdapter({
  config: { /* ... */ },
  debugLogs: {
    create: true,
    update: true,
    findOne: true,
    // ... other operations
  },
})
```

Or enable all debug logs:

```typescript
tursoAdapter({
  config: { /* ... */ },
  debugLogs: true,
})
```

## Database Schema

Generate the required database schema using the Better Auth CLI:

```bash
npx @better-auth/cli generate
```

This will create a `schema.sql` file with the necessary tables for Better Auth.

You can then apply the schema to your Turso database:

```bash
turso db shell your-database < schema.sql
```

## Environment Variables

Create a `.env` file with your Turso credentials:

```env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

Get these values from the [Turso dashboard](https://app.turso.tech/).

## Usage Patterns

### Local Development

For local development, you can use a local SQLite file:

```typescript
tursoAdapter({
  config: {
    url: "file:./dev.db",
  },
})
```

### Production with Embedded Replicas

For production, use embedded replicas for best performance:

```typescript
tursoAdapter({
  config: {
    url: "file:./local.db",
    syncUrl: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
    syncInterval: 60000,
  },
})
```

### Pure Remote Database

For serverless environments, use a pure remote connection:

```typescript
tursoAdapter({
  config: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
})
```

## Advanced Configuration

### Custom Table Names

Use plural table names:

```typescript
tursoAdapter({
  config: { /* ... */ },
  usePlural: true,
})
```

### Connection Pooling

For high-traffic applications, consider connection pooling:

```typescript
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
  // Add any additional connection options
});

tursoAdapter({
  client,
})
```

## Testing

The adapter includes comprehensive tests that run against the official Better Auth test suite:

```bash
npm test
```

## Compatibility

- **Better Auth**: ^1.0.0
- **Node.js**: >=18.0.0
- **libSQL Client**: ^0.14.0

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting PRs.

## License

MIT © [Your Name]

## Related

- [Better Auth](https://better-auth.com) - The authentication framework
- [Turso](https://turso.tech) - The edge database
- [libSQL](https://github.com/tursodatabase/libsql) - The open source SQLite fork
