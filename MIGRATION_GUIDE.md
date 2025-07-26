# Better Auth Turso Adapter - Migration Guide

This guide covers database migrations and schema management when using the Better Auth Turso adapter.

## Overview

The Better Auth Turso adapter supports the Better Auth CLI for schema generation and migration management. This enables automatic table creation and schema evolution as you add features to your application.

## Quick Start

### 1. Install Better Auth CLI

```bash
npm install -g @better-auth/cli
# or use npx for one-time usage
npx @better-auth/cli@latest --help
```

### 2. Generate Schema

```bash
npx @better-auth/cli@latest generate
```

This creates a `schema.sql` file with all necessary tables.

### 3. Apply to Database

#### Local SQLite Development
Tables are created automatically - no manual migration needed.

#### Production Turso Database
```bash
turso db shell your-database < schema.sql
```

## Core Schema

The adapter generates the following core tables:

### `user` Table
```sql
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified BOOLEAN DEFAULT false NOT NULL,
  image TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

### `session` Table
```sql
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt DATETIME NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

### `account` Table
```sql
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt DATETIME,
  refreshTokenExpiresAt DATETIME,
  scope TEXT,
  password TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

### `verification` Table
```sql
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

## Plugin Support

The adapter automatically generates schema for Better Auth plugins:

### Two-Factor Authentication

```typescript
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  database: tursoAdapter({ client }),
  plugins: [
    twoFactor({
      issuer: "Your App"
    })
  ]
});
```

Generates:
```sql
CREATE TABLE IF NOT EXISTS twoFactor (
  id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  backupCodes TEXT NOT NULL,
  userId TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

### Organization Management

```typescript
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: tursoAdapter({ client }),
  plugins: [
    organization()
  ]
});
```

Adds organization-related tables automatically.

## CLI Commands

### Generate Schema

```bash
# Generate to default location (schema.sql)
npx @better-auth/cli@latest generate

# Custom output location
npx @better-auth/cli@latest generate --output ./database/schema.sql

# Specify config file
npx @better-auth/cli@latest generate --config ./lib/auth.ts

# Skip confirmation prompts
npx @better-auth/cli@latest generate --y
```

### Migration Command

```bash
# Direct migration (primarily for Kysely adapter)
npx @better-auth/cli@latest migrate

# For Turso, use generate + manual application
npx @better-auth/cli@latest generate
turso db shell your-database < schema.sql
```

## Migration Workflows

### Development Workflow

1. **Modify auth configuration** (add plugins, change settings)
2. **Generate new schema:**
   ```bash
   npx @better-auth/cli@latest generate
   ```
3. **Review changes** in `schema.sql`
4. **For local development:** Tables update automatically
5. **For remote Turso:** Apply manually if needed

### Production Deployment

1. **In CI/CD pipeline:**
   ```bash
   npx @better-auth/cli@latest generate
   ```

2. **Review schema changes** before deployment

3. **Apply to production database:**
   ```bash
   turso db shell your-prod-database < schema.sql
   ```

4. **Deploy application code**

### Team Collaboration

1. **Commit generated schema** to version control
2. **Review schema changes** in pull requests
3. **Coordinate database updates** across environments
4. **Use database migration tools** for complex changes

## Configuration

### Auth Configuration File

The CLI searches for auth configuration in these locations:
- `./auth.ts`
- `./utils/auth.ts`
- `./lib/auth.ts`
- `./src/auth.ts`
- `./src/utils/auth.ts`
- `./src/lib/auth.ts`

### Custom Configuration

```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { tursoAdapter } from "better-auth-turso";

export const auth = betterAuth({
  database: tursoAdapter({
    client: createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
  }),
  // ... other options
});
```

## Advanced Usage

### Schema Customization

```typescript
export const auth = betterAuth({
  database: tursoAdapter({ client }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
      department: {
        type: "string",
        required: false,
      },
    },
  },
});
```

### Table Name Mapping

```typescript
export const auth = betterAuth({
  database: tursoAdapter({ client }),
  user: {
    modelName: "users", // Use plural table name
    fields: {
      name: "full_name", // Map field names
      email: "email_address",
    },
  },
});
```

### Numeric IDs

```typescript
export const auth = betterAuth({
  database: tursoAdapter({ client }),
  advanced: {
    database: {
      useNumberId: true, // Use auto-incrementing numeric IDs
    },
  },
});
```

## Troubleshooting

### Common Issues

1. **CLI can't find config:**
   ```bash
   npx @better-auth/cli@latest generate --config ./path/to/auth.ts
   ```

2. **Permission errors:**
   ```bash
   npx @better-auth/cli@latest generate --output ./writable/path/schema.sql
   ```

3. **Schema not applying:**
   - Check Turso database connection
   - Verify SQL syntax compatibility
   - Review generated schema manually

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
export const auth = betterAuth({
  database: tursoAdapter({
    client,
    debugLogs: true, // Enable all debug logs
  }),
});
```

## Best Practices

1. **Version control schemas** - Commit generated `schema.sql`
2. **Review before applying** - Always review schema changes
3. **Test migrations** - Verify in staging before production
4. **Backup databases** - Backup before major schema changes
5. **Coordinate deployments** - Ensure schema and code compatibility
6. **Document changes** - Track schema evolution in release notes

## Examples

See the `/examples/nextjs-app` directory for a complete example demonstrating:
- Basic auth configuration
- CLI integration
- Migration workflows
- Production deployment patterns

## Support

For issues with migrations:
1. Check the generated schema syntax
2. Verify Turso database connectivity  
3. Review Better Auth documentation
4. Report issues with detailed error messages