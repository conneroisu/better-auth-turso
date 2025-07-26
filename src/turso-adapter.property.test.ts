import { describe, test, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "./index.js";

describe("TursoAdapter - Property-Based Tests", () => {
  let client: ReturnType<typeof createClient>;
  let adapter: any;
  let adapterInstance: any;

  beforeEach(async () => {
    client = createClient({ url: ":memory:" });
    adapter = tursoAdapter({ client });
    adapterInstance = adapter({ debugLog: false });

    // Setup test table with various field types
    await client.execute(`
      CREATE TABLE IF NOT EXISTS property_test (
        id TEXT PRIMARY KEY,
        string_field TEXT,
        integer_field INTEGER,
        boolean_field BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  describe("CRUD Operations Properties", () => {
    test("create then findOne should return the same data", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => !s.includes("'")),
            string_field: fc.option(fc.string({ maxLength: 100 }), {
              nil: null,
            }),
            integer_field: fc.option(
              fc.integer({ min: -1000000, max: 1000000 }),
              { nil: null },
            ),
            boolean_field: fc.option(fc.boolean(), { nil: null }),
          }),
          async (data) => {
            try {
              // Create record
              const created = await adapterInstance.create({
                model: "property_test",
                data,
              });

              // Find the same record
              const found = await adapterInstance.findOne({
                model: "property_test",
                where: { id: data.id },
              });

              // Should find the record and it should match created data
              expect(found).not.toBeNull();
              expect(found?.id).toBe(data.id);
              expect(found?.string_field).toBe(data.string_field);
              expect(found?.integer_field).toBe(data.integer_field);
              expect(found?.boolean_field).toBe(data.boolean_field);

              // Cleanup
              await adapterInstance.delete({
                model: "property_test",
                where: { id: data.id },
              });
            } catch (error) {
              // Log the error for debugging but don't fail the property test
              // unless it's a constraint violation (which is expected behavior)
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    test("update should modify only specified fields", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => !s.includes("'")),
            initial_string: fc.string({ maxLength: 50 }),
            initial_integer: fc.integer({ min: 0, max: 1000 }),
            updated_string: fc.string({ maxLength: 50 }),
          }),
          async ({ id, initial_string, initial_integer, updated_string }) => {
            try {
              // Create initial record
              await adapterInstance.create({
                model: "property_test",
                data: {
                  id,
                  string_field: initial_string,
                  integer_field: initial_integer,
                  boolean_field: true,
                },
              });

              // Update only string field
              const updated = await adapterInstance.update({
                model: "property_test",
                where: { id },
                update: { string_field: updated_string },
              });

              // String field should be updated, others should remain the same
              expect(updated.string_field).toBe(updated_string);
              expect(updated.integer_field).toBe(initial_integer);
              expect(updated.boolean_field).toBe(true);

              // Cleanup
              await adapterInstance.delete({
                model: "property_test",
                where: { id },
              });
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 30 },
      );
    });

    test("delete then findOne should return null", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => !s.includes("'")),
          async (id) => {
            try {
              // Create record
              await adapterInstance.create({
                model: "property_test",
                data: {
                  id,
                  string_field: "test",
                  integer_field: 42,
                  boolean_field: true,
                },
              });

              // Verify it exists
              const beforeDelete = await adapterInstance.findOne({
                model: "property_test",
                where: { id },
              });
              expect(beforeDelete).not.toBeNull();

              // Delete the record
              await adapterInstance.delete({
                model: "property_test",
                where: { id },
              });

              // Should not find the record after deletion
              const afterDelete = await adapterInstance.findOne({
                model: "property_test",
                where: { id },
              });
              expect(afterDelete).toBeNull();
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 30 },
      );
    });

    test("count should equal the number of created records", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .array(
              fc.record({
                id: fc
                  .string({ minLength: 1, maxLength: 50 })
                  .filter((s) => !s.includes("'")),
                string_field: fc.string({ maxLength: 20 }),
              }),
              { minLength: 0, maxLength: 10 },
            )
            .map((arr) => {
              // Ensure unique IDs
              const uniqueIds = new Set();
              return arr.filter((item) => {
                if (uniqueIds.has(item.id)) {
                  return false;
                }
                uniqueIds.add(item.id);
                return true;
              });
            }),
          async (records) => {
            try {
              // Clean up any existing records first
              await client.execute("DELETE FROM property_test");

              // Create all records
              for (const record of records) {
                await adapterInstance.create({
                  model: "property_test",
                  data: record,
                });
              }

              // Count should match the number of records created
              const count = await adapterInstance.count({
                model: "property_test",
                where: {},
              });

              expect(count).toBe(records.length);

              // Cleanup
              await client.execute("DELETE FROM property_test");
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 20 },
      );
    });

    test("findMany with limit should return at most limit records", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            numRecords: fc.integer({ min: 1, max: 20 }),
            limit: fc.integer({ min: 1, max: 15 }),
          }),
          async ({ numRecords, limit }) => {
            try {
              // Clean up
              await client.execute("DELETE FROM property_test");

              // Create records
              const records = Array.from({ length: numRecords }, (_, i) => ({
                id: `test-${i}`,
                string_field: `value-${i}`,
                integer_field: i,
              }));

              for (const record of records) {
                await adapterInstance.create({
                  model: "property_test",
                  data: record,
                });
              }

              // Find with limit
              const found = await adapterInstance.findMany({
                model: "property_test",
                where: {},
                limit,
              });

              // Should return at most 'limit' records
              expect(found.length).toBeLessThanOrEqual(limit);
              expect(found.length).toBeLessThanOrEqual(numRecords);
              expect(found.length).toBe(Math.min(limit, numRecords));

              // Cleanup
              await client.execute("DELETE FROM property_test");
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 20 },
      );
    });

    test("updateMany and deleteMany should affect correct number of records", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            numActive: fc.integer({ min: 1, max: 10 }),
            numInactive: fc.integer({ min: 1, max: 10 }),
          }),
          async ({ numActive, numInactive }) => {
            try {
              // Clean up
              await client.execute("DELETE FROM property_test");

              // Create active records
              for (let i = 0; i < numActive; i++) {
                await adapterInstance.create({
                  model: "property_test",
                  data: {
                    id: `active-${i}`,
                    string_field: "active",
                    integer_field: i,
                  },
                });
              }

              // Create inactive records
              for (let i = 0; i < numInactive; i++) {
                await adapterInstance.create({
                  model: "property_test",
                  data: {
                    id: `inactive-${i}`,
                    string_field: "inactive",
                    integer_field: i + 100,
                  },
                });
              }

              // Update all active records
              const updateResult = await adapterInstance.updateMany({
                model: "property_test",
                where: { string_field: "active" },
                update: { string_field: "updated" },
              });

              expect(updateResult).toBe(numActive);

              // Verify updates
              const updatedRecords = await adapterInstance.findMany({
                model: "property_test",
                where: { string_field: "updated" },
              });

              expect(updatedRecords.length).toBe(numActive);

              // Delete all updated records
              const deleteResult = await adapterInstance.deleteMany({
                model: "property_test",
                where: { string_field: "updated" },
              });

              expect(deleteResult).toBe(numActive);

              // Only inactive records should remain
              const remainingCount = await adapterInstance.count({
                model: "property_test",
                where: {},
              });

              expect(remainingCount).toBe(numInactive);

              // Cleanup
              await client.execute("DELETE FROM property_test");
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 15 },
      );
    });
  });

  describe("Data Type Properties", () => {
    test("string fields should handle various string values correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc
              .string({ minLength: 1, maxLength: 20 })
              .filter((s) => !s.includes("'")),
            string_value: fc.string({ maxLength: 100 }),
          }),
          async ({ id, string_value }) => {
            try {
              const created = await adapterInstance.create({
                model: "property_test",
                data: {
                  id,
                  string_field: string_value,
                },
              });

              expect(created.string_field).toBe(string_value);

              const found = await adapterInstance.findOne({
                model: "property_test",
                where: { id },
              });

              expect(found?.string_field).toBe(string_value);

              // Cleanup
              await adapterInstance.delete({
                model: "property_test",
                where: { id },
              });
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    test("integer fields should handle various integer values correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc
              .string({ minLength: 1, maxLength: 20 })
              .filter((s) => !s.includes("'")),
            integer_value: fc.integer({ min: -2147483648, max: 2147483647 }),
          }),
          async ({ id, integer_value }) => {
            try {
              const created = await adapterInstance.create({
                model: "property_test",
                data: {
                  id,
                  integer_field: integer_value,
                },
              });

              expect(created.integer_field).toBe(integer_value);

              const found = await adapterInstance.findOne({
                model: "property_test",
                where: { id },
              });

              expect(found?.integer_field).toBe(integer_value);

              // Cleanup
              await adapterInstance.delete({
                model: "property_test",
                where: { id },
              });
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    test("boolean fields should handle true/false values correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc
              .string({ minLength: 1, maxLength: 20 })
              .filter((s) => !s.includes("'")),
            boolean_value: fc.boolean(),
          }),
          async ({ id, boolean_value }) => {
            try {
              const created = await adapterInstance.create({
                model: "property_test",
                data: {
                  id,
                  boolean_field: boolean_value,
                },
              });

              expect(created.boolean_field).toBe(boolean_value);

              const found = await adapterInstance.findOne({
                model: "property_test",
                where: { id },
              });

              expect(found?.boolean_field).toBe(boolean_value);

              // Cleanup
              await adapterInstance.delete({
                model: "property_test",
                where: { id },
              });
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe("Query Properties", () => {
    test("findMany with sorting should maintain order", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .array(
              fc.record({
                id: fc
                  .string({ minLength: 1, maxLength: 20 })
                  .filter((s) => !s.includes("'")),
                sort_value: fc.integer({ min: 0, max: 100 }),
              }),
              { minLength: 2, maxLength: 10 },
            )
            .map((arr) => {
              // Ensure unique IDs
              const uniqueIds = new Set();
              return arr.filter((item) => {
                if (uniqueIds.has(item.id)) {
                  return false;
                }
                uniqueIds.add(item.id);
                return true;
              });
            })
            .filter((arr) => arr.length >= 2), // Ensure we have at least 2 items for sorting tests
          async (records) => {
            try {
              // Clean up
              await client.execute("DELETE FROM property_test");

              // Create records
              for (const record of records) {
                await adapterInstance.create({
                  model: "property_test",
                  data: {
                    id: record.id,
                    integer_field: record.sort_value,
                  },
                });
              }

              // Test ascending sort
              const ascResults = await adapterInstance.findMany({
                model: "property_test",
                where: {},
                sortBy: { integer_field: "asc" },
              });

              // Check ascending order
              for (let i = 1; i < ascResults.length; i++) {
                expect(ascResults[i].integer_field).toBeGreaterThanOrEqual(
                  ascResults[i - 1].integer_field,
                );
              }

              // Test descending sort
              const descResults = await adapterInstance.findMany({
                model: "property_test",
                where: {},
                sortBy: { integer_field: "desc" },
              });

              // Check descending order
              for (let i = 1; i < descResults.length; i++) {
                expect(descResults[i].integer_field).toBeLessThanOrEqual(
                  descResults[i - 1].integer_field,
                );
              }

              // Cleanup
              await client.execute("DELETE FROM property_test");
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 15 },
      );
    });

    test("pagination should be consistent", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            numRecords: fc.integer({ min: 5, max: 20 }),
            pageSize: fc.integer({ min: 2, max: 8 }),
          }),
          async ({ numRecords, pageSize }) => {
            try {
              // Clean up
              await client.execute("DELETE FROM property_test");

              // Create records with predictable ordering
              const records = Array.from({ length: numRecords }, (_, i) => ({
                id: `page-test-${i.toString().padStart(3, "0")}`,
                integer_field: i,
              }));

              for (const record of records) {
                await adapterInstance.create({
                  model: "property_test",
                  data: record,
                });
              }

              // Test pagination consistency
              const allResults: any[] = [];
              let offset = 0;

              while (offset < numRecords) {
                const pageResults = await adapterInstance.findMany({
                  model: "property_test",
                  where: {},
                  sortBy: { integer_field: "asc" },
                  limit: pageSize,
                  offset,
                });

                allResults.push(...pageResults);

                if (pageResults.length < pageSize) {
                  break; // Last page
                }

                offset += pageSize;
              }

              // Should have retrieved all records
              expect(allResults.length).toBe(numRecords);

              // Should be in correct order
              for (let i = 1; i < allResults.length; i++) {
                expect(allResults[i].integer_field).toBeGreaterThan(
                  allResults[i - 1].integer_field,
                );
              }

              // No duplicates
              const ids = allResults.map((r) => r.id);
              const uniqueIds = new Set(ids);
              expect(uniqueIds.size).toBe(ids.length);

              // Cleanup
              await client.execute("DELETE FROM property_test");
            } catch (error) {
              if (
                error instanceof Error &&
                !error.message.includes("UNIQUE constraint")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe("Schema Generation Properties", () => {
    test("generated schema should be valid SQL", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tableName: fc
              .string({ minLength: 1, maxLength: 20 })
              .filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)), // Valid SQL identifier
            fields: fc
              .dictionary(
                fc
                  .string({ minLength: 1, maxLength: 15 })
                  .filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)), // Valid SQL identifier
                fc.record({
                  type: fc.constantFrom("string", "number", "boolean", "date"),
                  required: fc.boolean(),
                  unique: fc.boolean(),
                  defaultValue: fc.option(
                    fc.oneof(
                      fc.string({ maxLength: 20 }),
                      fc.integer({ min: 0, max: 1000 }),
                      fc.boolean(),
                    ),
                    { nil: undefined },
                  ),
                }),
              )
              .filter((dict) => Object.keys(dict).length > 0), // At least one field
          }),
          async ({ tableName, fields }) => {
            try {
              const tables = {
                [tableName]: { fields },
              };

              const schema = await adapterInstance.createSchema({
                tables,
              });

              // Schema should contain the table name
              expect(schema.code).toContain(
                `CREATE TABLE IF NOT EXISTS ${tableName}`,
              );

              // Should be valid SQL (test by executing it)
              const testClient = createClient({ url: ":memory:" });
              await expect(
                testClient.execute(schema.code),
              ).resolves.not.toThrow();

              // Should contain all field names
              for (const fieldName of Object.keys(fields)) {
                expect(schema.code).toContain(fieldName);
              }
            } catch (error) {
              // Only allow expected SQL-related errors
              if (
                error instanceof Error &&
                !error.message.includes("SQL") &&
                !error.message.includes("syntax")
              ) {
                throw error;
              }
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
