import type { TursoDatabase, TursoAdapterConfig } from "./types.js";
import { DatabaseManager } from "./database.js";
import { SchemaManager } from "./schema.js";
import { DataUtils } from "./utils.js";
import { 
  validateTableName, 
  validateColumnName, 
  validateSortField, 
  validateSortDirection,
  sanitizeLogData,
  quoteSqlIdentifier 
} from "./security.js";

/**
 * Creates a Turso database adapter for Better Auth
 * 
 * @param config - Configuration options for the Turso adapter
 * @returns A function that creates the adapter instance
 * 
 * @example
 * ```typescript
 * import { tursoAdapter } from "better-auth-turso";
 * 
 * const adapter = tursoAdapter({
 *   database: ":memory:", // or path to database file
 *   debugLogs: true
 * });
 * ```
 */
export function createTursoAdapter(
  config: TursoAdapterConfig = {},
): any {
  // Note: Performance and error handling configuration will be implemented
  // in future iterations when performance optimization is added

  // Function to get Database constructor dynamically
  const getDatabaseConstructor = async () => {
    try {
      // Try ES module import first
      const tursoModule = await import("@tursodatabase/turso");
      return tursoModule.default || tursoModule;
    } catch {
      // Fallback to require for CommonJS environments
      return require("@tursodatabase/turso");
    }
  };

  // Initialize Turso database with proper error handling
  const initializeDatabase = async (): Promise<TursoDatabase> => {
    try {
      if (config.database && typeof config.database === "object") {
        // Use provided database instance
        if (config.debugLogs) {
          console.log(`[Turso Adapter] Using provided Turso database instance`);
        }
        return config.database;
      } else if (typeof config.database === "string") {
        // Create database from path
        const Database = await getDatabaseConstructor();
        const dbPath =
          config.database === ":memory:" ? ":memory:" : config.database;
        const db = new Database(dbPath);
        if (config.debugLogs) {
          console.log(
            `[Turso Adapter] Created Turso database from path: ${dbPath}`,
          );
        }
        return db;
      } else {
        // Default to in-memory database
        const Database = await getDatabaseConstructor();
        const db = new Database(":memory:");
        if (config.debugLogs) {
          console.log(`[Turso Adapter] Created in-memory Turso database`);
        }
        return db;
      }
    } catch (error) {
      console.error(
        `[Turso Adapter] Failed to initialize Turso database:`,
        error,
      );
      throw new Error(
        `Failed to initialize Turso database: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return {
    adapter: (_options: any) => {
      // Lazy initialization of database and managers
      let database: TursoDatabase | null = null;
      let dbManager: DatabaseManager | null = null;
      let schemaManager: SchemaManager | null = null;

      const initializeIfNeeded = async () => {
        if (!database) {
          database = await initializeDatabase();
          dbManager = new DatabaseManager(database, config);
          schemaManager = new SchemaManager(dbManager, config);
        }
      };

      return {
      id: "turso",

      create: async ({ model, data, select }: any) => {
        await initializeIfNeeded();
        if (!dbManager || !schemaManager) {
          throw new Error("Failed to initialize database managers");
        }

        // Validate table name to prevent SQL injection
        const validatedModel = validateTableName(model);
        const quotedModel = quoteSqlIdentifier(validatedModel);

        if (config.debugLogs) {
          console.log(`[Turso Adapter] Creating in ${validatedModel}:`, sanitizeLogData(data));
        }

        // Ensure table and columns exist
        await schemaManager.ensureTableExists(validatedModel);

        // Ensure all data fields have corresponding columns (validate column names)
        const dataKeys = Object.keys(data);
        for (const key of dataKeys) {
          const validatedColumn = validateColumnName(key);
          await schemaManager.ensureColumnExists(validatedModel, validatedColumn);
        }

        // Filter out undefined values for SQL insertion and validate column names
        const validEntries = Object.entries(data).filter(
          ([_, value]) => value !== undefined,
        );
        const keys = validEntries.map(([key]) => validateColumnName(key));
        const quotedKeys = keys.map(key => quoteSqlIdentifier(key));
        const values = validEntries.map(([_, value]) =>
          DataUtils.sanitizeValue(value),
        );
        const placeholders = keys.map(() => "?").join(", ");

        // Turso Database doesn't support RETURNING, so we need to do INSERT + SELECT
        const insertSql =
          keys.length > 0
            ? `INSERT INTO ${quotedModel} (${quotedKeys.join(", ")}) VALUES (${placeholders})`
            : `INSERT INTO ${quotedModel} DEFAULT VALUES`;

      if (config.debugLogs) {
        console.log(`[Turso Adapter] Insert SQL:`, insertSql);
        console.log(`[Turso Adapter] Insert values:`, values);
      }

      const insertResult = await dbManager.executeQuery(insertSql, values);

      if (config.debugLogs) {
        console.log(`[Turso Adapter] Insert result:`, insertResult);
      }

      if (!insertResult.rowsAffected) {
        throw new Error("Failed to create record");
      }

        // Get the inserted record using the lastInsertRowid or id field
        let selectSql: string;
        let selectArgs: any[];

        if (insertResult.lastInsertRowid && !data.id) {
          // Use rowid if no custom id was provided
          selectSql = `SELECT * FROM ${quotedModel} WHERE rowid = ?`;
          selectArgs = [insertResult.lastInsertRowid];
        } else if (data.id) {
          // Use the custom id that was inserted
          selectSql = `SELECT * FROM ${quotedModel} WHERE ${quoteSqlIdentifier('id')} = ?`;
          selectArgs = [data.id];
        } else {
          // Fallback: try to find by unique fields
          const uniqueFields = Object.entries(data).filter(
            ([_key, value]) =>
              value !== null && value !== undefined && typeof value !== "object",
          );
          if (uniqueFields.length > 0) {
            const whereClause = uniqueFields
              .map(([fieldName]) => `${quoteSqlIdentifier(validateColumnName(fieldName))} = ?`)
              .join(" AND ");
            selectSql = `SELECT * FROM ${quotedModel} WHERE ${whereClause} ORDER BY rowid DESC LIMIT 1`;
            selectArgs = uniqueFields.map(([_, value]) => value);
          } else {
            selectSql = `SELECT * FROM ${quotedModel} ORDER BY rowid DESC LIMIT 1`;
            selectArgs = [];
          }
        }

      const result = await dbManager.executeQuery(selectSql, selectArgs);

      if (!result.rows?.length) {
        throw new Error("Failed to retrieve created record");
      }

      // Deserialize the returned data
      const row = result.rows[0] as any;
      const deserializedRow = DataUtils.deserializeRow(row);

      // Apply select filtering if specified
      if (select && select.length > 0) {
        const selectedData: any = {};
        for (const field of select) {
          if (field in deserializedRow) {
            selectedData[field] = deserializedRow[field];
          }
        }
        return selectedData;
      }

      return deserializedRow;
    },

      update: async ({ model, where, update, select }: any) => {
        await initializeIfNeeded();
        if (!dbManager || !schemaManager) {
          throw new Error("Failed to initialize database managers");
        }

        if (config.debugLogs) {
          console.log(`[Turso Adapter] Updating in ${model}:`, { where, update });
        }

        // Ensure columns exist for update data
        const updateKeys = Object.keys(update);
        for (const key of updateKeys) {
          await schemaManager.ensureColumnExists(model, key);
        }

      // Process WHERE conditions
      const { whereClause, whereValues } =
        DataUtils.processWhereConditions(where);

      if (!whereClause) {
        throw new Error("Update requires WHERE conditions");
      }

      // Build UPDATE statement
      const setClause = updateKeys.map((key) => `${key} = ?`).join(", ");

      const updateValues = updateKeys.map((key) =>
        DataUtils.sanitizeValue(update[key]),
      );
      const allValues = [...updateValues, ...whereValues];

      const sql = `UPDATE ${model} SET ${setClause} WHERE ${whereClause}`;

      if (config.debugLogs) {
        console.log(`[Turso Adapter] Update SQL: ${sql}`);
        console.log(`[Turso Adapter] Update Values:`, allValues);
      }

      const updateResult = await dbManager.executeQuery(sql, allValues);

      if (updateResult.rowsAffected === 0) {
        return null;
      }

      // Retrieve the updated record
      const selectSql = `SELECT * FROM ${model} WHERE ${whereClause} LIMIT 1`;
      const result = await dbManager.executeQuery(selectSql, whereValues);

      if (!result.rows?.length) {
        return null;
      }

      const row = result.rows[0] as any;
      const deserializedRow = DataUtils.deserializeRow(row);

      // Apply select filtering if specified
      if (select && select.length > 0) {
        const selectedData: any = {};
        for (const field of select) {
          if (field in deserializedRow) {
            selectedData[field] = deserializedRow[field];
          }
        }
        return selectedData;
      }

      return deserializedRow;
    },

      findOne: async ({ model, where, select }: any) => {
        await initializeIfNeeded();
        if (!dbManager || !schemaManager) {
          throw new Error("Failed to initialize database managers");
        }

        await schemaManager.ensureTableExists(model);

      const { whereClause, whereValues } =
        DataUtils.processWhereConditions(where);

      let sql = `SELECT * FROM ${model}`;
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
      sql += ` LIMIT 1`;

      const result = await dbManager.executeQuery(sql, whereValues);

      if (!result.rows?.length) {
        return null;
      }

      const row = result.rows[0] as any;
      const deserializedRow = DataUtils.deserializeRow(row);

      // Apply select filtering if specified
      if (select && select.length > 0) {
        const selectedData: any = {};
        for (const field of select) {
          if (field in deserializedRow) {
            selectedData[field] = deserializedRow[field];
          }
        }
        return selectedData;
      }

      return deserializedRow;
    },

      findMany: async ({ model, where, limit, offset, sortBy }: any) => {
        await initializeIfNeeded();
        if (!dbManager || !schemaManager) {
          throw new Error("Failed to initialize database managers");
        }

        await schemaManager.ensureTableExists(model);

      const { whereClause, whereValues } =
        DataUtils.processWhereConditions(where);

      let sql = `SELECT * FROM ${model}`;
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }

      // Add sorting (with SQL injection prevention)
      if (sortBy) {
        const orderClauses = sortBy.map((sort: any) => {
          // Validate sort field to prevent SQL injection
          const validatedField = validateSortField(sort.field);
          const validatedDirection = validateSortDirection(sort.desc ? "DESC" : "ASC");
          const quotedField = quoteSqlIdentifier(validatedField);
          return `${quotedField} ${validatedDirection}`;
        });
        sql += ` ORDER BY ${orderClauses.join(", ")}`;
      }

      // Add pagination
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }
      if (offset) {
        sql += ` OFFSET ${offset}`;
      }

      const result = await dbManager.executeQuery(sql, whereValues);

      return result.rows.map((row: any) => DataUtils.deserializeRow(row));
    },

      delete: async ({ model, where }: any) => {
        await initializeIfNeeded();
        if (!dbManager || !schemaManager) {
          throw new Error("Failed to initialize database managers");
        }

        const { whereClause, whereValues } =
          DataUtils.processWhereConditions(where);

        if (!whereClause) {
          throw new Error("Delete requires WHERE conditions");
        }

        await schemaManager.ensureTableExists(model);

      const sql = `DELETE FROM ${model} WHERE ${whereClause}`;
      await dbManager.executeQuery(sql, whereValues);
    },

      count: async ({ model, where }: any) => {
        await initializeIfNeeded();
        if (!dbManager || !schemaManager) {
          throw new Error("Failed to initialize database managers");
        }

        await schemaManager.ensureTableExists(model);

      const { whereClause, whereValues } =
        DataUtils.processWhereConditions(where);

      let sql = `SELECT COUNT(*) as count FROM ${model}`;
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }

      const result = await dbManager.executeQuery(sql, whereValues);
      return result.rows[0]?.count || 0;
    },

      updateMany: async ({ model, where, update }: any) => {
        await initializeIfNeeded();
        if (!dbManager || !schemaManager) {
          throw new Error("Failed to initialize database managers");
        }

        if (config.debugLogs) {
          console.log(`[Turso Adapter] Updating many in ${model}:`, {
            where,
            update,
          });
        }

        // Ensure columns exist for update data
        const updateKeys = Object.keys(update);
        for (const key of updateKeys) {
          await schemaManager.ensureColumnExists(model, key);
        }

      // Process WHERE conditions
      const { whereClause, whereValues } =
        DataUtils.processWhereConditions(where);

      if (!whereClause) {
        throw new Error("UpdateMany requires WHERE conditions");
      }

      // Build UPDATE statement
      const setClause = updateKeys.map((key) => `${key} = ?`).join(", ");

      const updateValues = updateKeys.map((key) =>
        DataUtils.sanitizeValue(update[key]),
      );
      const allValues = [...updateValues, ...whereValues];

      const sql = `UPDATE ${model} SET ${setClause} WHERE ${whereClause}`;

      const updateResult = await dbManager.executeQuery(sql, allValues);
      return updateResult.rowsAffected || 0;
    },

      deleteMany: async ({ model, where }: any) => {
        await initializeIfNeeded();
        if (!dbManager || !schemaManager) {
          throw new Error("Failed to initialize database managers");
        }

        if (config.debugLogs) {
          console.log(`[Turso Adapter] Deleting many from ${model}:`, where);
        }

        const { whereClause, whereValues } =
          DataUtils.processWhereConditions(where);

        if (!whereClause) {
          throw new Error("DeleteMany requires WHERE conditions");
        }

        await schemaManager.ensureTableExists(model);

      const sql = `DELETE FROM ${model} WHERE ${whereClause}`;
      const deleteResult = await dbManager.executeQuery(sql, whereValues);
      return deleteResult.rowsAffected || 0;
    },

      createSchema: async ({ tables }: any) => {
        await initializeIfNeeded();
        if (!schemaManager) {
          throw new Error("Failed to initialize schema manager");
        }
        return schemaManager.generateSchema(tables, {});
      },

      options: {
        provider: "turso",
        usePlural: config.usePlural || false,
      },
      };
    },
  };
}
