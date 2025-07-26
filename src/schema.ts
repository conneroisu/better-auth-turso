import type { TursoAdapterConfig } from "./types.js";
import type { DatabaseManager } from "./database.js";
import { validateTableName, validateColumnName, quoteSqlIdentifier } from "./security.js";

export class SchemaManager {
  private db: DatabaseManager;
  private config: TursoAdapterConfig;
  private createdTables = new Set<string>();
  private columnCache = new Set<string>();
  private readonly maxTableCacheSize = 50; // Limit table cache size
  private readonly maxColumnCacheSize = 500; // Limit column cache size

  constructor(db: DatabaseManager, config: TursoAdapterConfig) {
    this.db = db;
    this.config = config;
  }

  /**
   * Evict oldest entries from table cache when it gets too large
   */
  private evictTableCache(): void {
    if (this.createdTables.size >= this.maxTableCacheSize) {
      // Remove oldest entry (first in Set)
      const firstTable = this.createdTables.values().next().value;
      if (firstTable) {
        this.createdTables.delete(firstTable);
        // Also remove related column cache entries
        for (const columnKey of this.columnCache) {
          if (columnKey.startsWith(`${firstTable}.`)) {
            this.columnCache.delete(columnKey);
          }
        }
      }
    }
  }

  /**
   * Evict oldest entries from column cache when it gets too large
   */
  private evictColumnCache(): void {
    if (this.columnCache.size >= this.maxColumnCacheSize) {
      // Remove oldest entry (first in Set)
      const firstColumn = this.columnCache.values().next().value;
      if (firstColumn) {
        this.columnCache.delete(firstColumn);
      }
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { tables: number; columns: number; maxTables: number; maxColumns: number } {
    return {
      tables: this.createdTables.size,
      columns: this.columnCache.size,
      maxTables: this.maxTableCacheSize,
      maxColumns: this.maxColumnCacheSize,
    };
  }

  async ensureTableExists(model: string): Promise<void> {
    // Validate table name to prevent SQL injection
    const validatedModel = validateTableName(model);
    
    if (this.createdTables.has(validatedModel)) {
      return;
    }

    try {
      // Check if table exists
      const result = await this.db.executeQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [validatedModel],
      );

      if (result.rows.length === 0) {
        // Create table with basic structure (using quoted identifier)
        const quotedModel = quoteSqlIdentifier(validatedModel);
        const createTableSQL = `CREATE TABLE IF NOT EXISTS ${quotedModel} (
          id TEXT,
          name TEXT,
          email TEXT,
          emailVerified INTEGER DEFAULT 0,
          image TEXT,
          createdAt TEXT,
          updatedAt TEXT
        )`;

        await this.db.executeQuery(createTableSQL, []);

        // Mark the created columns as existing in cache
        const baseColumns = ['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt'];
        for (const column of baseColumns) {
          this.columnCache.add(`${model}.${column}`);
        }

        if (this.config.debugLogs) {
          console.log(`[Turso Adapter] Created table ${validatedModel}`);
        }
      } else {
        // Table exists, populate column cache for existing columns
        const tableInfo = await this.db.executeQuery(
          `PRAGMA table_info(${quoteSqlIdentifier(validatedModel)})`,
          [],
        );
        
        for (const row of tableInfo.rows || []) {
          const columnName = row.name || row[1]; // row[1] is name in PRAGMA result
          if (columnName) {
            this.columnCache.add(`${validatedModel}.${columnName}`);
          }
        }
      }

      // Add to cache with eviction if needed
      this.evictTableCache();
      this.createdTables.add(validatedModel);
    } catch (error) {
      console.error(
        `[Turso Adapter] Failed to ensure table ${model} exists:`,
        error,
      );
      throw error;
    }
  }

  async ensureColumnExists(model: string, column: string): Promise<void> {
    // Validate inputs to prevent SQL injection
    const validatedModel = validateTableName(model);
    const validatedColumn = validateColumnName(column);
    const cacheKey = `${validatedModel}.${validatedColumn}`;

    // If we've already verified this column exists, skip the check
    if (this.columnCache.has(cacheKey)) {
      return;
    }

    try {
      // Use PRAGMA table_info which works reliably with Turso
      const result = await this.db.executeQuery(
        `PRAGMA table_info(${quoteSqlIdentifier(validatedModel)})`,
        [],
      );

      // Check if column already exists in the table schema
      const columnExists = result.rows?.some(
        (row: any) => row.name === validatedColumn || row[1] === validatedColumn, // row[1] is name in PRAGMA result
      );

      if (columnExists) {
        // Column exists, mark as verified
        this.evictColumnCache();
        this.columnCache.add(cacheKey);
        if (this.config.debugLogs) {
          console.log(
            `[Turso Adapter] Column ${validatedColumn} already exists in table ${validatedModel}`,
          );
        }
        return;
      }

      // Column doesn't exist, add it (with SQL injection prevention)
      if (this.config.debugLogs) {
        console.log(
          `[Turso Adapter] Column ${validatedColumn} does not exist in table ${validatedModel}, adding it`,
        );
      }

      const quotedModel = quoteSqlIdentifier(validatedModel);
      const quotedColumn = quoteSqlIdentifier(validatedColumn);
      await this.db.executeQuery(
        `ALTER TABLE ${quotedModel} ADD COLUMN ${quotedColumn} TEXT`,
        [],
      );

      // Mark this column as verified/created with eviction if needed
      this.evictColumnCache();
      this.columnCache.add(cacheKey);

      if (this.config.debugLogs) {
        console.log(
          `[Turso Adapter] Successfully added column ${validatedColumn} to table ${validatedModel}`,
        );
      }
    } catch (error) {
      // For any errors during column creation, still mark as checked to avoid infinite retries but log the warning
      this.evictColumnCache();
      this.columnCache.add(cacheKey);
      console.warn(
        `[Turso Adapter] Could not ensure column ${validatedColumn} exists in table ${validatedModel}:`,
        error,
      );
    }
  }

  generateSchema(
    tables: any,
    options: any = {},
  ): { code: string; path: string } {
    const useNumericIds =
      (options as any)?.advanced?.database?.useNumberId === true;
    const idColumn = useNumericIds
      ? "INTEGER PRIMARY KEY AUTOINCREMENT"
      : "TEXT PRIMARY KEY";

    let schemaSQL = `-- Better Auth Schema for Turso/libSQL\n`;
    schemaSQL += `-- Generated on: ${new Date().toISOString()}\n\n`;

    // Generate schema for each table
    for (const [tableName, tableConfig] of Object.entries(tables) as [
      string,
      any,
    ][]) {
      const fields = tableConfig.fields || {};

      schemaSQL += `-- Table: ${tableName}\n`;
      schemaSQL += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      schemaSQL += `  id ${idColumn},\n`;

      // Add internalId for compatibility
      if (useNumericIds) {
        schemaSQL += `  internalId INTEGER,\n`;
      }

      // Process each field
      for (const [fieldName, fieldConfig] of Object.entries(fields) as [
        string,
        any,
      ][]) {
        if (fieldName === "id") continue; // Skip ID field as it's already added

        let sqlType = "TEXT";
        let constraints = "";

        // Map field types to SQL types
        switch (fieldConfig.type) {
          case "number":
          case "int":
          case "integer":
            sqlType = "INTEGER";
            break;
          case "boolean":
          case "bool":
            sqlType = "BOOLEAN";
            break;
          case "date":
          case "datetime":
          case "timestamp":
            sqlType = "DATETIME";
            break;
          case "json":
          case "object":
            sqlType = "TEXT"; // Store as JSON string
            break;
          default:
            sqlType = "TEXT";
        }

        // Add constraints
        if (fieldConfig.required) {
          constraints += " NOT NULL";
        }
        if (fieldConfig.unique) {
          constraints += " UNIQUE";
        }
        if (fieldConfig.defaultValue !== undefined) {
          if (typeof fieldConfig.defaultValue === "string") {
            constraints += ` DEFAULT '${fieldConfig.defaultValue}'`;
          } else {
            constraints += ` DEFAULT ${fieldConfig.defaultValue}`;
          }
        }

        schemaSQL += `  ${fieldName} ${sqlType}${constraints},\n`;
      }

      // Add foreign key constraints if this is a related table
      if (tableName === "session") {
        schemaSQL += `  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE\n`;
      } else if (tableName === "account") {
        schemaSQL += `  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE\n`;
      } else {
        // Remove trailing comma
        schemaSQL = schemaSQL.slice(0, -2) + "\n";
      }

      schemaSQL += `);\n\n`;
    }

    return {
      code: schemaSQL,
      path: "schema.sql",
    };
  }
}
