import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "./index.js";

// Mock the libSQL client
vi.mock("@libsql/client", () => ({
  createClient: vi.fn(),
}));

describe("TursoAdapter - Unit Tests", () => {
  const mockClient = {
    execute: vi.fn(),
    close: vi.fn(),
  };

  const mockCreateClient = vi.mocked(createClient);

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockReturnValue(mockClient as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Configuration", () => {
    test("should accept client configuration", () => {
      expect(() => {
        tursoAdapter({ client: mockClient as any });
      }).not.toThrow();
    });

    test("should accept config configuration", () => {
      expect(() => {
        tursoAdapter({
          config: {
            url: ":memory:",
          },
        });
      }).not.toThrow();

      expect(mockCreateClient).toHaveBeenCalledWith({
        url: ":memory:",
      });
    });

    test("should throw error when neither client nor config provided", () => {
      expect(() => {
        tursoAdapter({});
      }).toThrow(
        "Either 'client' or 'config' must be provided to the Turso adapter",
      );
    });

    test("should respect usePlural option", () => {
      const adapter = tursoAdapter({
        client: mockClient as any,
        usePlural: true,
      });

      expect(adapter).toBeDefined();
    });

    test("should respect debugLogs option", () => {
      const adapter = tursoAdapter({
        client: mockClient as any,
        debugLogs: {
          create: true,
          update: true,
        },
      });

      expect(adapter).toBeDefined();
    });
  });

  describe("Adapter Properties", () => {
    test("should return correct adapter configuration", () => {
      const adapter = tursoAdapter({
        client: mockClient as any,
        usePlural: true,
        debugLogs: true,
      });

      const adapterConfig = adapter({} as any);

      expect(adapterConfig.config.adapterId).toBe("turso-adapter");
      expect(adapterConfig.config.adapterName).toBe("Turso Adapter");
      expect(adapterConfig.config.usePlural).toBe(true);
      expect(adapterConfig.config.debugLogs).toBe(true);
      expect(adapterConfig.config.supportsJSON).toBe(true);
      expect(adapterConfig.config.supportsDates).toBe(true);
      expect(adapterConfig.config.supportsBooleans).toBe(true);
      expect(adapterConfig.config.supportsNumericIds).toBe(true);
    });

    test("should default usePlural to false", () => {
      const adapter = tursoAdapter({
        client: mockClient as any,
      });

      const adapterConfig = adapter({} as any);
      expect(adapterConfig.config.usePlural).toBe(false);
    });

    test("should default debugLogs to false", () => {
      const adapter = tursoAdapter({
        client: mockClient as any,
      });

      const adapterConfig = adapter({} as any);
      expect(adapterConfig.config.debugLogs).toBe(false);
    });
  });

  describe("CRUD Operations", () => {
    let adapter: any;
    let adapterInstance: any;

    beforeEach(() => {
      adapter = tursoAdapter({
        client: mockClient as any,
        debugLogs: {
          create: true,
          update: true,
          delete: true,
          findOne: true,
          findMany: true,
          count: true,
        },
      });
      adapterInstance = adapter({
        debugLog: {
          create: true,
          update: true,
          delete: true,
          findOne: true,
          findMany: true,
          count: true,
        },
      });
    });

    describe("create", () => {
      test("should create a record successfully", async () => {
        const mockRow = { id: "1", name: "John", email: "john@example.com" };
        mockClient.execute.mockResolvedValue({
          rows: [mockRow],
          rowsAffected: 1,
        });

        const result = await adapterInstance.create({
          model: "user",
          data: { name: "John", email: "john@example.com" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "INSERT INTO user (name, email) VALUES (?, ?) RETURNING *",
          args: ["John", "john@example.com"],
        });

        expect(result).toEqual(mockRow);
      });

      test("should throw error if no rows returned", async () => {
        mockClient.execute.mockResolvedValue({
          rows: [],
          rowsAffected: 0,
        });

        await expect(
          adapterInstance.create({
            model: "user",
            data: { name: "John" },
          }),
        ).rejects.toThrow("Failed to create record");
      });

      test("should handle empty data object", async () => {
        const mockRow = { id: "1" };
        mockClient.execute.mockResolvedValue({
          rows: [mockRow],
          rowsAffected: 1,
        });

        const result = await adapterInstance.create({
          model: "user",
          data: {},
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "INSERT INTO user () VALUES () RETURNING *",
          args: [],
        });

        expect(result).toEqual(mockRow);
      });
    });

    describe("update", () => {
      test("should update a record successfully", async () => {
        const mockRow = { id: "1", name: "Jane", email: "john@example.com" };
        mockClient.execute.mockResolvedValue({
          rows: [mockRow],
          rowsAffected: 1,
        });

        const result = await adapterInstance.update({
          model: "user",
          where: { id: "1" },
          update: { name: "Jane" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "UPDATE user SET name = ? WHERE id = ? RETURNING *",
          args: ["Jane", "1"],
        });

        expect(result).toEqual(mockRow);
      });

      test("should throw error if no rows returned", async () => {
        mockClient.execute.mockResolvedValue({
          rows: [],
          rowsAffected: 0,
        });

        await expect(
          adapterInstance.update({
            model: "user",
            where: { id: "1" },
            update: { name: "Jane" },
          }),
        ).rejects.toThrow("Failed to update record or record not found");
      });

      test("should handle multiple where conditions", async () => {
        const mockRow = { id: "1", name: "Jane", status: "active" };
        mockClient.execute.mockResolvedValue({
          rows: [mockRow],
          rowsAffected: 1,
        });

        await adapterInstance.update({
          model: "user",
          where: { id: "1", status: "active" },
          update: { name: "Jane" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "UPDATE user SET name = ? WHERE id = ? AND status = ? RETURNING *",
          args: ["Jane", "1", "active"],
        });
      });
    });

    describe("updateMany", () => {
      test("should update multiple records successfully", async () => {
        mockClient.execute.mockResolvedValue({
          rowsAffected: 3,
        });

        const result = await adapterInstance.updateMany({
          model: "user",
          where: { status: "inactive" },
          update: { status: "active" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "UPDATE user SET status = ? WHERE status = ?",
          args: ["active", "inactive"],
        });

        expect(result).toBe(3);
      });

      test("should return 0 if no rows affected", async () => {
        mockClient.execute.mockResolvedValue({
          rowsAffected: 0,
        });

        const result = await adapterInstance.updateMany({
          model: "user",
          where: { status: "nonexistent" },
          update: { status: "active" },
        });

        expect(result).toBe(0);
      });
    });

    describe("delete", () => {
      test("should delete a record successfully", async () => {
        mockClient.execute.mockResolvedValue({
          rowsAffected: 1,
        });

        await adapterInstance.delete({
          model: "user",
          where: { id: "1" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "DELETE FROM user WHERE id = ?",
          args: ["1"],
        });
      });

      test("should handle multiple where conditions", async () => {
        mockClient.execute.mockResolvedValue({
          rowsAffected: 1,
        });

        await adapterInstance.delete({
          model: "user",
          where: { id: "1", status: "inactive" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "DELETE FROM user WHERE id = ? AND status = ?",
          args: ["1", "inactive"],
        });
      });
    });

    describe("deleteMany", () => {
      test("should delete multiple records successfully", async () => {
        mockClient.execute.mockResolvedValue({
          rowsAffected: 5,
        });

        const result = await adapterInstance.deleteMany({
          model: "user",
          where: { status: "inactive" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "DELETE FROM user WHERE status = ?",
          args: ["inactive"],
        });

        expect(result).toBe(5);
      });

      test("should return 0 if no rows affected", async () => {
        mockClient.execute.mockResolvedValue({
          rowsAffected: 0,
        });

        const result = await adapterInstance.deleteMany({
          model: "user",
          where: { status: "nonexistent" },
        });

        expect(result).toBe(0);
      });
    });

    describe("findOne", () => {
      test("should find a record successfully", async () => {
        const mockRow = { id: "1", name: "John", email: "john@example.com" };
        mockClient.execute.mockResolvedValue({
          rows: [mockRow],
        });

        const result = await adapterInstance.findOne({
          model: "user",
          where: { id: "1" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT * FROM user WHERE id = ? LIMIT 1",
          args: ["1"],
        });

        expect(result).toEqual(mockRow);
      });

      test("should return null if no record found", async () => {
        mockClient.execute.mockResolvedValue({
          rows: [],
        });

        const result = await adapterInstance.findOne({
          model: "user",
          where: { id: "nonexistent" },
        });

        expect(result).toBeNull();
      });

      test("should handle select parameter", async () => {
        const mockRow = { id: "1", name: "John" };
        mockClient.execute.mockResolvedValue({
          rows: [mockRow],
        });

        await adapterInstance.findOne({
          model: "user",
          where: { id: "1" },
          select: ["id", "name"],
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT id, name FROM user WHERE id = ? LIMIT 1",
          args: ["1"],
        });
      });

      test("should handle empty select array", async () => {
        const mockRow = { id: "1", name: "John" };
        mockClient.execute.mockResolvedValue({
          rows: [mockRow],
        });

        await adapterInstance.findOne({
          model: "user",
          where: { id: "1" },
          select: [],
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT * FROM user WHERE id = ? LIMIT 1",
          args: ["1"],
        });
      });
    });

    describe("findMany", () => {
      test("should find multiple records successfully", async () => {
        const mockRows = [
          { id: "1", name: "John" },
          { id: "2", name: "Jane" },
        ];
        mockClient.execute.mockResolvedValue({
          rows: mockRows,
        });

        const result = await adapterInstance.findMany({
          model: "user",
          where: { status: "active" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT * FROM user WHERE status = ?",
          args: ["active"],
        });

        expect(result).toEqual(mockRows);
      });

      test("should return empty array if no records found", async () => {
        mockClient.execute.mockResolvedValue({
          rows: [],
        });

        const result = await adapterInstance.findMany({
          model: "user",
          where: { status: "nonexistent" },
        });

        expect(result).toEqual([]);
      });

      test("should handle limit parameter", async () => {
        const mockRows = [{ id: "1", name: "John" }];
        mockClient.execute.mockResolvedValue({
          rows: mockRows,
        });

        await adapterInstance.findMany({
          model: "user",
          where: { status: "active" },
          limit: 10,
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT * FROM user WHERE status = ? LIMIT ?",
          args: ["active", 10],
        });
      });

      test("should handle offset parameter", async () => {
        const mockRows = [{ id: "1", name: "John" }];
        mockClient.execute.mockResolvedValue({
          rows: mockRows,
        });

        await adapterInstance.findMany({
          model: "user",
          where: { status: "active" },
          offset: 20,
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT * FROM user WHERE status = ? OFFSET ?",
          args: ["active", 20],
        });
      });

      test("should handle sortBy parameter", async () => {
        const mockRows = [{ id: "1", name: "John" }];
        mockClient.execute.mockResolvedValue({
          rows: mockRows,
        });

        await adapterInstance.findMany({
          model: "user",
          where: { status: "active" },
          sortBy: { name: "asc", createdAt: "desc" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT * FROM user WHERE status = ? ORDER BY name ASC, createdAt DESC",
          args: ["active"],
        });
      });

      test("should handle all parameters together", async () => {
        const mockRows = [{ id: "1", name: "John" }];
        mockClient.execute.mockResolvedValue({
          rows: mockRows,
        });

        await adapterInstance.findMany({
          model: "user",
          where: { status: "active" },
          limit: 10,
          offset: 20,
          sortBy: { name: "asc" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT * FROM user WHERE status = ? ORDER BY name ASC LIMIT ? OFFSET ?",
          args: ["active", 10, 20],
        });
      });

      test("should handle empty where condition", async () => {
        const mockRows = [{ id: "1", name: "John" }];
        mockClient.execute.mockResolvedValue({
          rows: mockRows,
        });

        await adapterInstance.findMany({
          model: "user",
          where: {},
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT * FROM user",
          args: [],
        });
      });

      test("should handle null where condition", async () => {
        const mockRows = [{ id: "1", name: "John" }];
        mockClient.execute.mockResolvedValue({
          rows: mockRows,
        });

        await adapterInstance.findMany({
          model: "user",
          where: null,
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT * FROM user",
          args: [],
        });
      });
    });

    describe("count", () => {
      test("should count records successfully", async () => {
        mockClient.execute.mockResolvedValue({
          rows: [{ count: 42 }],
        });

        const result = await adapterInstance.count({
          model: "user",
          where: { status: "active" },
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT COUNT(*) as count FROM user WHERE status = ?",
          args: ["active"],
        });

        expect(result).toBe(42);
      });

      test("should return 0 if no rows returned", async () => {
        mockClient.execute.mockResolvedValue({
          rows: [],
        });

        const result = await adapterInstance.count({
          model: "user",
          where: { status: "active" },
        });

        expect(result).toBe(0);
      });

      test("should handle empty where condition", async () => {
        mockClient.execute.mockResolvedValue({
          rows: [{ count: 100 }],
        });

        const result = await adapterInstance.count({
          model: "user",
          where: {},
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT COUNT(*) as count FROM user",
          args: [],
        });

        expect(result).toBe(100);
      });

      test("should handle null where condition", async () => {
        mockClient.execute.mockResolvedValue({
          rows: [{ count: 100 }],
        });

        const result = await adapterInstance.count({
          model: "user",
          where: null,
        });

        expect(mockClient.execute).toHaveBeenCalledWith({
          sql: "SELECT COUNT(*) as count FROM user",
          args: [],
        });

        expect(result).toBe(100);
      });
    });
  });

  describe("Schema Generation", () => {
    let adapter: any;
    let adapterInstance: any;

    beforeEach(() => {
      adapter = tursoAdapter({
        client: mockClient as any,
        debugLogs: { create: true },
      });
      adapterInstance = adapter({
        debugLog: { create: true },
      });
    });

    test("should generate schema without file", async () => {
      const tables = {
        user: {
          fields: {
            id: { type: "string", required: true, unique: true },
            name: { type: "string", required: true },
            email: { type: "string", required: true, unique: true },
            age: { type: "number", required: false },
            isActive: { type: "boolean", required: false, defaultValue: true },
            createdAt: { type: "date", required: true },
          },
        },
      };

      const result = await adapterInstance.createSchema({
        tables,
      });

      expect(result.code).toContain("CREATE TABLE IF NOT EXISTS user");
      expect(result.code).toContain("id TEXT NOT NULL UNIQUE");
      expect(result.code).toContain("name TEXT NOT NULL");
      expect(result.code).toContain("email TEXT NOT NULL UNIQUE");
      expect(result.code).toContain("age INTEGER");
      expect(result.code).toContain("isActive BOOLEAN DEFAULT true");
      expect(result.code).toContain("createdAt DATETIME NOT NULL");
      expect(result.path).toBe("schema.sql");
    });

    test("should generate schema with file path", async () => {
      const tables = {
        user: {
          fields: {
            id: { type: "string", required: true },
          },
        },
      };

      // Mock fs module
      const mockWriteFile = vi.fn().mockResolvedValue(undefined);
      vi.doMock("fs/promises", () => ({
        writeFile: mockWriteFile,
      }));

      const result = await adapterInstance.createSchema({
        file: "custom-schema.sql",
        tables,
      });

      expect(result.path).toBe("custom-schema.sql");
      expect(mockWriteFile).toHaveBeenCalledWith(
        "custom-schema.sql",
        expect.stringContaining("CREATE TABLE IF NOT EXISTS user"),
        "utf-8",
      );
    });

    test("should handle string default values", async () => {
      const tables = {
        user: {
          fields: {
            status: { type: "string", defaultValue: "active" },
          },
        },
      };

      const result = await adapterInstance.createSchema({
        tables,
      });

      expect(result.code).toContain("status TEXT DEFAULT 'active'");
    });

    test("should handle non-string default values", async () => {
      const tables = {
        user: {
          fields: {
            count: { type: "number", defaultValue: 0 },
            isEnabled: { type: "boolean", defaultValue: false },
          },
        },
      };

      const result = await adapterInstance.createSchema({
        tables,
      });

      expect(result.code).toContain("count INTEGER DEFAULT 0");
      expect(result.code).toContain("isEnabled BOOLEAN DEFAULT false");
    });

    test("should handle unknown field types", async () => {
      const tables = {
        user: {
          fields: {
            customField: { type: "unknown" as any },
          },
        },
      };

      const result = await adapterInstance.createSchema({
        tables,
      });

      expect(result.code).toContain("customField TEXT");
    });

    test("should generate schema for multiple tables", async () => {
      const tables = {
        user: {
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
          },
        },
        session: {
          fields: {
            id: { type: "string", required: true },
            userId: { type: "string", required: true },
            expiresAt: { type: "date", required: true },
          },
        },
      };

      const result = await adapterInstance.createSchema({
        tables,
      });

      expect(result.code).toContain("CREATE TABLE IF NOT EXISTS user");
      expect(result.code).toContain("CREATE TABLE IF NOT EXISTS session");
      expect(result.code).toContain("userId TEXT NOT NULL");
      expect(result.code).toContain("expiresAt DATETIME NOT NULL");
    });
  });

  describe("Debug Logging", () => {
    test("should log when debug is enabled", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const adapter = tursoAdapter({
        client: mockClient as any,
        debugLogs: { create: true },
      });

      const adapterInstance = adapter({
        debugLog: { create: true },
      });

      mockClient.execute.mockResolvedValue({
        rows: [{ id: "1" }],
        rowsAffected: 1,
      });

      await adapterInstance.create({
        model: "user",
        data: { name: "John" },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Turso Adapter] Creating in user:",
        { name: "John" },
      );

      consoleSpy.mockRestore();
    });

    test("should not log when debug is disabled", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const adapter = tursoAdapter({
        client: mockClient as any,
        debugLogs: false,
      });

      const adapterInstance = adapter({
        debugLog: false,
      });

      mockClient.execute.mockResolvedValue({
        rows: [{ id: "1" }],
        rowsAffected: 1,
      });

      await adapterInstance.create({
        model: "user",
        data: { name: "John" },
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
