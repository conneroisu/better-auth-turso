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

  // Helper function to ensure table exists with Better Auth standard columns
  const ensureTableExists = async (model: string): Promise<void> => {
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

      if (model === "user") {
        createSQL = `CREATE TABLE IF NOT EXISTS ${model} (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE,
          emailVerified BOOLEAN DEFAULT FALSE,
          image TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
      } else if (model === "session") {
        createSQL = `CREATE TABLE IF NOT EXISTS ${model} (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          expiresAt DATETIME NOT NULL,
          token TEXT UNIQUE NOT NULL,
          ipAddress TEXT,
          userAgent TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
      } else if (model === "account") {
        createSQL = `CREATE TABLE IF NOT EXISTS ${model} (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
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
          id TEXT PRIMARY KEY,
          identifier TEXT NOT NULL,
          value TEXT NOT NULL,
          expiresAt DATETIME NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
      } else {
        // Generic table for unknown models
        createSQL = `CREATE TABLE IF NOT EXISTS ${model} (
          id TEXT PRIMARY KEY,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
    adapter: ({ debugLog, schema: _schema }) => {
      return {
        create: async ({ model, data }) => {
          if (
            debugLog &&
            typeof debugLog === "object" &&
            "create" in debugLog
          ) {
            console.log(`[Turso Adapter] Creating in ${model}:`, data);
          }

          // Ensure table exists before creating
          await ensureTableExists(model);

          // Dynamically add columns if they don't exist
          const dataKeys = Object.keys(data);
          for (const key of dataKeys) {
            await ensureColumnExists(model, key);
          }

          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map(() => "?").join(", ");

          const sql =
            keys.length > 0
              ? `INSERT INTO ${model} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`
              : `INSERT INTO ${model} DEFAULT VALUES RETURNING *`;

          const result = await client.execute({
            sql,
            args: values,
          });

          if (!result.rows?.length) {
            throw new Error("Failed to create record");
          }

          return result.rows[0] as any;
        },

        update: async ({ model, where, update }) => {
          if (
            debugLog &&
            typeof debugLog === "object" &&
            "update" in debugLog
          ) {
            console.log(`[Turso Adapter] Updating in ${model}:`, {
              where,
              update,
            });
          }

          // Ensure table exists before updating
          await ensureTableExists(model);

          // Ensure columns exist for update data
          const updateKeys = Object.keys(update);
          for (const key of updateKeys) {
            await ensureColumnExists(model, key);
          }

          const updateData = update as any;
          const whereData = where as any;
          const updateValues = Object.values(updateData);
          const whereKeys = Object.keys(whereData);
          const whereValues = Object.values(whereData);

          const updateClause = updateKeys.map((key) => `${key} = ?`).join(", ");
          const whereClause = whereKeys
            .map((key) => `${key} = ?`)
            .join(" AND ");

          const sql = `UPDATE ${model} SET ${updateClause} WHERE ${whereClause} RETURNING *`;

          const result = await client.execute({
            sql,
            args: [...updateValues, ...whereValues],
          });

          if (!result.rows?.length) {
            throw new Error("Failed to update record or record not found");
          }

          return result.rows[0] as Record<string, unknown>;
        },

        updateMany: async ({ model, where, update }) => {
          if ((debugLog as any)?.updateMany) {
            console.log(`[Turso Adapter] Updating many in ${model}:`, {
              where,
              update,
            });
          }

          // Ensure table exists before updating
          await ensureTableExists(model);

          const updateKeys = Object.keys(update);
          const updateValues = Object.values(update);
          const whereKeys = Object.keys(where as Record<string, any>);
          const whereValues = Object.values(where as Record<string, any>);

          const updateClause = updateKeys.map((key) => `${key} = ?`).join(", ");
          const whereClause = whereKeys
            .map((key) => `${key} = ?`)
            .join(" AND ");

          const sql = `UPDATE ${model} SET ${updateClause} WHERE ${whereClause}`;

          const result = await client.execute({
            sql,
            args: [...updateValues, ...whereValues] as any[],
          });

          return Number(result.rowsAffected);
        },

        delete: async ({ model, where }) => {
          if ((debugLog as any)?.delete) {
            console.log(`[Turso Adapter] Deleting from ${model}:`, where);
          }

          // Ensure table exists before deleting
          await ensureTableExists(model);

          const whereKeys = Object.keys(where as Record<string, any>);
          const whereValues = Object.values(where as Record<string, any>);
          const whereClause = whereKeys
            .map((key) => `${key} = ?`)
            .join(" AND ");

          const sql = `DELETE FROM ${model} WHERE ${whereClause}`;

          await client.execute({
            sql,
            args: whereValues,
          });
        },

        deleteMany: async ({ model, where }) => {
          if ((debugLog as any)?.deleteMany) {
            console.log(`[Turso Adapter] Deleting many from ${model}:`, where);
          }

          // Ensure table exists before deleting
          await ensureTableExists(model);

          const whereKeys = Object.keys(where as Record<string, any>);
          const whereValues = Object.values(where as Record<string, any>);
          const whereClause = whereKeys
            .map((key) => `${key} = ?`)
            .join(" AND ");

          const sql = `DELETE FROM ${model} WHERE ${whereClause}`;

          const result = await client.execute({
            sql,
            args: whereValues,
          });

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
          await ensureTableExists(model);

          const whereKeys = Object.keys(where as Record<string, any>);
          const whereValues = Object.values(where as Record<string, any>);
          const whereClause = whereKeys
            .map((key) => `${key} = ?`)
            .join(" AND ");

          const selectClause =
            select && select.length > 0 ? select.join(", ") : "*";
          const sql = `SELECT ${selectClause} FROM ${model} WHERE ${whereClause} LIMIT 1`;

          const result = await client.execute({
            sql,
            args: whereValues,
          });

          if (!result.rows || result.rows.length === 0) {
            return null;
          }

          return result.rows[0] as any;
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
          await ensureTableExists(model);

          let sql = `SELECT * FROM ${model}`;
          const args: any[] = [];

          if (where && Object.keys(where).length > 0) {
            const whereKeys = Object.keys(where);
            const whereValues = Object.values(where);
            const whereClause = whereKeys
              .map((key) => `${key} = ?`)
              .join(" AND ");
            sql += ` WHERE ${whereClause}`;
            args.push(...whereValues);
          }

          if (sortBy && Object.keys(sortBy).length > 0) {
            const orderClauses = Object.entries(sortBy).map(
              ([key, direction]) =>
                `${key} ${direction === "desc" ? "DESC" : "ASC"}`,
            );
            sql += ` ORDER BY ${orderClauses.join(", ")}`;
          }

          if (limit) {
            sql += " LIMIT ?";
            args.push(limit);
          }

          if (offset) {
            sql += " OFFSET ?";
            args.push(offset);
          }

          const result = await client.execute({
            sql,
            args,
          });

          return (result.rows || []) as any[];
        },

        count: async ({ model, where }) => {
          if ((debugLog as any)?.count) {
            console.log(`[Turso Adapter] Counting in ${model}:`, where);
          }

          // Ensure table exists before counting
          await ensureTableExists(model);

          let sql = `SELECT COUNT(*) as count FROM ${model}`;
          const args: any[] = [];

          if (where && Object.keys(where).length > 0) {
            const whereKeys = Object.keys(where);
            const whereValues = Object.values(where);
            const whereClause = whereKeys
              .map((key) => `${key} = ?`)
              .join(" AND ");
            sql += ` WHERE ${whereClause}`;
            args.push(...whereValues);
          }

          const result = await client.execute({
            sql,
            args,
          });

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
