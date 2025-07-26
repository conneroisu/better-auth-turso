import { describe, test, expect, beforeEach, vi } from "vitest";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "./index.js";

describe("TursoAdapter - Error Handling Tests", () => {
  let client: ReturnType<typeof createClient>;
  let adapter: any;
  let adapterInstance: any;

  beforeEach(async () => {
    client = createClient({ url: ":memory:" });
    adapter = tursoAdapter({ client });
    adapterInstance = adapter({ debugLog: false });

    // Setup test table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS error_test (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        age INTEGER CHECK (age >= 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  describe("Database Constraint Violations", () => {
    test("should handle primary key constraint violations", async () => {
      const userData = {
        id: "duplicate-id",
        name: "Test User",
        email: "test@example.com",
      };

      // Create first record
      await adapterInstance.create({
        model: "error_test",
        data: userData,
      });

      // Attempt to create duplicate
      await expect(
        adapterInstance.create({
          model: "error_test",
          data: {
            id: "duplicate-id", // Same ID
            name: "Another User",
            email: "different@example.com",
          },
        }),
      ).rejects.toThrow();
    });

    test("should handle unique constraint violations", async () => {
      const userData = {
        id: "user-1",
        name: "Test User",
        email: "unique@example.com",
      };

      // Create first record
      await adapterInstance.create({
        model: "error_test",
        data: userData,
      });

      // Attempt to create record with duplicate email
      await expect(
        adapterInstance.create({
          model: "error_test",
          data: {
            id: "user-2",
            name: "Another User",
            email: "unique@example.com", // Duplicate email
          },
        }),
      ).rejects.toThrow();
    });

    test("should handle NOT NULL constraint violations", async () => {
      // Attempt to create record without required field
      await expect(
        adapterInstance.create({
          model: "error_test",
          data: {
            id: "missing-name",
            // name is required but missing
            email: "test@example.com",
          },
        }),
      ).rejects.toThrow();
    });

    test("should handle CHECK constraint violations", async () => {
      // Attempt to create record with invalid age
      await expect(
        adapterInstance.create({
          model: "error_test",
          data: {
            id: "invalid-age",
            name: "Test User",
            email: "test@example.com",
            age: -5, // Violates CHECK constraint
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Non-existent Records", () => {
    test("should throw error when updating non-existent record", async () => {
      await expect(
        adapterInstance.update({
          model: "error_test",
          where: { id: "non-existent" },
          update: { name: "Updated Name" },
        }),
      ).rejects.toThrow("Failed to update record or record not found");
    });

    test("should return null when finding non-existent record", async () => {
      const result = await adapterInstance.findOne({
        model: "error_test",
        where: { id: "non-existent" },
      });

      expect(result).toBeNull();
    });

    test("should return empty array when finding with non-matching criteria", async () => {
      const result = await adapterInstance.findMany({
        model: "error_test",
        where: { name: "Non-existent User" },
      });

      expect(result).toEqual([]);
    });

    test("should return 0 when counting with non-matching criteria", async () => {
      const result = await adapterInstance.count({
        model: "error_test",
        where: { name: "Non-existent User" },
      });

      expect(result).toBe(0);
    });

    test("should return 0 when deleting non-existent records", async () => {
      const result = await adapterInstance.deleteMany({
        model: "error_test",
        where: { name: "Non-existent User" },
      });

      expect(result).toBe(0);
    });

    test("should not throw when deleting non-existent record", async () => {
      await expect(
        adapterInstance.delete({
          model: "error_test",
          where: { id: "non-existent" },
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("Invalid Table Names", () => {
    test("should handle invalid table names gracefully", async () => {
      await expect(
        adapterInstance.create({
          model: "non_existent_table",
          data: { id: "test" },
        }),
      ).rejects.toThrow();
    });

    test("should handle malformed table names", async () => {
      await expect(
        adapterInstance.findOne({
          model: "'; DROP TABLE error_test; --",
          where: { id: "test" },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Invalid Column Names", () => {
    test("should handle non-existent column names", async () => {
      await expect(
        adapterInstance.create({
          model: "error_test",
          data: {
            id: "test",
            name: "Test",
            non_existent_column: "value",
          },
        }),
      ).rejects.toThrow();
    });

    test("should handle malformed column names in where clauses", async () => {
      await expect(
        adapterInstance.findOne({
          model: "error_test",
          where: { "'; DROP TABLE error_test; --": "value" },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Data Type Mismatches", () => {
    test("should handle type conversion gracefully", async () => {
      // SQLite is generally permissive with types, but let's test edge cases
      const result = await adapterInstance.create({
        model: "error_test",
        data: {
          id: "type-test",
          name: "Test User",
          age: "not-a-number", // String instead of number
        },
      });

      // SQLite should store it as-is
      expect(result.age).toBe("not-a-number");
    });
  });

  describe("Connection and Client Errors", () => {
    test("should handle client execution errors", async () => {
      // Mock client to throw error
      const mockClient = {
        execute: vi.fn().mockRejectedValue(new Error("Connection failed")),
      };

      const errorAdapter = tursoAdapter({ client: mockClient as any });
      const errorInstance = errorAdapter({ debugLog: false });

      await expect(
        errorInstance.create({
          model: "error_test",
          data: { id: "test", name: "Test" },
        }),
      ).rejects.toThrow("Connection failed");
    });

    test("should handle timeout errors", async () => {
      // Mock client with slow response
      const mockClient = {
        execute: vi.fn().mockImplementation(
          () =>
            new Promise((_, reject) =>
              setTimeout(() => {
                reject(new Error("Query timeout"));
              }, 100),
            ),
        ),
      };

      const errorAdapter = tursoAdapter({ client: mockClient as any });
      const errorInstance = errorAdapter({ debugLog: false });

      await expect(
        errorInstance.create({
          model: "error_test",
          data: { id: "test", name: "Test" },
        }),
      ).rejects.toThrow("Query timeout");
    });
  });

  describe("Malformed Queries", () => {
    test("should handle empty where conditions gracefully", async () => {
      const result = await adapterInstance.findMany({
        model: "error_test",
        where: {},
      });

      expect(Array.isArray(result)).toBe(true);
    });

    test("should handle null where conditions", async () => {
      const result = await adapterInstance.findMany({
        model: "error_test",
        where: null as any,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    test("should handle undefined values in data", async () => {
      const result = await adapterInstance.create({
        model: "error_test",
        data: {
          id: "undefined-test",
          name: "Test",
          email: undefined, // Undefined value
        },
      });

      expect(result.id).toBe("undefined-test");
    });
  });

  describe("Large Data Handling", () => {
    test("should handle large strings", async () => {
      const largeString = "a".repeat(10000);

      const result = await adapterInstance.create({
        model: "error_test",
        data: {
          id: "large-string-test",
          name: largeString,
        },
      });

      expect(result.name).toBe(largeString);
    });

    test("should handle many parameters in where clause", async () => {
      // Create a record first
      await adapterInstance.create({
        model: "error_test",
        data: {
          id: "multi-param-test",
          name: "Test User",
          email: "test@example.com",
          age: 25,
        },
      });

      // Try to find with multiple where conditions
      const result = await adapterInstance.findOne({
        model: "error_test",
        where: {
          id: "multi-param-test",
          name: "Test User",
          email: "test@example.com",
          age: 25,
        },
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("multi-param-test");
    });
  });

  describe("Schema Generation Errors", () => {
    test("should handle empty tables object", async () => {
      const result = await adapterInstance.createSchema({
        tables: {},
      });

      expect(result.code).toContain("-- Better Auth Schema for Turso/libSQL");
      expect(result.path).toBe("schema.sql");
    });

    test("should handle tables with no fields", async () => {
      const result = await adapterInstance.createSchema({
        tables: {
          empty_table: { fields: {} },
        },
      });

      expect(result.code).toContain("CREATE TABLE IF NOT EXISTS empty_table");
    });

    test("should handle invalid field types", async () => {
      const result = await adapterInstance.createSchema({
        tables: {
          invalid_types: {
            fields: {
              unknown_field: { type: "invalid_type" as any },
            },
          },
        },
      });

      // Should default to TEXT for unknown types
      expect(result.code).toContain("unknown_field TEXT");
    });

    test("should handle file write errors", async () => {
      // Mock fs module to throw error
      vi.doMock("fs/promises", () => ({
        writeFile: vi.fn().mockRejectedValue(new Error("Permission denied")),
      }));

      await expect(
        adapterInstance.createSchema({
          file: "/invalid/path/schema.sql",
          tables: {
            test_table: {
              fields: {
                id: { type: "string" },
              },
            },
          },
        }),
      ).rejects.toThrow("Permission denied");
    });
  });

  describe("Edge Cases", () => {
    test("should handle SQL injection attempts", async () => {
      // Test SQL injection in data values (should be parameterized)
      const maliciousData = {
        id: "injection-test",
        name: "'; DROP TABLE error_test; --",
        email: "test@example.com",
      };

      const result = await adapterInstance.create({
        model: "error_test",
        data: maliciousData,
      });

      // Should store the malicious string as data, not execute it
      expect(result.name).toBe("'; DROP TABLE error_test; --");

      // Table should still exist
      const count = await adapterInstance.count({
        model: "error_test",
        where: {},
      });

      expect(count).toBeGreaterThan(0);
    });

    test("should handle special characters in data", async () => {
      const specialData = {
        id: "special-chars",
        name: "Special: !@#$%^&*()_+-=[]{}|;:,.<>?",
        email: "special+test@example.com",
      };

      const result = await adapterInstance.create({
        model: "error_test",
        data: specialData,
      });

      expect(result.name).toBe(specialData.name);
      expect(result.email).toBe(specialData.email);
    });

    test("should handle Unicode characters", async () => {
      const unicodeData = {
        id: "unicode-test",
        name: "测试用户 🚀 émojí",
        email: "unicode@测试.com",
      };

      const result = await adapterInstance.create({
        model: "error_test",
        data: unicodeData,
      });

      expect(result.name).toBe(unicodeData.name);
      expect(result.email).toBe(unicodeData.email);
    });

    test("should handle null and undefined values consistently", async () => {
      const nullData = {
        id: "null-test",
        name: "Test User",
        email: null,
      };

      const result = await adapterInstance.create({
        model: "error_test",
        data: nullData,
      });

      expect(result.email).toBeNull();

      // Test undefined
      const undefinedData = {
        id: "undefined-test",
        name: "Test User",
        email: undefined,
      };

      const result2 = await adapterInstance.create({
        model: "error_test",
        data: undefinedData,
      });

      expect(result2.email).toBeUndefined();
    });

    test("should handle empty string values", async () => {
      const emptyData = {
        id: "empty-test",
        name: "",
        email: "empty@example.com",
      };

      const result = await adapterInstance.create({
        model: "error_test",
        data: emptyData,
      });

      expect(result.name).toBe("");
    });

    test("should handle very long field names", async () => {
      const longFieldQuery = await client.execute(`
        CREATE TABLE IF NOT EXISTS long_field_test (
          id TEXT PRIMARY KEY,
          ${"very_long_field_name_".repeat(5)} TEXT
        )
      `);

      // This might fail due to SQL limits, which is expected behavior
      // Just ensure it doesn't crash the adapter
      expect(typeof longFieldQuery).toBe("object");
    });
  });

  describe("Concurrent Access Errors", () => {
    test("should handle concurrent writes to same record", async () => {
      // Create initial record
      await adapterInstance.create({
        model: "error_test",
        data: {
          id: "concurrent-test",
          name: "Initial",
          email: "concurrent@example.com",
        },
      });

      // Simulate concurrent updates
      const promises = Array.from({ length: 5 }, (_, i) =>
        adapterInstance.update({
          model: "error_test",
          where: { id: "concurrent-test" },
          update: { name: `Updated-${i}` },
        }),
      );

      // Some might fail, but at least one should succeed
      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === "fulfilled");

      expect(successful.length).toBeGreaterThan(0);
    });

    test("should handle concurrent deletes", async () => {
      // Create records
      for (let i = 0; i < 5; i++) {
        await adapterInstance.create({
          model: "error_test",
          data: {
            id: `concurrent-delete-${i}`,
            name: `User ${i}`,
          },
        });
      }

      // Simulate concurrent deletes of the same records
      const promises = Array.from({ length: 3 }, () =>
        adapterInstance.deleteMany({
          model: "error_test",
          where: { name: "User 1" },
        }),
      );

      const results = await Promise.allSettled(promises);

      // All should complete without throwing unhandled errors
      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    });
  });
});
