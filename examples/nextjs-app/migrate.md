# Database Migrations with Better Auth CLI

This example demonstrates how to use the Better Auth CLI to manage database migrations with the Turso adapter.

## Quick Start

### 1. Generate Database Schema

Generate the SQL schema file for your database:

```bash
bun run db:generate
# or
npx @better-auth/cli@latest generate
```

This will create a `schema.sql` file with all the necessary tables for Better Auth.

### 2. Apply Migrations (Automatic)

For databases that support it, you can automatically apply the schema:

```bash
bun run db:migrate
# or
npx @better-auth/cli@latest migrate
```

**Note**: The `migrate` command is primarily designed for the built-in Kysely adapter. For Turso, you'll typically use the `generate` command and apply the schema manually.

## Manual Migration Workflow

Since Turso is a custom adapter, here's the recommended workflow:

### Step 1: Generate Schema
```bash
bun run db:generate
```

This creates a `schema.sql` file with the following tables:
- `user` - User accounts and profiles
- `session` - User sessions
- `account` - OAuth and credential accounts
- `verification` - Email/phone verification tokens

### Step 2: Review Generated Schema

The generated `schema.sql` will look like this:

```sql
-- Better Auth Schema for Turso/libSQL
-- Generated on: [timestamp]

CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified BOOLEAN DEFAULT false NOT NULL,
  image TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

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

-- ... other tables
```

### Step 3: Apply to Your Database

#### Local SQLite Development
For local development with SQLite files, the schema is automatically applied when the adapter starts.

#### Turso Remote Database
For production Turso databases:

1. **Using Turso CLI:**
   ```bash
   turso db shell your-database < schema.sql
   ```

2. **Using Turso Console:**
   - Copy the generated SQL
   - Paste into the Turso console SQL editor
   - Execute the statements

3. **Programmatically:**
   ```typescript
   import { readFileSync } from 'fs';
   import { createClient } from '@libsql/client';

   const client = createClient({
     url: process.env.TURSO_DATABASE_URL!,
     authToken: process.env.TURSO_AUTH_TOKEN!,
   });

   const schema = readFileSync('schema.sql', 'utf-8');
   await client.executeMultiple(schema);
   ```

## Configuration

The CLI uses the auth configuration in `auth.ts` to generate the appropriate schema. Make sure your configuration includes:

```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { tursoAdapter } from "better-auth-turso";

export const auth = betterAuth({
  database: tursoAdapter({
    client: // your Turso client
  }),
  // ... other options
});
```

## Adding Plugins

When you add Better Auth plugins, you'll need to regenerate and apply the schema:

```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  database: tursoAdapter({
    client: // your Turso client
  }),
  plugins: [
    twoFactor({
      issuer: "Your App"
    })
  ]
});
```

Then regenerate:
```bash
bun run db:generate
```

This will add the required `twoFactor` table to your schema.

## Production Deployment

1. **Generate schema in CI/CD:**
   ```bash
   bun run db:generate
   ```

2. **Apply to production database:**
   ```bash
   turso db shell your-prod-database < schema.sql
   ```

3. **Version control:**
   - Commit the generated `schema.sql` 
   - Track schema changes in your repository
   - Use database migration tools for complex changes

## Troubleshooting

### CLI Not Finding Auth Config

If the CLI can't find your auth configuration, specify the path:

```bash
npx @better-auth/cli@latest generate --config ./auth.ts
```

### Schema Output Location

By default, the schema is saved to `schema.sql`. To change the location:

```bash
npx @better-auth/cli@latest generate --output ./database/schema.sql
```

### Skip Confirmation Prompts

For automated workflows:

```bash
npx @better-auth/cli@latest generate --y
```