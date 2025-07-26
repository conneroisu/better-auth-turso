import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  runAdapterTest,
  runNumberIdAdapterTest,
} from "better-auth/adapters/test";
import Database from "better-sqlite3";
import { tursoAdapter } from "./index.js";

describe("TursoAdapter - Integration Tests", () => {
  describe("Official Better Auth Adapter Tests", () => {
    afterEach(async () => {
      // No explicit cleanup needed for in-memory database
    });

    // Run standard adapter tests
    runAdapterTest({
      getAdapter: async (betterAuthOptions = {}) => {
        // Create a shared database per test suite, not per call
        // This ensures all operations within a test use the same database
        if (!globalThis.__testClient) {
          globalThis.__testClient = new Database(":memory:");
        }

        const adapter = tursoAdapter({
          database: globalThis.__testClient,
          debugLogs: {
            isRunningAdapterTests: true,
          },
        });

        return adapter.adapter(betterAuthOptions);
      },
    });

    // Run numeric ID adapter tests
    runNumberIdAdapterTest({
      getAdapter: async (betterAuthOptions = {}) => {
        // Create a separate shared database for numeric ID tests
        if (!globalThis.__numericTestClient) {
          globalThis.__numericTestClient = new Database(":memory:");
        }

        const adapter = tursoAdapter({
          database: globalThis.__numericTestClient,
          debugLogs: {
            isRunningAdapterTests: true,
          },
        });

        return adapter.adapter(betterAuthOptions);
      },
    });
  });

  describe("Adapter Functionality", () => {
    let database: Database;
    let adapterFactory: any;

    beforeEach(() => {
      database = new Database(":memory:");

      adapterFactory = tursoAdapter({
        database: database,
        debugLogs: false,
      });
    });

    afterEach(async () => {
      // No explicit cleanup needed for in-memory database
    });

    test("should create and validate adapter configuration", async () => {
      // Test that the adapter factory returns the correct structure
      const adapterResult = adapterFactory({
        debugLog: false,
        schema: {},
        options: {},
      });

      expect(adapterResult.adapter).toHaveProperty("create");
      expect(adapterResult.adapter).toHaveProperty("findOne");
      expect(adapterResult.adapter).toHaveProperty("findMany");
      expect(adapterResult.adapter).toHaveProperty("update");
      expect(adapterResult.adapter).toHaveProperty("delete");
      expect(adapterResult.adapter).toHaveProperty("count");
      expect(adapterResult.adapter).toHaveProperty("createSchema");

      expect(typeof adapterResult.adapter.create).toBe("function");
      expect(typeof adapterResult.adapter.findOne).toBe("function");
      expect(typeof adapterResult.adapter.findMany).toBe("function");
      expect(typeof adapterResult.adapter.update).toBe("function");
      expect(typeof adapterResult.adapter.delete).toBe("function");
      expect(typeof adapterResult.adapter.count).toBe("function");
      expect(typeof adapterResult.adapter.createSchema).toBe("function");
    });

    test("should create tables automatically", async () => {
      const adapterInstance = adapterFactory({
        debugLog: false,
        schema: {},
        options: {},
      }).adapter;

      // Create a user to trigger table creation
      const created = await adapterInstance.create({
        model: "user",
        data: {
          name: "Test User",
          email: "test@example.com",
          emailVerified: false,
        },
      });

      expect(created).toBeTruthy();
      expect(created.name).toBe("Test User");
      expect(created.email).toBe("test@example.com");

      // Verify the table was created by checking it exists in SQLite
      const tableCheck = await database.execute({
        sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='user'",
        args: [],
      });

      expect(tableCheck.rows).toHaveLength(1);
    });

    test("should handle different Better Auth models", async () => {
      const adapterInstance = adapterFactory({
        debugLog: false,
        schema: {},
        options: {},
      }).adapter;

      // Test creating records in different Better Auth models
      const user = await adapterInstance.create({
        model: "user",
        data: {
          name: "Test User",
          email: "test@example.com",
          emailVerified: false,
        },
      });

      const session = await adapterInstance.create({
        model: "session",
        data: {
          userId: user.id,
          token: "test-token",
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const account = await adapterInstance.create({
        model: "account",
        data: {
          userId: user.id,
          accountId: "123",
          providerId: "google",
        },
      });

      const verification = await adapterInstance.create({
        model: "verification",
        data: {
          identifier: "test@example.com",
          value: "token123",
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      expect(user.id).toBeTruthy();
      expect(session.id).toBeTruthy();
      expect(account.id).toBeTruthy();
      expect(verification.id).toBeTruthy();

      // Verify all tables were created
      const tableCheck = await database.execute({
        sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        args: [],
      });

      const tableNames = tableCheck.rows?.map((row: any) => row.name) || [];
      expect(tableNames).toContain("user");
      expect(tableNames).toContain("session");
      expect(tableNames).toContain("account");
      expect(tableNames).toContain("verification");
    });

    test("should generate schema correctly", async () => {
      const adapterInstance = adapterFactory({
        debugLog: false,
        schema: {},
        options: {},
      }).adapter;

      const tables = {
        user: {
          fields: {
            id: { type: "string", required: true, unique: true },
            name: { type: "string", required: true },
            email: { type: "string", required: true, unique: true },
            emailVerified: {
              type: "boolean",
              required: false,
              defaultValue: false,
            },
            image: { type: "string", required: false },
            createdAt: { type: "date", required: true },
            updatedAt: { type: "date", required: true },
          },
        },
        session: {
          fields: {
            id: { type: "string", required: true, unique: true },
            userId: { type: "string", required: true },
            expiresAt: { type: "date", required: true },
            token: { type: "string", required: true, unique: true },
          },
        },
      };

      // Generate schema
      const schema = await adapterInstance.createSchema({
        tables,
      });

      expect(schema.code).toContain("CREATE TABLE IF NOT EXISTS user");
      expect(schema.code).toContain("CREATE TABLE IF NOT EXISTS session");
      expect(schema.code).toContain("email TEXT");
      expect(schema.code).toContain("Better Auth Schema for Turso/libSQL");
    });

    test("should handle dynamic column addition", async () => {
      const adapterInstance = adapterFactory({
        debugLog: false,
        schema: {},
        options: {},
      }).adapter;

      // Create initial user
      const user1 = await adapterInstance.create({
        model: "user",
        data: {
          name: "User 1",
          email: "user1@example.com",
        },
      });

      expect(user1.name).toBe("User 1");
      expect(user1.email).toBe("user1@example.com");

      // Create user with additional field - should trigger column addition
      const user2 = await adapterInstance.create({
        model: "user",
        data: {
          name: "User 2",
          email: "user2@example.com",
          phoneNumber: "+1234567890", // New field
        },
      });

      expect(user2.name).toBe("User 2");
      expect(user2.email).toBe("user2@example.com");
      expect(user2.phoneNumber).toBe("+1234567890");

      // Verify the new column was added by checking the first user can be updated with it
      const updatedUser1 = await adapterInstance.update({
        model: "user",
        where: [{ field: "id", value: user1.id }],
        update: { phoneNumber: "+0987654321" },
      });

      expect(updatedUser1.phoneNumber).toBe("+0987654321");
    });

    test("should handle data serialization correctly", async () => {
      const adapterInstance = adapterFactory({
        debugLog: false,
        schema: {},
        options: {},
      }).adapter;

      const testData = {
        name: "Test User",
        age: 25,
        isActive: true,
        createdAt: new Date("2023-01-01T00:00:00Z"),
        metadata: { preferences: { theme: "dark" }, tags: ["user", "test"] },
        nullField: null,
      };

      const created = await adapterInstance.create({
        model: "user",
        data: testData,
      });

      expect(created.name).toBe("Test User");
      expect(created.age).toBe(25);
      expect(created.isActive).toBe(true);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.createdAt.toISOString()).toBe("2023-01-01T00:00:00.000Z");
      expect(created.metadata).toEqual({
        preferences: { theme: "dark" },
        tags: ["user", "test"],
      });
      expect(created.nullField).toBeNull();
    });

    test("should handle field name mapping correctly", async () => {
      const adapterInstance = adapterFactory({
        debugLog: false,
        schema: {},
        options: {},
      }).adapter;

      const userData = {
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = await adapterInstance.create({
        model: "user",
        data: userData,
      });

      // Field names should be properly mapped
      expect(created.emailVerified).toBe(true);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);

      const found = await adapterInstance.findOne({
        model: "user",
        where: [{ field: "id", value: created.id }],
      });

      expect(found.emailVerified).toBe(true);
      expect(found.createdAt).toBeInstanceOf(Date);
      expect(found.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("Configuration Variants", () => {
    test("should work with database string parameter", async () => {
      const adapter = tursoAdapter({
        database: ":memory:",
      });

      const adapterInstance = adapter.adapter({
        debugLog: false,
        schema: {},
        options: {},
      });

      // Test basic operation
      expect(adapterInstance).toBeDefined();
      expect(typeof adapterInstance.create).toBe("function");

      // Test that it actually works
      const user = await adapterInstance.create({
        model: "user",
        data: {
          name: "Test User",
          email: "test@example.com",
        },
      });

      expect(user.name).toBe("Test User");
      expect(user.email).toBe("test@example.com");
    });

    test("should work with plural table names", async () => {
      const database = new Database(":memory:");
      const adapter = tursoAdapter({
        database: database,
        usePlural: true,
      });

      const adapterInstance = adapter.adapter({
        debugLog: false,
        schema: {},
        options: {},
      });

      // Test that the adapter was created successfully with plural option
      expect(adapterInstance).toBeDefined();
      expect(adapterInstance.config.usePlural).toBe(true);
      expect(typeof adapterInstance.adapter.create).toBe("function");
    });

    test("should handle different debug log configurations", async () => {
      const database = new Database(":memory:");

      // Test object debug logs
      const adapter1 = tursoAdapter({
        database: database,
        debugLogs: {
          create: true,
          update: false,
          findOne: true,
        },
      });

      const instance1 = adapter1.adapter({
        debugLog: false,
        schema: {},
        options: {},
      });
      expect(instance1).toBeDefined();
      expect(typeof instance1.adapter.create).toBe("function");

      // Test boolean debug logs
      const adapter2 = tursoAdapter({
        database: database,
        debugLogs: true,
      });

      const instance2 = adapter2.adapter({
        debugLog: false,
        schema: {},
        options: {},
      });
      expect(instance2).toBeDefined();
      expect(typeof instance2.adapter.create).toBe("function");
    });

    test("should handle numeric ID configuration", async () => {
      const database = new Database(":memory:");
      const adapter = tursoAdapter({
        database: database,
      });

      const adapterInstance = adapter.adapter({
        debugLog: false,
        schema: {},
        options: {
          advanced: {
            database: {
              useNumberId: true,
            },
          },
        },
      });

      // Create a user with numeric ID configuration
      const user = await adapterInstance.create({
        model: "user",
        data: {
          name: "Numeric User",
          email: "numeric@example.com",
        },
      });

      expect(user.name).toBe("Numeric User");
      expect(user.email).toBe("numeric@example.com");
      // The ID should be generated by SQLite auto-increment
      expect(typeof user.id).toBe("number");
    });

    test("should handle URL configurations for remote databases", () => {
      // Test HTTP URL
      expect(() => {
        tursoAdapter({
          database: "https://my-db.turso.io",
        });
      }).not.toThrow();

      // Test libSQL URL
      expect(() => {
        tursoAdapter({
          database: "libsql://my-db.turso.io",
        });
      }).not.toThrow();

      // Test local file path
      expect(() => {
        tursoAdapter({
          database: "/path/to/local.db",
        });
      }).not.toThrow();
    });
  });

  describe("Advanced Operations", () => {
    let database: Database;
    let adapterInstance: any;

    beforeEach(() => {
      database = new Database(":memory:");
      const adapter = tursoAdapter({
        database: database,
        debugLogs: false,
      });
      adapterInstance = adapter.adapter({
        debugLog: false,
        schema: {},
        options: {},
      });
    });

    test("should handle complex queries with multiple conditions", async () => {
      // Create test data
      await adapterInstance.create({
        model: "user",
        data: {
          name: "Alice",
          email: "alice@example.com",
          age: 25,
          status: "active",
        },
      });
      await adapterInstance.create({
        model: "user",
        data: {
          name: "Bob",
          email: "bob@example.com",
          age: 30,
          status: "inactive",
        },
      });
      await adapterInstance.create({
        model: "user",
        data: {
          name: "Charlie",
          email: "charlie@example.com",
          age: 25,
          status: "active",
        },
      });

      // Test finding with multiple conditions
      const activeUsers25 = await adapterInstance.findMany({
        model: "user",
        where: [
          { field: "age", value: 25 },
          { field: "status", value: "active" },
        ],
      });

      expect(activeUsers25).toHaveLength(2);
      expect(activeUsers25.map((u: any) => u.name)).toEqual([
        "Alice",
        "Charlie",
      ]);
    });

    test("should handle sorting and pagination", async () => {
      // Create test data
      const users = ["Alice", "Bob", "Charlie", "David", "Eve"];
      for (let i = 0; i < users.length; i++) {
        await adapterInstance.create({
          model: "user",
          data: {
            name: users[i],
            email: `${users[i].toLowerCase()}@example.com`,
            age: 20 + i,
          },
        });
      }

      // Test sorting
      const sortedUsers = await adapterInstance.findMany({
        model: "user",
        where: [],
        sortBy: { field: "name", direction: "asc" },
      });

      expect(sortedUsers.map((u: any) => u.name)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
        "David",
        "Eve",
      ]);

      // Test pagination
      const page1 = await adapterInstance.findMany({
        model: "user",
        where: [],
        sortBy: { field: "name", direction: "asc" },
        limit: 2,
        offset: 0,
      });

      expect(page1).toHaveLength(2);
      expect(page1.map((u: any) => u.name)).toEqual(["Alice", "Bob"]);

      const page2 = await adapterInstance.findMany({
        model: "user",
        where: [],
        sortBy: { field: "name", direction: "asc" },
        limit: 2,
        offset: 2,
      });

      expect(page2).toHaveLength(2);
      expect(page2.map((u: any) => u.name)).toEqual(["Charlie", "David"]);
    });

    test("should handle batch operations", async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 5; i++) {
        const user = await adapterInstance.create({
          model: "user",
          data: {
            name: `User ${i}`,
            email: `user${i}@example.com`,
            status: i % 2 === 0 ? "active" : "inactive",
          },
        });
        users.push(user);
      }

      // Update many
      const updateCount = await adapterInstance.updateMany({
        model: "user",
        where: [{ field: "status", value: "inactive" }],
        update: { status: "active" },
      });

      expect(updateCount).toBe(2); // 2 inactive users

      // Verify updates
      const allActiveUsers = await adapterInstance.findMany({
        model: "user",
        where: [{ field: "status", value: "active" }],
      });

      expect(allActiveUsers).toHaveLength(5); // All users should now be active

      // Delete many
      const deleteCount = await adapterInstance.deleteMany({
        model: "user",
        where: [{ field: "status", value: "active" }],
      });

      expect(deleteCount).toBe(5); // All users deleted

      // Verify deletion
      const remainingUsers = await adapterInstance.findMany({
        model: "user",
        where: [],
      });

      expect(remainingUsers).toHaveLength(0);
    });

    test("should handle count operations", async () => {
      // Create test data
      for (let i = 0; i < 10; i++) {
        await adapterInstance.create({
          model: "user",
          data: {
            name: `User ${i}`,
            email: `user${i}@example.com`,
            status: i < 5 ? "active" : "inactive",
          },
        });
      }

      // Count all users
      const totalCount = await adapterInstance.count({
        model: "user",
        where: [],
      });

      expect(totalCount).toBe(10);

      // Count active users
      const activeCount = await adapterInstance.count({
        model: "user",
        where: [{ field: "status", value: "active" }],
      });

      expect(activeCount).toBe(5);

      // Count inactive users
      const inactiveCount = await adapterInstance.count({
        model: "user",
        where: [{ field: "status", value: "inactive" }],
      });

      expect(inactiveCount).toBe(5);
    });
  });
});
