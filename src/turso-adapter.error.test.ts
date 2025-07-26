import { describe, test, expect, beforeEach, vi } from "vitest";
import Database from "better-sqlite3";
import { tursoAdapter } from "./index.js";
import { createClient } from "./test-setup.js";

describe("TursoAdapter - Error Handling Tests", () => {
  let database: Database.Database;
  let adapter: any;
  let adapterInstance: any;

  beforeEach(async () => {
    database = new Database(":memory:");
    adapter = tursoAdapter({ database: database });
    adapterInstance = adapter({
      debugLog: false,
      schema: {},
      options: {},
    }).adapter;

    // Setup test table with constraints
    await database.execute({
      sql: `CREATE TABLE IF NOT EXISTS error_test (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        age INTEGER CHECK (age >= 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: [],
    });
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
    test("should return null when updating non-existent record", async () => {
      const result = await adapterInstance.update({
        model: "error_test",
        where: [{ field: "id", value: "non-existent" }],
        update: { name: "Updated Name" },
      });

      expect(result).toBeNull();
    });

    test("should return null when finding non-existent record", async () => {
      const result = await adapterInstance.findOne({
        model: "error_test",
        where: [{ field: "id", value: "non-existent" }],
      });

      expect(result).toBeNull();
    });

    test("should return empty array when finding with non-matching criteria", async () => {
      const result = await adapterInstance.findMany({
        model: "error_test",
        where: [{ field: "name", value: "Non-existent User" }],
      });

      expect(result).toEqual([]);
    });

    test("should return 0 when counting with non-matching criteria", async () => {
      const result = await adapterInstance.count({
        model: "error_test",
        where: [{ field: "name", value: "Non-existent User" }],
      });

      expect(result).toBe(0);
    });

    test("should return 0 when deleting non-existent records", async () => {
      const result = await adapterInstance.deleteMany({
        model: "error_test",
        where: [{ field: "name", value: "Non-existent User" }],
      });

      expect(result).toBe(0);
    });

    test("should not throw when deleting non-existent record", async () => {
      await expect(
        adapterInstance.delete({
          model: "error_test",
          where: [{ field: "id", value: "non-existent" }],
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("Invalid Table Names", () => {
    test("should handle operations on non-existent tables", async () => {
      // The adapter creates tables dynamically, so this should work
      const result = await adapterInstance.create({
        model: "non_existent_table",
        data: { id: "test", name: "Test" },
      });

      expect(result).toBeTruthy();
      expect(result.id).toBe("test");
      expect(result.name).toBe("Test");
    });

    test("should handle malformed table names gracefully", async () => {
      // This should be rejected by the database
      await expect(
        adapterInstance.findOne({
          model: "'; DROP TABLE error_test; --",
          where: [{ field: "id", value: "test" }],
        }),
      ).rejects.toThrow();
    });
  });

  describe("Invalid Column Operations", () => {
    test("should handle queries on non-existent columns", async () => {
      // Create a user first
      await adapterInstance.create({
        model: "error_test",
        data: {
          id: "test",
          name: "Test",
          email: "test@example.com",
        },
      });

      // Query with non-existent column should fail
      await expect(
        adapterInstance.findOne({
          model: "error_test",
          where: [{ field: "non_existent_column", value: "value" }],
        }),
      ).rejects.toThrow();
    });

    test("should handle malformed column names in where clauses", async () => {
      await expect(
        adapterInstance.findOne({
          model: "error_test",
          where: [{ field: "'; DROP TABLE error_test; --", value: "value" }],
        }),
      ).rejects.toThrow();
    });
  });

  describe("Data Type Handling", () => {
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

      // SQLite should store it as-is, but our adapter might handle it
      expect(result.age).toBe("not-a-number");
    });

    test("should handle very large numbers", async () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      const result = await adapterInstance.create({
        model: "error_test",
        data: {
          id: "large-number-test",
          name: "Test User",
          age: largeNumber,
        },
      });

      expect(result.age).toBe(largeNumber);
    });

    test("should handle special float values", async () => {
      // Test NaN, Infinity - these should be converted to null
      const result = await adapterInstance.create({
        model: "error_test",
        data: {
          id: "special-float-test",
          name: "Test User",
          age: NaN,
        },
      });

      expect(result.age).toBeNull(); // NaN should be sanitized to null
    });
  });

  describe("Connection and Client Errors", () => {
    test("should handle client execution errors", async () => {
      // Mock client to throw error
      const mockClient = {
        execute: vi.fn().mockRejectedValue(new Error("Connection failed")),
      };

      const errorAdapter = tursoAdapter({ database: mockClient as any });
      const errorInstance = errorAdapter({
        debugLog: false,
        schema: {},
        options: {},
      }).adapter;

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

      const errorAdapter = tursoAdapter({ database: mockClient as any });
      const errorInstance = errorAdapter({
        debugLog: false,
        schema: {},
        options: {},
      }).adapter;

      await expect(
        errorInstance.create({
          model: "error_test",
          data: { id: "test", name: "Test" },
        }),
      ).rejects.toThrow("Query timeout");
    });

    test("should handle malformed response from database", async () => {
      // Mock client with invalid response
      const mockClient = {
        execute: vi.fn().mockResolvedValue({}), // Missing required fields
      };

      const errorAdapter = tursoAdapter({ database: mockClient as any });
      const errorInstance = errorAdapter({
        debugLog: false,
        schema: {},
        options: {},
      }).adapter;

      await expect(
        errorInstance.create({
          model: "error_test",
          data: { id: "test", name: "Test" },
        }),
      ).rejects.toThrow("Failed to create record");
    });
  });

  describe("Malformed Queries", () => {
    test("should handle empty where conditions gracefully", async () => {
      const result = await adapterInstance.findMany({
        model: "error_test",
        where: [],
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
      expect(result.name).toBe("Test");
      // Undefined should be filtered out
      expect(result.email).toBeUndefined();
    });

    test("should handle malformed where conditions", async () => {
      // Where condition without required fields
      await expect(
        adapterInstance.findOne({
          model: "error_test",
          where: [{ invalidField: "value" }], // Missing 'field' property
        }),
      ).resolves.toBeNull(); // Should handle gracefully and return null
    });
  });

  describe("Large Data Handling", () => {
    test("should handle large strings", async () => {
      const largeString = "a".repeat(100000); // 100KB string

      const result = await adapterInstance.create({
        model: "error_test",
        data: {
          id: "large-string-test",
          name: largeString,
        },
      });

      expect(result.name).toBe(largeString);
      expect(result.name.length).toBe(100000);
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
        where: [
          { field: "id", value: "multi-param-test" },
          { field: "name", value: "Test User" },
          { field: "email", value: "test@example.com" },
          { field: "age", value: 25 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("multi-param-test");
    });

    test("should handle extremely large JSON objects", async () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`.repeat(10),
        })),
      };

      const result = await adapterInstance.create({
        model: "error_test",
        data: {
          id: "large-json-test",
          name: "Test User",
          metadata: largeObject,
        },
      });

      expect(result.metadata).toEqual(largeObject);
      expect(result.metadata.data).toHaveLength(1000);
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
        where: [],
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
        id: "undefined-test-2",
        name: "Test User",
        email: undefined,
      };

      const result2 = await adapterInstance.create({
        model: "error_test",
        data: undefinedData,
      });

      // Undefined should be filtered out, so email should not be set
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

    test("should handle circular references in JSON", async () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      // Should not crash, but should handle the circular reference
      const result = await adapterInstance.create({
        model: "error_test",
        data: {
          id: "circular-test",
          name: "Test User",
          metadata: circularObj,
        },
      });

      expect(result.id).toBe("circular-test");
      expect(result.name).toBe("Test User");
      // Metadata should be a string representation since JSON.stringify failed
      expect(typeof result.metadata).toBe("string");
    });

    test("should handle invalid Date objects", async () => {
      const invalidDate = new Date("invalid-date");

      const result = await adapterInstance.create({
        model: "error_test",
        data: {
          id: "invalid-date-test",
          name: "Test User",
          created_at: invalidDate,
        },
      });

      expect(result.id).toBe("invalid-date-test");
      // Invalid date should be serialized as its string representation
      expect(result.created_at).toBe("Invalid Date");
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
          where: [{ field: "id", value: "concurrent-test" }],
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
          where: [{ field: "name", value: "User 1" }],
        }),
      );

      const results = await Promise.allSettled(promises);

      // All should complete without throwing unhandled errors
      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    });

    test("should handle race conditions in table creation", async () => {
      // Create multiple adapters that might try to create the same table
      const adapters = await Promise.all(Array.from({ length: 3 }, async () => {
        const db = await createClient({ url: ":memory:" });
        const adapter = tursoAdapter({ database: db });
        return adapter({
          debugLog: false,
          schema: {},
          options: {},
        }).adapter;
      }));

      // Try to create records in the same table concurrently
      const promises = adapters.map((adapter, i) =>
        adapter.create({
          model: "race_condition_test",
          data: {
            id: `race-${i}`,
            name: `User ${i}`,
          },
        }),
      );

      const results = await Promise.allSettled(promises);

      // All should succeed since each adapter has its own database
      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    });
  });

  describe("Memory and Resource Management", () => {
    test("should handle operations on very large datasets", async () => {
      // Create a large number of records
      const recordCount = 1000;
      for (let i = 0; i < recordCount; i++) {
        await adapterInstance.create({
          model: "error_test",
          data: {
            id: `bulk-${i}`,
            name: `User ${i}`,
            age: 20 + (i % 50),
          },
        });
      }

      // Test that queries still work
      const count = await adapterInstance.count({
        model: "error_test",
        where: [],
      });

      expect(count).toBe(recordCount);

      // Test large result set
      const allRecords = await adapterInstance.findMany({
        model: "error_test",
        where: [],
      });

      expect(allRecords).toHaveLength(recordCount);
    });

    test("should handle rapid sequential operations", async () => {
      const operationCount = 100;
      const promises = [];

      // Create many operations in quick succession
      for (let i = 0; i < operationCount; i++) {
        promises.push(
          adapterInstance.create({
            model: "error_test",
            data: {
              id: `rapid-${i}`,
              name: `User ${i}`,
            },
          }),
        );
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === "fulfilled");

      // Most operations should succeed
      expect(successful.length).toBeGreaterThan(operationCount * 0.8);
    });
  });
});
