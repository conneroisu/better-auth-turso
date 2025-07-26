import { createAdapter, type AdapterDebugLogs } from "better-auth/adapters";
import {
  type Client,
  type Config as LibSQLConfig,
  createClient,
} from "@libsql/client";

export interface TursoAdapterConfig {
  /**
   * Turso client instance or configuration to create a new client
   */
  client?: Client;

  /**
   * Turso client configuration (used if client is not provided)
   */
  config?: LibSQLConfig;

  /**
   * Helps you debug issues with the adapter
   */
  debugLogs?: AdapterDebugLogs;

  /**
   * If the table names in the schema are plural
   */
  usePlural?: boolean;
}

export const tursoAdapter = (
  config: TursoAdapterConfig = {},
): ReturnType<typeof createAdapter> => {
  let client: Client;

  if (config.client) {
    client = config.client;
  } else if (config.config) {
    client = createClient(config.config);
  } else {
    throw new Error(
      "Either 'client' or 'config' must be provided to the Turso adapter",
    );
  }

  // Store created tables to avoid recreating them
  const createdTables = new Set<string>();

  // Cache for prepared statements and queries (reserved for future use)
  const _queryCache = new Map<string, any>();
  const _preparedStatements = new Map<string, any>();

  // Cache for frequently accessed data
  const dataCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 5000; // 5 seconds TTL for data cache

  // Performance optimization helpers (reserved for future use)
  const _getCacheKey = (
    model: string,
    operation: string,
    params: any,
  ): string => {
    return `${model}:${operation}:${JSON.stringify(params)}`;
  };

  const getCachedData = (key: string): any | null => {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      dataCache.delete(key); // Remove expired cache
    }
    return null;
  };

  const setCachedData = (key: string, data: any): void => {
    dataCache.set(key, { data, timestamp: Date.now() });
  };

  // Optimized execute function with query caching
  const executeQuery = async (sql: string, args: any[] = []): Promise<any> => {
    const queryKey = `${sql}:${JSON.stringify(args)}`;

    // Check if this is a SELECT query that can be cached
    const isSelectQuery = sql.trim().toUpperCase().startsWith("SELECT");
    const isModifyingQuery = sql
      .trim()
      .toUpperCase()
      .match(/^(INSERT|UPDATE|DELETE)/);

    if (isSelectQuery) {
      const cached = getCachedData(queryKey);
      if (cached) {
        return cached;
      }
    }

    const result = await client.execute({ sql, args });

    // Cache SELECT results
    if (isSelectQuery && result.rows && result.rows.length > 0) {
      setCachedData(queryKey, result);
    }

    // Clear cache for modifying operations
    if (isModifyingQuery) {
      dataCache.clear();
    }

    return result;
  };

  // Batch operation support for better performance (reserved for future use)
  const _batchExecute = async (
    operations: Array<{ sql: string; args: any[] }>,
  ): Promise<any[]> => {
    const results: any[] = [];

    // For now, execute operations sequentially
    // TODO: Implement true batch execution when libSQL supports it
    for (const op of operations) {
      try {
        const result = await client.execute({ sql: op.sql, args: op.args });
        results.push(result);
      } catch (error) {
        results.push({ error });
      }
    }

    return results;
  };

  // Helper function to ensure table exists with Better Auth standard columns
  const ensureTableExists = async (
    model: string,
    options?: any,
  ): Promise<void> => {
    if (createdTables.has(model)) {
      return;
    }

    try {
      // Check if table exists
      const result = await client.execute({
        sql: `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        args: [model],
      });

      if (result.rows && result.rows.length > 0) {
        createdTables.add(model);
        return;
      }
    } catch {
      // Table doesn't exist, continue to create it
    }

    // Create table with standard Better Auth columns based on table name
    try {
      let createSQL = "";

      // Determine ID column type based on options
      const useNumericIds =
        (options as any)?.advanced?.database?.useNumberId === true;
      const idColumn = useNumericIds
        ? "id INTEGER PRIMARY KEY AUTOINCREMENT"
        : "id TEXT PRIMARY KEY";

      if (model === "user") {
        createSQL = `CREATE TABLE IF NOT EXISTS ${model} (
          ${idColumn},
          name TEXT,
          email TEXT UNIQUE,
          emailVerified BOOLEAN DEFAULT FALSE,
          image TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
      } else if (model === "session") {
        createSQL = `CREATE TABLE IF NOT EXISTS ${model} (
          ${idColumn},
          userId ${useNumericIds ? "INTEGER" : "TEXT"} NOT NULL,
          expiresAt DATETIME NOT NULL,
          token TEXT UNIQUE NOT NULL,
          ipAddress TEXT,
          userAgent TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
      } else if (model === "account") {
        createSQL = `CREATE TABLE IF NOT EXISTS ${model} (
          ${idColumn},
          userId ${useNumericIds ? "INTEGER" : "TEXT"} NOT NULL,
          accountId TEXT NOT NULL,
          providerId TEXT NOT NULL,
          accessToken TEXT,
          refreshToken TEXT,
          idToken TEXT,
          accessTokenExpiresAt DATETIME,
          refreshTokenExpiresAt DATETIME,
          scope TEXT,
          password TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
      } else if (model === "verification") {
        createSQL = `CREATE TABLE IF NOT EXISTS ${model} (
          ${idColumn},
          identifier TEXT NOT NULL,
          value TEXT NOT NULL,
          expiresAt DATETIME NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
      } else {
        // Generic table for any other models (including test models)
        // Start with basic id column and let dynamic column addition handle the rest
        createSQL = `CREATE TABLE IF NOT EXISTS ${model} (
          ${idColumn}
        )`;
      }

      await client.execute({
        sql: createSQL,
        args: [],
      });

      createdTables.add(model);
    } catch (_createError) {
      // If creation fails, mark as created to avoid infinite loops
      createdTables.add(model);
    }
  };

  // Helper function to add column if it doesn't exist
  const ensureColumnExists = async (
    model: string,
    column: string,
  ): Promise<void> => {
    try {
      await client.execute({
        sql: `ALTER TABLE ${model} ADD COLUMN ${column} TEXT`,
        args: [],
      });
    } catch {
      // Column already exists or other error, continue
    }
  };

  // Optimized value sanitization with type caching (reserved for future use)
  const _typeCache = new Map<any, string>();
  const sanitizeValue = (value: any): any => {
    if (value === null || value === undefined) {
      return null;
    }

    const valueType = typeof value;

    // Fast path for primitives
    if (
      valueType === "string" ||
      valueType === "number" ||
      valueType === "bigint"
    ) {
      // Check for non-finite numbers
      if (valueType === "number" && !isFinite(value)) {
        return null;
      }
      return value;
    }

    if (valueType === "boolean") {
      return value ? 1 : 0;
    }

    // Fast instanceof checks
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Buffer.isBuffer(value)) {
      return value;
    }

    // Convert complex types to JSON strings
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  // Optimized deserialization with pattern caching and SQLite type handling
  const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  const booleanFields = new Set([
    "emailVerified",
    "verified",
    "active",
    "enabled",
    "deleted",
  ]);

  const deserializeValue = (value: any, fieldName?: string): any => {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle SQLite numeric values
    if (typeof value === "number") {
      // Convert 0/1 to boolean only for known boolean fields
      if (
        fieldName &&
        booleanFields.has(fieldName) &&
        (value === 0 || value === 1)
      ) {
        return value === 1;
      }
      return value;
    }

    // Fast path for non-strings
    if (typeof value !== "string") {
      return value;
    }

    // Optimized date parsing
    if (datePattern.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Optimized JSON parsing
    const firstChar = value[0];
    const lastChar = value[value.length - 1];
    if (
      (firstChar === "{" && lastChar === "}") ||
      (firstChar === "[" && lastChar === "]")
    ) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  };

  // Helper function to process where clause array into SQL conditions
  const processWhereClause = (
    where: any[],
  ): { whereClause: string; whereValues: any[] } => {
    const whereConditions: string[] = [];
    const whereValues: any[] = [];

    if (!where || !Array.isArray(where) || where.length === 0) {
      return { whereClause: "1=1", whereValues: [] };
    }

    for (const condition of where) {
      if (!condition || typeof condition !== "object") {
        continue;
      }

      const { field, value, operator = "eq" } = condition;

      if (!field || typeof field !== "string") {
        continue;
      }

      switch (operator) {
        case "eq":
          whereConditions.push(`${field} = ?`);
          whereValues.push(sanitizeValue(value));
          break;
        case "ne":
          whereConditions.push(`${field} != ?`);
          whereValues.push(sanitizeValue(value));
          break;
        case "gt":
          whereConditions.push(`${field} > ?`);
          whereValues.push(sanitizeValue(value));
          break;
        case "lt":
          whereConditions.push(`${field} < ?`);
          whereValues.push(sanitizeValue(value));
          break;
        case "gte":
          whereConditions.push(`${field} >= ?`);
          whereValues.push(sanitizeValue(value));
          break;
        case "lte":
          whereConditions.push(`${field} <= ?`);
          whereValues.push(sanitizeValue(value));
          break;
        case "in":
          if (Array.isArray(value)) {
            const placeholders = value.map(() => "?").join(", ");
            whereConditions.push(`${field} IN (${placeholders})`);
            whereValues.push(...value.map(sanitizeValue));
          }
          break;
        case "contains":
          whereConditions.push(`${field} LIKE ?`);
          whereValues.push(`%${value}%`);
          break;
        case "startsWith":
        case "starts_with":
          whereConditions.push(`${field} LIKE ?`);
          whereValues.push(`${value}%`);
          break;
        case "endsWith":
        case "ends_with":
          whereConditions.push(`${field} LIKE ?`);
          whereValues.push(`%${value}`);
          break;
        default:
          whereConditions.push(`${field} = ?`);
          whereValues.push(sanitizeValue(value));
      }
    }

    return {
      whereClause:
        whereConditions.length > 0 ? whereConditions.join(" AND ") : "1=1",
      whereValues,
    };
  };

  return createAdapter({
    config: {
      adapterId: "turso-adapter",
      adapterName: "Turso Adapter",
      usePlural: config.usePlural ?? false,
      debugLogs: config.debugLogs ?? false,
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: true,
    },
    adapter: ({ debugLog, schema: _schema, options }) => {
      return {
        create: async ({ model, data }) => {
          if ((debugLog as any)?.create) {
            console.log(`[Turso Adapter] Creating in ${model}:`, data);
          }

          // Ensure table exists before creating
          await ensureTableExists(model, options);

          // Check if using numeric IDs
          const useNumericIds =
            (options as any)?.advanced?.database?.useNumberId === true;

          // Generate ID if not provided
          const finalData = { ...data } as any;
          if (!finalData.id && !useNumericIds) {
            // Only generate ID for non-numeric ID tables - let SQLite handle auto-increment for numeric IDs
            finalData.id =
              Math.random().toString(36).substring(2) + Date.now().toString(36);
          }

          // Dynamically add columns if they don't exist (filter out undefined/null values)
          const dataKeys = Object.keys(finalData).filter(
            (key) => finalData[key] !== undefined,
          );
          for (const key of dataKeys) {
            await ensureColumnExists(model, key);
          }

          // Filter out undefined values for SQL insertion
          const validEntries = Object.entries(finalData).filter(
            ([_, value]) => value !== undefined,
          );
          const keys = validEntries.map(([key]) => key);
          const values = validEntries.map(([_, value]) => sanitizeValue(value));
          const placeholders = keys.map(() => "?").join(", ");

          const sql =
            keys.length > 0
              ? `INSERT INTO ${model} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`
              : `INSERT INTO ${model} DEFAULT VALUES RETURNING *`;

          const result = await executeQuery(sql, values);

          if (!result.rows?.length) {
            throw new Error("Failed to create record");
          }

          // Deserialize the returned data
          const row = result.rows[0] as any;
          const deserializedRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            deserializedRow[key] = deserializeValue(value, key);
          }

          return deserializedRow;
        },

        update: async ({ model, where, update }) => {
          if ((debugLog as any)?.update) {
            console.log(`[Turso Adapter] Updating in ${model}:`, {
              where,
              update,
            });
          }

          // Ensure table exists before updating
          await ensureTableExists(model, options);

          // Ensure columns exist for update data
          const updateKeys = Object.keys(update);
          for (const key of updateKeys) {
            await ensureColumnExists(model, key);
          }

          const updateData = update as any;
          const updateValues = Object.values(updateData).map(sanitizeValue);

          // Process where clause
          const { whereClause, whereValues } = processWhereClause(where);
          const updateClause = updateKeys.map((key) => `${key} = ?`).join(", ");

          const sql = `UPDATE ${model} SET ${updateClause} WHERE ${whereClause} RETURNING *`;

          const result = await executeQuery(sql, [
            ...updateValues,
            ...whereValues,
          ]);

          if (!result.rows?.length) {
            return null; // Return null instead of throwing for non-existent records
          }

          // Deserialize the returned data
          const row = result.rows[0] as any;
          const deserializedRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            deserializedRow[key] = deserializeValue(value, key);
          }

          return deserializedRow;
        },

        updateMany: async ({ model, where, update }) => {
          if ((debugLog as any)?.updateMany) {
            console.log(`[Turso Adapter] Updating many in ${model}:`, {
              where,
              update,
            });
          }

          // Ensure table exists before updating
          await ensureTableExists(model, options);

          const updateKeys = Object.keys(update);
          const updateValues = Object.values(update).map(sanitizeValue);
          const { whereClause, whereValues } = processWhereClause(where);

          const updateClause = updateKeys.map((key) => `${key} = ?`).join(", ");
          const sql = `UPDATE ${model} SET ${updateClause} WHERE ${whereClause}`;

          const result = await executeQuery(sql, [
            ...updateValues,
            ...whereValues,
          ]);

          return Number(result.rowsAffected);
        },

        delete: async ({ model, where }) => {
          if ((debugLog as any)?.delete) {
            console.log(`[Turso Adapter] Deleting from ${model}:`, where);
          }

          // Ensure table exists before deleting
          await ensureTableExists(model, options);

          const { whereClause, whereValues } = processWhereClause(where);
          const sql = `DELETE FROM ${model} WHERE ${whereClause}`;

          await executeQuery(sql, whereValues);
        },

        deleteMany: async ({ model, where }) => {
          if ((debugLog as any)?.deleteMany) {
            console.log(`[Turso Adapter] Deleting many from ${model}:`, where);
          }

          // Ensure table exists before deleting
          await ensureTableExists(model, options);

          const { whereClause, whereValues } = processWhereClause(where);
          const sql = `DELETE FROM ${model} WHERE ${whereClause}`;

          const result = await executeQuery(sql, whereValues);

          return Number(result.rowsAffected);
        },

        findOne: async ({ model, where, select }) => {
          if ((debugLog as any)?.findOne) {
            console.log(`[Turso Adapter] Finding one in ${model}:`, {
              where,
              select,
            });
          }

          // Ensure table exists before finding
          await ensureTableExists(model, options);

          // Process where clause
          const { whereClause, whereValues } = processWhereClause(where);
          const selectClause =
            select && select.length > 0 ? select.join(", ") : "*";
          const sql = `SELECT ${selectClause} FROM ${model} WHERE ${whereClause} LIMIT 1`;

          const result = await executeQuery(sql, whereValues);

          if (!result.rows || result.rows.length === 0) {
            return null;
          }

          // Deserialize the returned data
          const row = result.rows[0] as any;
          const deserializedRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            deserializedRow[key] = deserializeValue(value, key);
          }

          return deserializedRow;
        },

        findMany: async ({ model, where, limit, sortBy, offset }) => {
          if ((debugLog as any)?.findMany) {
            console.log(`[Turso Adapter] Finding many in ${model}:`, {
              where,
              limit,
              sortBy,
              offset,
            });
          }

          // Ensure table exists before finding
          await ensureTableExists(model, options);

          let sql = `SELECT * FROM ${model}`;
          const args: any[] = [];

          if (where && Array.isArray(where) && where.length > 0) {
            const { whereClause, whereValues } = processWhereClause(where);
            if (whereClause !== "1=1") {
              sql += ` WHERE ${whereClause}`;
              args.push(...whereValues);
            }
          }

          if (sortBy) {
            if (
              typeof sortBy === "object" &&
              sortBy.field &&
              sortBy.direction
            ) {
              // Better Auth format: { field: "name", direction: "asc" }
              sql += ` ORDER BY ${sortBy.field} ${sortBy.direction === "desc" ? "DESC" : "ASC"}`;
            } else if (
              typeof sortBy === "object" &&
              Object.keys(sortBy).length > 0
            ) {
              // Object format: { name: "asc", email: "desc" }
              const orderClauses = Object.entries(sortBy).map(
                ([key, direction]) =>
                  `${key} ${direction === "desc" ? "DESC" : "ASC"}`,
              );
              sql += ` ORDER BY ${orderClauses.join(", ")}`;
            }
          }

          if (limit) {
            sql += " LIMIT ?";
            args.push(limit);
          }

          if (offset) {
            sql += " OFFSET ?";
            args.push(offset);
          }

          const result = await executeQuery(sql, args);

          // Deserialize all returned rows
          return (result.rows || []).map((row: any) => {
            const deserializedRow: any = {};
            for (const [key, value] of Object.entries(row)) {
              deserializedRow[key] = deserializeValue(value, key);
            }
            return deserializedRow;
          });
        },

        count: async ({ model, where }) => {
          if ((debugLog as any)?.count) {
            console.log(`[Turso Adapter] Counting in ${model}:`, where);
          }

          // Ensure table exists before counting
          await ensureTableExists(model, options);

          let sql = `SELECT COUNT(*) as count FROM ${model}`;
          const args: any[] = [];

          if (where && Array.isArray(where) && where.length > 0) {
            const { whereClause, whereValues } = processWhereClause(where);
            if (whereClause !== "1=1") {
              sql += ` WHERE ${whereClause}`;
              args.push(...whereValues);
            }
          }

          const result = await executeQuery(sql, args);

          if (!result.rows || result.rows.length === 0) {
            return 0;
          }

          const row = result.rows[0] as any;
          return Number(row.count);
        },

        options: config,

        createSchema: async ({ file, tables }) => {
          if ((debugLog as any)?.create) {
            console.log("[Turso Adapter] Creating schema:", { file, tables });
          }

          let schemaContent = "-- Better Auth Schema for Turso/libSQL\n\n";

          for (const [tableName, table] of Object.entries(tables)) {
            schemaContent += `-- Table: ${tableName}\n`;
            schemaContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

            const columns: string[] = [];

            for (const [fieldName, field] of Object.entries(table.fields)) {
              let columnDef = `  ${fieldName}`;

              // Map field types to SQLite types
              switch (field.type) {
                case "string":
                  columnDef += " TEXT";
                  break;
                case "number":
                  columnDef += " INTEGER";
                  break;
                case "boolean":
                  columnDef += " BOOLEAN";
                  break;
                case "date":
                  columnDef += " DATETIME";
                  break;
                default:
                  columnDef += " TEXT";
              }

              if (field.required) {
                columnDef += " NOT NULL";
              }

              if (field.unique) {
                columnDef += " UNIQUE";
              }

              if (field.defaultValue !== undefined) {
                if (typeof field.defaultValue === "string") {
                  columnDef += ` DEFAULT '${field.defaultValue}'`;
                } else {
                  columnDef += ` DEFAULT ${field.defaultValue}`;
                }
              }

              columns.push(columnDef);
            }

            schemaContent += columns.join(",\n");
            schemaContent += "\n);\n\n";
          }

          // Write schema to file if provided
          if (file) {
            const fs = await import("fs/promises");
            await fs.writeFile(file, schemaContent, "utf-8");
          }

          return {
            code: schemaContent,
            path: file || "schema.sql",
          };
        },
      };
    },
  });
};

// Export types for consumers
export type { Client as TursoClient, LibSQLConfig as TursoConfig };

// Default export
export default tursoAdapter;
