import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  runAdapterTest,
  runNumberIdAdapterTest,
} from "better-auth/adapters/test";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "./index.js";

describe("TursoAdapter - Integration Tests", () => {
  describe("Official Better Auth Adapter Tests", () => {
    let client: ReturnType<typeof createClient>;

    beforeEach(() => {
      client = createClient({
        url: ":memory:",
      });
    });

    afterEach(async () => {
      // No explicit cleanup needed for in-memory database
    });

    test("should pass standard adapter tests", async () => {
      const adapter = tursoAdapter({
        client,
        debugLogs: {
          isRunningAdapterTests: true,
        },
      });

      await runAdapterTest({
        getAdapter: async (betterAuthOptions = {}) => {
          return adapter(betterAuthOptions);
        },
      });
    });

    test("should pass numeric ID adapter tests", async () => {
      const adapter = tursoAdapter({
        client,
        debugLogs: {
          isRunningAdapterTests: true,
        },
      });

      await runNumberIdAdapterTest({
        getAdapter: async (betterAuthOptions = {}) => {
          return adapter(betterAuthOptions);
        },
      });
    });
  });

  describe("Real Database Operations", () => {
    let client: ReturnType<typeof createClient>;
    let adapter: any;
    let adapterInstance: any;

    beforeEach(() => {
      client = createClient({
        url: ":memory:",
      });

      adapter = tursoAdapter({
        client,
        debugLogs: true,
      });

      // Call the adapter factory with empty options to get the raw adapter functions
      const adapterResult = adapter({});
      console.log("Adapter result structure:", Object.keys(adapterResult));
      console.log("Adapter result:", adapterResult);
      adapterInstance = adapterResult;
    });

    afterEach(async () => {
      // No explicit cleanup needed for in-memory database
    });

    test("should perform complete CRUD cycle", async () => {
      const testUser = {
        id: "test-user-1",
        name: "John Doe",
        email: "john@example.com",
        emailVerified: false,
      };

      // Create
      const created = await adapterInstance.create({
        model: "user",
        data: testUser,
      });

      expect(created).toMatchObject(testUser);
      expect(created.id).toBe(testUser.id);

      // Read (findOne)
      const found = await adapterInstance.findOne({
        model: "user",  
        where: { id: testUser.id },
      });

      expect(found).toMatchObject(testUser);

      // Update
      const updatedData = { name: "Jane Doe", emailVerified: true };
      const updated = await adapterInstance.update({
        model: "user",
        where: { id: testUser.id },
        update: updatedData,
      });

      expect(updated.name).toBe("Jane Doe");
      expect(updated.emailVerified).toBe(true);
      expect(updated.email).toBe(testUser.email); // Should remain unchanged

      // Count
      const count = await adapterInstance.count({
        model: "user",
        where: {},
      });

      expect(count).toBe(1);

      // Delete
      await adapterInstance.delete({
        model: "user",
        where: { id: testUser.id },
      });

      // Verify deletion
      const deletedUser = await adapterInstance.findOne({
        model: "user",
        where: { id: testUser.id },
      });

      expect(deletedUser).toBeNull();

      const finalCount = await adapterInstance.count({
        model: "user",
        where: {},
      });

      expect(finalCount).toBe(0);
    });

    test("should handle bulk operations", async () => {
      // Setup table
      await client.execute(`
        CREATE TABLE IF NOT EXISTS test_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create multiple users
      const users = [
        { id: "user-1", name: "User 1", status: "active" },
        { id: "user-2", name: "User 2", status: "active" },
        { id: "user-3", name: "User 3", status: "inactive" },
      ];

      for (const user of users) {
        await adapterInstance.create({
          model: "test_users",
          data: user,
        });
      }

      // Test findMany with filtering
      const activeUsers = await adapterInstance.findMany({
        model: "test_users",
        where: { status: "active" },
      });

      expect(activeUsers).toHaveLength(2);
      expect(activeUsers.every((user: any) => user.status === "active")).toBe(
        true,
      );

      // Test findMany with sorting
      const sortedUsers = await adapterInstance.findMany({
        model: "test_users",
        where: {},
        sortBy: { name: "desc" },
      });

      expect(sortedUsers).toHaveLength(3);
      expect(sortedUsers[0].name).toBe("User 3");
      expect(sortedUsers[2].name).toBe("User 1");

      // Test findMany with limit and offset
      const paginatedUsers = await adapterInstance.findMany({
        model: "test_users",
        where: {},
        sortBy: { name: "asc" },
        limit: 2,
        offset: 1,
      });

      expect(paginatedUsers).toHaveLength(2);
      expect(paginatedUsers[0].name).toBe("User 2");
      expect(paginatedUsers[1].name).toBe("User 3");

      // Test updateMany
      const updateResult = await adapterInstance.updateMany({
        model: "test_users",
        where: { status: "active" },
        update: { status: "verified" },
      });

      expect(updateResult).toBe(2);

      // Verify updates
      const verifiedUsers = await adapterInstance.findMany({
        model: "test_users",
        where: { status: "verified" },
      });

      expect(verifiedUsers).toHaveLength(2);

      // Test deleteMany
      const deleteResult = await adapterInstance.deleteMany({
        model: "test_users",
        where: { status: "verified" },
      });

      expect(deleteResult).toBe(2);

      // Verify only inactive user remains
      const remainingUsers = await adapterInstance.findMany({
        model: "test_users",
        where: {},
      });

      expect(remainingUsers).toHaveLength(1);
      expect(remainingUsers[0].status).toBe("inactive");
    });

    test("should handle data types correctly", async () => {
      // Setup table with various data types
      await client.execute(`
        CREATE TABLE IF NOT EXISTS test_types (
          id TEXT PRIMARY KEY,
          text_field TEXT,
          integer_field INTEGER,
          boolean_field BOOLEAN,
          datetime_field DATETIME,
          json_field TEXT
        )
      `);

      const testData = {
        id: "type-test-1",
        text_field: "Hello World",
        integer_field: 42,
        boolean_field: true,
        datetime_field: new Date().toISOString(),
        json_field: JSON.stringify({
          key: "value",
          nested: { array: [1, 2, 3] },
        }),
      };

      // Create record
      const created = await adapterInstance.create({
        model: "test_types",
        data: testData,
      });

      expect(created.text_field).toBe(testData.text_field);
      expect(created.integer_field).toBe(testData.integer_field);
      expect(created.boolean_field).toBe(testData.boolean_field);
      expect(created.datetime_field).toBe(testData.datetime_field);
      expect(created.json_field).toBe(testData.json_field);

      // Test retrieval
      const retrieved = await adapterInstance.findOne({
        model: "test_types",
        where: { id: testData.id },
      });

      expect(retrieved).toMatchObject(testData);
    });

    test("should handle transactions and concurrent operations", async () => {
      // Setup table
      await client.execute(`
        CREATE TABLE IF NOT EXISTS test_concurrent (
          id TEXT PRIMARY KEY,
          counter INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create initial record
      await adapterInstance.create({
        model: "test_concurrent",
        data: { id: "counter-1", counter: 0 },
      });

      // Simulate concurrent updates
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const current = await adapterInstance.findOne({
          model: "test_concurrent",
          where: { id: "counter-1" },
        });

        return adapterInstance.update({
          model: "test_concurrent",
          where: { id: "counter-1" },
          update: {
            counter: current.counter + 1,
            updated_at: new Date().toISOString(),
          },
        });
      });

      // Wait for all updates to complete
      await Promise.all(promises);

      // Verify final state
      const final = await adapterInstance.findOne({
        model: "test_concurrent",
        where: { id: "counter-1" },
      });

      expect(final.counter).toBeGreaterThan(0);
      expect(final.counter).toBeLessThanOrEqual(10);
    });

    test("should handle edge cases and error conditions", async () => {
      // Setup table
      await client.execute(`
        CREATE TABLE IF NOT EXISTS test_edge_cases (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        )
      `);

      // Test unique constraint violation
      const userData = {
        id: "edge-1",
        name: "Test User",
        email: "unique@example.com",
      };

      await adapterInstance.create({
        model: "test_edge_cases",
        data: userData,
      });

      // Attempt to create duplicate
      await expect(
        adapterInstance.create({
          model: "test_edge_cases",
          data: {
            id: "edge-2",
            name: "Another User",
            email: "unique@example.com", // Duplicate email
          },
        }),
      ).rejects.toThrow();

      // Test update with non-existent record
      await expect(
        adapterInstance.update({
          model: "test_edge_cases",
          where: { id: "non-existent" },
          update: { name: "Updated Name" },
        }),
      ).rejects.toThrow("Failed to update record or record not found");

      // Test operations with empty data
      const emptyResult = await adapterInstance.findMany({
        model: "test_edge_cases",
        where: { name: "Non-existent User" },
      });

      expect(emptyResult).toEqual([]);

      const zeroCount = await adapterInstance.count({
        model: "test_edge_cases",
        where: { name: "Non-existent User" },
      });

      expect(zeroCount).toBe(0);

      const deleteNonExistent = await adapterInstance.deleteMany({
        model: "test_edge_cases",
        where: { name: "Non-existent User" },
      });

      expect(deleteNonExistent).toBe(0);
    });

    test("should generate and use schema correctly", async () => {
      const tables = {
        generated_users: {
          fields: {
            id: { type: "string", required: true, unique: true },
            username: { type: "string", required: true, unique: true },
            email: { type: "string", required: true, unique: true },
            age: { type: "number", required: false },
            is_active: { type: "boolean", required: false, defaultValue: true },
            created_at: { type: "date", required: true },
          },
        },
      };

      // Generate schema
      const schema = await adapterInstance.createSchema({
        tables,
      });

      expect(schema.code).toContain(
        "CREATE TABLE IF NOT EXISTS generated_users",
      );

      // Execute generated schema
      await client.execute(schema.code);

      // Test operations on generated table
      const userData = {
        id: "gen-user-1",
        username: "testuser",
        email: "test@example.com",
        age: 25,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const created = await adapterInstance.create({
        model: "generated_users",
        data: userData,
      });

      expect(created).toMatchObject(userData);

      // Test unique constraints work
      await expect(
        adapterInstance.create({
          model: "generated_users",
          data: {
            id: "gen-user-2",
            username: "testuser", // Duplicate username
            email: "different@example.com",
            created_at: new Date().toISOString(),
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Configuration Variants", () => {
    test("should work with config parameter", async () => {
      const adapter = tursoAdapter({
        config: {
          url: ":memory:",
        },
      });

      const adapterInstance = adapter({
        debugLog: false,
      });

      // Setup table
      (await adapterInstance.options.client?.execute(`
        CREATE TABLE IF NOT EXISTS config_test (
          id TEXT PRIMARY KEY,
          name TEXT
        )
      `)) ||
        (await createClient({ url: ":memory:" }).execute(`
        CREATE TABLE IF NOT EXISTS config_test (
          id TEXT PRIMARY KEY,
          name TEXT
        )
      `));

      // Test basic operation
      expect(adapterInstance).toBeDefined();
      expect(typeof adapterInstance.create).toBe("function");
    });

    test("should work with plural table names", async () => {
      const client = createClient({ url: ":memory:" });
      const adapter = tursoAdapter({
        client,
        usePlural: true,
      });

      const adapterConfig = adapter({} as any);
      expect(adapterConfig.config.usePlural).toBe(true);
    });

    test("should handle different debug log configurations", async () => {
      const client = createClient({ url: ":memory:" });

      // Test object debug logs
      const adapter1 = tursoAdapter({
        client,
        debugLogs: {
          create: true,
          update: false,
          findOne: true,
        },
      });

      const config1 = adapter1({} as any);
      expect(config1.config.debugLogs).toEqual({
        create: true,
        update: false,
        findOne: true,
      });

      // Test boolean debug logs
      const adapter2 = tursoAdapter({
        client,
        debugLogs: true,
      });

      const config2 = adapter2({} as any);
      expect(config2.config.debugLogs).toBe(true);
    });
  });
});
