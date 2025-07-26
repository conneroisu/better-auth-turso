# Numeric IDs Better Auth Turso Example

This example demonstrates using auto-incrementing numeric IDs with the Better Auth Turso adapter.

## Features Demonstrated

- Auto-incrementing numeric IDs (1, 2, 3...)
- INTEGER PRIMARY KEY AUTOINCREMENT in SQLite
- Sequential ID generation
- Numeric ID queries and lookups

## Key Configuration

```typescript
const auth = betterAuth({
  database: tursoAdapter({ client }),
  advanced: {
    database: {
      useNumberId: true, // Enable numeric auto-increment IDs
    },
  },
});
```

## Running the Example

```bash
# Install dependencies
bun install

# Run the example
bun run dev

# Test the example
bun test
```

## What This Example Shows

1. **Numeric ID Setup**: Configuring Better Auth to use auto-incrementing numeric IDs
2. **Sequential Creation**: Creating multiple users with IDs 1, 2, 3...
3. **Schema Verification**: Confirming INTEGER PRIMARY KEY AUTOINCREMENT is used
4. **Data Integrity**: Verifying IDs are sequential and properly stored
5. **Type Handling**: IDs are returned as strings but stored as integers

## Database Schema

With `useNumberId: true`, the user table is created as:

```sql
CREATE TABLE user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified BOOLEAN DEFAULT FALSE,
  image TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Benefits of Numeric IDs

- **Performance**: Faster joins and lookups
- **Space Efficiency**: Smaller storage footprint
- **Sequential**: Predictable ordering
- **Auto-increment**: No collision concerns
- **Standard**: Familiar to most developers

## When to Use

- High-performance applications
- Large user bases
- Systems requiring sequential ordering
- Integration with existing numeric ID systems