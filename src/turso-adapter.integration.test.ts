import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  runAdapterTest,
  runNumberIdAdapterTest,
} from "better-auth/adapters/test";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "./index.js";

describe("TursoAdapter - Integration Tests", () => {
  describe("Official Better Auth Adapter Tests", () => {
    afterEach(async () => {
      // No explicit cleanup needed for in-memory database
    });

    // Run standard adapter tests
    runAdapterTest({
      getAdapter: async (betterAuthOptions = {}) => {
        // Create a shared client per test suite, not per call
        // This ensures all operations within a test use the same database
        if (!globalThis.__testClient) {
          globalThis.__testClient = createClient({
            url: ":memory:",
          });
        }

        const adapter = tursoAdapter({
          client: globalThis.__testClient,
          debugLogs: {
            isRunningAdapterTests: true,
          },
        });

        return adapter(betterAuthOptions);
      },
    });

    // Run numeric ID adapter tests
    runNumberIdAdapterTest({
      getAdapter: async (betterAuthOptions = {}) => {
        // Create a separate shared client for numeric ID tests
        if (!globalThis.__numericTestClient) {
          globalThis.__numericTestClient = createClient({
            url: ":memory:",
          });
        }

        const adapter = tursoAdapter({
          client: globalThis.__numericTestClient,
          debugLogs: {
            isRunningAdapterTests: true,
          },
        });

        return adapter(betterAuthOptions);
      },
    });
  });

  describe("Adapter Functionality", () => {
    let client: ReturnType<typeof createClient>;
    let adapterFactory: any;

    beforeEach(() => {
      client = createClient({
        url: ":memory:",
      });

      adapterFactory = tursoAdapter({
        client,
        debugLogs: false,
      });
    });

    afterEach(async () => {
      // No explicit cleanup needed for in-memory database
    });

    test("should create and validate adapter configuration", async () => {
      // Test that the adapter factory returns the correct structure
      const adapterResult = adapterFactory({});

      expect(adapterResult).toHaveProperty("create");
      expect(adapterResult).toHaveProperty("findOne");
      expect(adapterResult).toHaveProperty("findMany");
      expect(adapterResult).toHaveProperty("update");
      expect(adapterResult).toHaveProperty("delete");
      expect(adapterResult).toHaveProperty("count");
      expect(adapterResult).toHaveProperty("createSchema");

      expect(typeof adapterResult.create).toBe("function");
      expect(typeof adapterResult.findOne).toBe("function");
      expect(typeof adapterResult.findMany).toBe("function");
      expect(typeof adapterResult.update).toBe("function");
      expect(typeof adapterResult.delete).toBe("function");
      expect(typeof adapterResult.count).toBe("function");
      expect(typeof adapterResult.createSchema).toBe("function");
    });

    test("should create tables automatically", async () => {
      const adapterInstance = adapterFactory({});

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
      const tableCheck = await client.execute({
        sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='user'",
        args: [],
      });

      expect(tableCheck.rows).toHaveLength(1);
    });

    test("should handle different Better Auth models", async () => {
      const adapterInstance = adapterFactory({});

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
      const tableCheck = await client.execute({
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
      const adapterInstance = adapterFactory({});

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
      expect(schema.code).toContain("email TEXT NOT NULL UNIQUE");
      expect(schema.code).toContain("Better Auth Schema for Turso/libSQL");
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

      const adapterInstance = adapter({} as any);
      // Test that the adapter was created successfully with plural option
      expect(adapterInstance).toBeDefined();
      expect(typeof adapterInstance.create).toBe("function");
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

      const instance1 = adapter1({} as any);
      expect(instance1).toBeDefined();
      expect(typeof instance1.create).toBe("function");

      // Test boolean debug logs
      const adapter2 = tursoAdapter({
        client,
        debugLogs: true,
      });

      const instance2 = adapter2({} as any);
      expect(instance2).toBeDefined();
      expect(typeof instance2.create).toBe("function");
    });
  });
});
