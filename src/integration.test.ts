import { describe, test, expect, beforeEach } from "vitest";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "./index.js";

describe("Turso Adapter Integration Tests", () => {
  let client: ReturnType<typeof createClient>;
  let adapter: ReturnType<typeof tursoAdapter>;

  beforeEach(() => {
    client = createClient({
      url: ":memory:",
    });

    adapter = tursoAdapter({
      client,
      debugLogs: false,
    });
  });

  test("should handle database connection", async () => {
    expect(adapter).toBeDefined();
    expect(typeof adapter).toBe("function");
  });

  test("should create and retrieve user data", async () => {
    const betterAuthAdapter = adapter({
      secret: "test-secret",
      database: client as any,
      // Mock Better Auth options
    } as any);

    // Setup a simple table for testing
    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Test create operation
    const userData = {
      id: "test-user-1",
      email: "test@example.com",
      name: "Test User",
    };

    const createdUser = await betterAuthAdapter.create({
      model: "test_users",
      data: userData,
    });

    expect(createdUser).toMatchObject(userData);

    // Test findOne operation
    const foundUser = await betterAuthAdapter.findOne({
      model: "test_users",
      where: { id: "test-user-1" },
    });

    expect(foundUser).toMatchObject(userData);
  });

  test("should handle update operations", async () => {
    const betterAuthAdapter = adapter({
      secret: "test-secret",
      database: client as any,
    } as any);

    // Setup table and initial data
    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        updated_at DATETIME
      )
    `);

    await client.execute({
      sql: "INSERT INTO test_users (id, email, name) VALUES (?, ?, ?)",
      args: ["test-user-1", "test@example.com", "Original Name"],
    });

    // Test update operation
    const updatedUser = await betterAuthAdapter.update({
      model: "test_users",
      where: { id: "test-user-1" },
      update: { name: "Updated Name" },
    });

    expect(updatedUser.name).toBe("Updated Name");
    expect(updatedUser.email).toBe("test@example.com");
  });

  test("should handle delete operations", async () => {
    const betterAuthAdapter = adapter({
      secret: "test-secret",
      database: client as any,
    } as any);

    // Setup table and initial data
    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT
      )
    `);

    await client.execute({
      sql: "INSERT INTO test_users (id, email, name) VALUES (?, ?, ?)",
      args: ["test-user-1", "test@example.com", "Test User"],
    });

    // Test delete operation
    await betterAuthAdapter.delete({
      model: "test_users",
      where: { id: "test-user-1" },
    });

    // Verify user is deleted
    const foundUser = await betterAuthAdapter.findOne({
      model: "test_users",
      where: { id: "test-user-1" },
    });

    expect(foundUser).toBeNull();
  });

  test("should handle count operations", async () => {
    const betterAuthAdapter = adapter({
      secret: "test-secret",
      database: client as any,
    } as any);

    // Setup table and test data
    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT
      )
    `);

    // Insert test data
    await client.execute({
      sql: "INSERT INTO test_users (id, email, name) VALUES (?, ?, ?)",
      args: ["user-1", "user1@example.com", "User 1"],
    });

    await client.execute({
      sql: "INSERT INTO test_users (id, email, name) VALUES (?, ?, ?)",
      args: ["user-2", "user2@example.com", "User 2"],
    });

    // Test count operation
    const totalCount = await betterAuthAdapter.count({
      model: "test_users",
      where: {},
    });

    expect(totalCount).toBe(2);

    // Test count with where clause
    const filteredCount = await betterAuthAdapter.count({
      model: "test_users",
      where: { name: "User 1" },
    });

    expect(filteredCount).toBe(1);
  });

  test("should handle findMany with pagination", async () => {
    const betterAuthAdapter = adapter({
      secret: "test-secret",
      database: client as any,
    } as any);

    // Setup table and test data
    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert test data
    for (let i = 1; i <= 5; i++) {
      await client.execute({
        sql: "INSERT INTO test_users (id, email, name) VALUES (?, ?, ?)",
        args: [`user-${i}`, `user${i}@example.com`, `User ${i}`],
      });
    }

    // Test findMany with limit
    const limitedUsers = await betterAuthAdapter.findMany({
      model: "test_users",
      where: {},
      limit: 3,
    });

    expect(limitedUsers).toHaveLength(3);

    // Test findMany with offset
    const offsetUsers = await betterAuthAdapter.findMany({
      model: "test_users",
      where: {},
      limit: 2,
      offset: 2,
    });

    expect(offsetUsers).toHaveLength(2);
  });
});
