import { describe, test, expect, beforeEach } from "vitest";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "./index.js";

describe("TursoAdapter - Performance Tests", () => {
  let client: ReturnType<typeof createClient>;
  let adapter: any;
  let adapterInstance: any;

  beforeEach(async () => {
    client = createClient({ url: ":memory:" });
    adapter = tursoAdapter({ client });
    adapterInstance = adapter({ debugLog: false });

    // Setup performance test table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS perf_test (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        age INTEGER,
        status TEXT DEFAULT 'active',
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_perf_test_name ON perf_test(name)
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_perf_test_status ON perf_test(status)
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_perf_test_age ON perf_test(age)
    `);
  });

  describe("Bulk Operations Performance", () => {
    test("should handle bulk inserts efficiently", async () => {
      const recordCount = 1000;
      const records = Array.from({ length: recordCount }, (_, i) => ({
        id: `bulk-insert-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: 20 + (i % 50),
        status: i % 2 === 0 ? "active" : "inactive",
        data: JSON.stringify({ index: i, metadata: "test data" }),
      }));

      const startTime = performance.now();

      // Insert records one by one (simulate batch operations)
      for (const record of records) {
        await adapterInstance.create({
          model: "perf_test",
          data: record,
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Bulk insert of ${recordCount} records took ${duration.toFixed(2)}ms`,
      );
      console.log(
        `Average: ${(duration / recordCount).toFixed(2)}ms per record`,
      );

      // Verify all records were inserted
      const count = await adapterInstance.count({
        model: "perf_test",
        where: {},
      });

      expect(count).toBe(recordCount);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    }, 60000);

    test("should handle bulk updates efficiently", async () => {
      const recordCount = 500;

      // First, create records
      for (let i = 0; i < recordCount; i++) {
        await adapterInstance.create({
          model: "perf_test",
          data: {
            id: `bulk-update-${i}`,
            name: `User ${i}`,
            age: 25,
            status: "inactive",
          },
        });
      }

      const startTime = performance.now();

      // Update all records
      const updateResult = await adapterInstance.updateMany({
        model: "perf_test",
        where: { status: "inactive" },
        update: { status: "active", age: 30 },
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Bulk update of ${recordCount} records took ${duration.toFixed(2)}ms`,
      );

      expect(updateResult).toBe(recordCount);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test("should handle bulk deletes efficiently", async () => {
      const recordCount = 500;

      // First, create records
      for (let i = 0; i < recordCount; i++) {
        await adapterInstance.create({
          model: "perf_test",
          data: {
            id: `bulk-delete-${i}`,
            name: `User ${i}`,
            status: "to_delete",
          },
        });
      }

      const startTime = performance.now();

      // Delete all records
      const deleteResult = await adapterInstance.deleteMany({
        model: "perf_test",
        where: { status: "to_delete" },
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Bulk delete of ${recordCount} records took ${duration.toFixed(2)}ms`,
      );

      expect(deleteResult).toBe(recordCount);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("Query Performance", () => {
    beforeEach(async () => {
      // Create test data for query performance tests
      const recordCount = 1000;
      for (let i = 0; i < recordCount; i++) {
        await adapterInstance.create({
          model: "perf_test",
          data: {
            id: `query-test-${i}`,
            name: `User ${i}`,
            email: `user${i}@example.com`,
            age: 20 + (i % 50),
            status: ["active", "inactive", "pending"][i % 3],
            data: JSON.stringify({ level: i % 10, score: i * 10 }),
          },
        });
      }
    });

    test("should perform indexed queries efficiently", async () => {
      const startTime = performance.now();

      // Query using indexed field
      const results = await adapterInstance.findMany({
        model: "perf_test",
        where: { status: "active" },
        limit: 100,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Indexed query took ${duration.toFixed(2)}ms`);

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(100);
      expect(duration).toBeLessThan(100); // Should be very fast with index
    });

    test("should handle range queries efficiently", async () => {
      // Note: This requires a more complex where clause implementation
      // For now, we'll test multiple separate queries

      const startTime = performance.now();

      // Find users in age range (simulated with multiple queries)
      const youngUsers = await adapterInstance.findMany({
        model: "perf_test",
        where: { age: 25 },
        limit: 50,
      });

      const middleAgedUsers = await adapterInstance.findMany({
        model: "perf_test",
        where: { age: 35 },
        limit: 50,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Range queries took ${duration.toFixed(2)}ms`);

      expect(youngUsers.length + middleAgedUsers.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(200);
    });

    test("should handle sorting performance", async () => {
      const startTime = performance.now();

      const sortedResults = await adapterInstance.findMany({
        model: "perf_test",
        where: {},
        sortBy: { age: "asc", name: "desc" },
        limit: 200,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Sorting query took ${duration.toFixed(2)}ms`);

      expect(sortedResults.length).toBe(200);

      // Verify sorting
      for (let i = 1; i < sortedResults.length; i++) {
        expect(sortedResults[i].age).toBeGreaterThanOrEqual(
          sortedResults[i - 1].age,
        );
      }

      expect(duration).toBeLessThan(500); // Sorting should be reasonably fast
    });

    test("should handle pagination performance", async () => {
      const pageSize = 50;
      const pages = 5;

      const startTime = performance.now();

      const allPages = [];
      for (let page = 0; page < pages; page++) {
        const pageResults = await adapterInstance.findMany({
          model: "perf_test",
          where: {},
          sortBy: { id: "asc" },
          limit: pageSize,
          offset: page * pageSize,
        });
        allPages.push(pageResults);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Pagination of ${pages} pages took ${duration.toFixed(2)}ms`);

      expect(allPages.length).toBe(pages);
      expect(allPages.every((page) => page.length <= pageSize)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should be fast with proper indexing
    });

    test("should handle count queries efficiently", async () => {
      const startTime = performance.now();

      const totalCount = await adapterInstance.count({
        model: "perf_test",
        where: {},
      });

      const activeCount = await adapterInstance.count({
        model: "perf_test",
        where: { status: "active" },
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Count queries took ${duration.toFixed(2)}ms`);

      expect(totalCount).toBeGreaterThan(0);
      expect(activeCount).toBeGreaterThan(0);
      expect(activeCount).toBeLessThanOrEqual(totalCount);
      expect(duration).toBeLessThan(100); // Count should be very fast
    });
  });

  describe("Memory Usage", () => {
    test("should handle large result sets without excessive memory usage", async () => {
      const recordCount = 2000;

      // Create test data
      for (let i = 0; i < recordCount; i++) {
        await adapterInstance.create({
          model: "perf_test",
          data: {
            id: `memory-test-${i}`,
            name: `User ${i}`,
            data: "x".repeat(1000), // 1KB of data per record
          },
        });
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // Fetch large result set
      const results = await adapterInstance.findMany({
        model: "perf_test",
        where: {},
        limit: recordCount,
      });

      const afterQueryMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = afterQueryMemory - initialMemory;

      console.log(
        `Memory increase for ${recordCount} records: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
      );

      expect(results.length).toBe(recordCount);
      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 30000);

    test("should not leak memory on repeated operations", async () => {
      const iterations = 100;
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        // Create
        await adapterInstance.create({
          model: "perf_test",
          data: {
            id: `leak-test-${i}`,
            name: `User ${i}`,
            data: "test data",
          },
        });

        // Read
        await adapterInstance.findOne({
          model: "perf_test",
          where: { id: `leak-test-${i}` },
        });

        // Update
        await adapterInstance.update({
          model: "perf_test",
          where: { id: `leak-test-${i}` },
          update: { name: `Updated User ${i}` },
        });

        // Delete
        await adapterInstance.delete({
          model: "perf_test",
          where: { id: `leak-test-${i}` },
        });

        // Force garbage collection occasionally
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(
        `Memory increase after ${iterations} operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
      );

      // Should not have significant memory leaks
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
    });
  });

  describe("Concurrent Performance", () => {
    test("should handle concurrent reads efficiently", async () => {
      // Create test data
      for (let i = 0; i < 100; i++) {
        await adapterInstance.create({
          model: "perf_test",
          data: {
            id: `concurrent-read-${i}`,
            name: `User ${i}`,
            status: "active",
          },
        });
      }

      const concurrentQueries = 20;
      const startTime = performance.now();

      // Execute concurrent reads
      const promises = Array.from({ length: concurrentQueries }, (_, i) =>
        adapterInstance.findMany({
          model: "perf_test",
          where: { status: "active" },
          limit: 10,
          offset: i * 5,
        }),
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `${concurrentQueries} concurrent reads took ${duration.toFixed(2)}ms`,
      );

      expect(results.length).toBe(concurrentQueries);
      expect(results.every((result) => Array.isArray(result))).toBe(true);
      expect(duration).toBeLessThan(2000); // Should handle concurrency well
    });

    test("should handle mixed concurrent operations", async () => {
      const operations = 50;
      const startTime = performance.now();

      const promises = Array.from({ length: operations }, async (_, i) => {
        const opType = i % 4;
        const id = `mixed-op-${i}`;

        switch (opType) {
          case 0: // Create
            return adapterInstance.create({
              model: "perf_test",
              data: {
                id,
                name: `User ${i}`,
                status: "active",
              },
            });
          case 1: // Read
            return adapterInstance.findMany({
              model: "perf_test",
              where: { status: "active" },
              limit: 5,
            });
          case 2: // Update (may fail if record doesn't exist yet)
            try {
              return await adapterInstance.updateMany({
                model: "perf_test",
                where: { status: "active" },
                update: { updated_at: new Date().toISOString() },
              });
            } catch {
              return 0; // Ignore failures for concurrent operations
            }
          case 3: // Count
            return adapterInstance.count({
              model: "perf_test",
              where: { status: "active" },
            });
          default:
            return null;
        }
      });

      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `${operations} mixed concurrent operations took ${duration.toFixed(2)}ms`,
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      console.log(`${successful}/${operations} operations succeeded`);

      expect(successful).toBeGreaterThan(operations * 0.8); // At least 80% should succeed
      expect(duration).toBeLessThan(5000); // Should complete within reasonable time
    });
  });

  describe("Schema Generation Performance", () => {
    test("should generate large schemas efficiently", async () => {
      const numTables = 50;
      const fieldsPerTable = 20;

      const tables: Record<string, any> = {};

      // Generate large schema definition
      for (let t = 0; t < numTables; t++) {
        const fields: Record<string, any> = {};

        for (let f = 0; f < fieldsPerTable; f++) {
          fields[`field_${f}`] = {
            type: ["string", "number", "boolean", "date"][f % 4],
            required: f % 3 === 0,
            unique: f % 7 === 0,
            defaultValue: f % 5 === 0 ? `default_${f}` : undefined,
          };
        }

        tables[`table_${t}`] = { fields };
      }

      const startTime = performance.now();

      const schema = await adapterInstance.createSchema({
        tables,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Generated schema for ${numTables} tables with ${fieldsPerTable} fields each in ${duration.toFixed(2)}ms`,
      );

      expect(schema.code).toContain("Better Auth Schema for Turso/libSQL");
      expect(schema.code.split("CREATE TABLE").length - 1).toBe(numTables);
      expect(duration).toBeLessThan(1000); // Should be fast even for large schemas
    });
  });

  describe("Data Type Performance", () => {
    test("should handle JSON data efficiently", async () => {
      const recordCount = 500;
      const startTime = performance.now();

      // Create records with complex JSON data
      for (let i = 0; i < recordCount; i++) {
        const complexData = {
          user: {
            id: i,
            profile: {
              name: `User ${i}`,
              settings: {
                theme: "dark",
                notifications: true,
                preferences: Array.from({ length: 10 }, (_, j) => ({
                  key: `pref_${j}`,
                  value: `value_${j}`,
                })),
              },
            },
          },
          metadata: {
            tags: [`tag_${i % 5}`, `category_${i % 3}`],
            scores: Array.from({ length: 5 }, () => Math.random() * 100),
          },
        };

        await adapterInstance.create({
          model: "perf_test",
          data: {
            id: `json-test-${i}`,
            name: `User ${i}`,
            data: JSON.stringify(complexData),
          },
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Created ${recordCount} records with complex JSON in ${duration.toFixed(2)}ms`,
      );

      // Verify data integrity
      const sample = await adapterInstance.findOne({
        model: "perf_test",
        where: { id: "json-test-0" },
      });

      const parsedData = JSON.parse(sample.data);
      expect(parsedData.user.id).toBe(0);
      expect(parsedData.user.profile.settings.preferences).toHaveLength(10);

      expect(duration).toBeLessThan(15000); // Should handle JSON efficiently
    });

    test("should handle large text fields efficiently", async () => {
      const recordCount = 100;
      const textSize = 10000; // 10KB per record
      const startTime = performance.now();

      for (let i = 0; i < recordCount; i++) {
        await adapterInstance.create({
          model: "perf_test",
          data: {
            id: `large-text-${i}`,
            name: `User ${i}`,
            data: "x".repeat(textSize),
          },
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Created ${recordCount} records with ${textSize} char text fields in ${duration.toFixed(2)}ms`,
      );

      expect(duration).toBeLessThan(10000); // Should handle large text fields efficiently
    });
  });
});
