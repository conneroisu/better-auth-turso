# Basic Better Auth Turso Example

This example demonstrates how to use the Better Auth Turso adapter in a basic application.

## Features Demonstrated

- User registration with email/password
- User authentication
- Database table auto-creation
- Custom user fields
- Session management

## Running the Example

```bash
# Install dependencies
bun install

# Run the example
bun run dev

# Or run once
bun start

# Test the example
bun test
```

## What This Example Shows

1. **Setup**: How to configure Better Auth with the Turso adapter
2. **User Creation**: Creating users with email/password authentication
3. **User Retrieval**: Finding and authenticating users
4. **Database Integration**: Automatic table creation and data persistence
5. **Custom Fields**: Adding additional user fields beyond the standard ones

## Key Code Points

- Uses in-memory SQLite database for simplicity (change to `file:./database.db` for persistence)
- Enables debug logging to see adapter operations
- Demonstrates both string and custom field handling
- Shows proper error handling patterns

## Next Steps

- Try modifying the user fields
- Add additional authentication methods
- Implement password reset functionality
- Add user roles and permissions