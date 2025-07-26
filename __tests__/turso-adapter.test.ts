import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { createClient, type Client } from "@libsql/client";
import { tursoAdapter } from "../src/index";

describe("TursoAdapter", () => {
  let client: Client;
  let adapter: ReturnType<typeof tursoAdapter>;

  beforeEach(async () => {
    // Create an in-memory SQLite database for testing
    client = createClient({
      url: ":memory:",
    });

    // Create the adapter
    adapter = tursoAdapter({
      client,
      debugLogs: true,
    });

    // Initialize the database with basic tables
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        emailVerified INTEGER DEFAULT 0,
        image TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        token TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        accessToken TEXT,
        refreshToken TEXT,
        expiresAt INTEGER,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER
      )
    `);
  });

  afterEach(async () => {
    // Clean up
    await client.close();
  });

  describe("Configuration", () => {
    test("throws error when neither client nor config provided", () => {
      expect(() => tursoAdapter({})).toThrow(
        "Either 'client' or 'config' must be provided to the Turso adapter"
      );
    });

    test("accepts client configuration", () => {
      const testClient = createClient({ url: ":memory:" });
      const testAdapter = tursoAdapter({ client: testClient });
      
      expect(testAdapter).toBeDefined();
      expect(testAdapter.config.adapterId).toBe("turso-adapter");
      expect(testAdapter.config.adapterName).toBe("Turso Adapter");
    });

    test("accepts database config", () => {
      const testAdapter = tursoAdapter({
        config: { url: ":memory:" },
      });
      
      expect(testAdapter).toBeDefined();
      expect(testAdapter.config.adapterId).toBe("turso-adapter");
    });

    test("sets correct adapter capabilities", () => {
      expect(adapter.config.supportsJSON).toBe(true);
      expect(adapter.config.supportsDates).toBe(true);
      expect(adapter.config.supportsBooleans).toBe(true);
      expect(adapter.config.supportsNumericIds).toBe(true);
    });
  });

  describe("CRUD Operations", () => {
    const testUser = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    test("creates a user", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      const result = await adapterInstance.create({
        model: "user",
        data: testUser,
      });

      expect(result).toEqual(testUser);
    });

    test("finds a user by id", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Create user first
      await adapterInstance.create({
        model: "user",
        data: testUser,
      });

      // Find the user
      const result = await adapterInstance.findOne({
        model: "user",
        where: { id: testUser.id },
      });

      expect(result).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
      });
    });

    test("finds users with multiple conditions", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Create multiple users
      await adapterInstance.create({
        model: "user",
        data: testUser,
      });

      await adapterInstance.create({
        model: "user",
        data: {
          id: "user-2",
          name: "Another User",
          email: "another@example.com",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Find users with specific criteria
      const results = await adapterInstance.findMany({
        model: "user",
        where: { emailVerified: false },
      });

      expect(results).toHaveLength(1);
      expect(results[0].email).toBe(testUser.email);
    });

    test("updates a user", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Create user first
      await adapterInstance.create({
        model: "user",
        data: testUser,
      });

      // Update the user
      const updatedName = "Updated Test User";
      const result = await adapterInstance.update({
        model: "user",
        where: { id: testUser.id },
        data: { name: updatedName },
      });

      expect(result.name).toBe(updatedName);
      expect(result.email).toBe(testUser.email); // unchanged
    });

    test("deletes a user", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Create user first
      await adapterInstance.create({
        model: "user",
        data: testUser,
      });

      // Delete the user
      await adapterInstance.delete({
        model: "user",
        where: { id: testUser.id },
      });

      // Verify deletion
      const result = await adapterInstance.findOne({
        model: "user",
        where: { id: testUser.id },
      });

      expect(result).toBeNull();
    });

    test("counts records", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Create multiple users
      await adapterInstance.create({
        model: "user",
        data: testUser,
      });

      await adapterInstance.create({
        model: "user",
        data: {
          id: "user-2",
          name: "Another User",
          email: "another@example.com",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Count all users
      const totalCount = await adapterInstance.count({
        model: "user",
      });

      expect(totalCount).toBe(2);

      // Count with filter
      const verifiedCount = await adapterInstance.count({
        model: "user",
        where: { emailVerified: true },
      });

      expect(verifiedCount).toBe(1);
    });
  });

  describe("Session Management", () => {
    const testSession = {
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      token: "test-token",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(async () => {
      // Create a user first for foreign key constraint
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      await adapterInstance.create({
        model: "user",
        data: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    test("creates and finds session", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Create session
      await adapterInstance.create({
        model: "session",
        data: testSession,
      });

      // Find session
      const result = await adapterInstance.findOne({
        model: "session",
        where: { id: testSession.id },
      });

      expect(result).toMatchObject({
        id: testSession.id,
        userId: testSession.userId,
        token: testSession.token,
      });
    });

    test("finds session by token", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Create session
      await adapterInstance.create({
        model: "session",
        data: testSession,
      });

      // Find by token
      const result = await adapterInstance.findOne({
        model: "session",
        where: { token: testSession.token },
      });

      expect(result?.id).toBe(testSession.id);
    });

    test("deletes expired sessions", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Create expired session
      const expiredSession = {
        ...testSession,
        id: "session-expired",
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
      };

      await adapterInstance.create({
        model: "session",
        data: expiredSession,
      });

      // Create valid session
      await adapterInstance.create({
        model: "session",
        data: testSession,
      });

      // Delete expired sessions (this would typically be done by Better Auth)
      await adapterInstance.delete({
        model: "session",
        where: { id: expiredSession.id },
      });

      // Verify only valid session remains
      const validSession = await adapterInstance.findOne({
        model: "session",
        where: { id: testSession.id },
      });

      const expiredResult = await adapterInstance.findOne({
        model: "session",
        where: { id: expiredSession.id },
      });

      expect(validSession).toBeTruthy();
      expect(expiredResult).toBeNull();
    });
  });

  describe("Error Handling", () => {
    test("handles unique constraint violations gracefully", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Create user
      await adapterInstance.create({
        model: "user",
        data: {
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Try to create another user with same email (should fail)
      await expect(async () => {
        await adapterInstance.create({
          model: "user",
          data: {
            id: "user-2",
            name: "Another User",
            email: "test@example.com", // duplicate email
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }).toThrow();
    });

    test("handles foreign key constraint violations", async () => {
      const adapterInstance = adapter.adapter({ debugLog: console.log });
      
      // Try to create session without user (should fail due to foreign key)
      await expect(async () => {
        await adapterInstance.create({
          model: "session",
          data: {
            id: "session-1",
            userId: "non-existent-user",
            expiresAt: new Date(Date.now() + 86400000),
            token: "test-token",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }).toThrow();
    });
  });
});