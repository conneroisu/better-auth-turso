import type {
  TursoDatabase,
  QueryResult,
  TursoAdapterConfig,
} from "./types.js";

export class DatabaseManager {
  private database: TursoDatabase;
  private config: TursoAdapterConfig;
  private statementCache = new Map<string, any>();
  private readonly maxCacheSize = 100; // Limit cache size to prevent memory leaks

  constructor(database: TursoDatabase, config: TursoAdapterConfig) {
    this.database = database;
    this.config = config;
  }

  /**
   * Clear the prepared statement cache
   * Useful for testing or memory management
   */
  clearStatementCache(): void {
    this.statementCache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.statementCache.size,
      maxSize: this.maxCacheSize,
    };
  }

  async executeQuery(sql: string, args: any[] = []): Promise<QueryResult> {
    const enableDebugLogs =
      this.config.debugLogs === true ||
      (typeof this.config.debugLogs === "object" &&
        this.config.debugLogs &&
        "execute" in this.config.debugLogs &&
        (this.config.debugLogs as any).execute);

    if (enableDebugLogs) {
      console.log(`[Turso Adapter] Executing SQL: ${sql}`);
      console.log(`[Turso Adapter] Args:`, args);
    }

    // Input validation
    if (!sql || typeof sql !== "string") {
      throw new Error("Invalid SQL query: must be a non-empty string");
    }

    if (!Array.isArray(args)) {
      throw new Error("Invalid arguments: must be an array");
    }

    let result: any;

    try {
      // Validate database connection
      if (!this.database) {
        throw new Error("Turso database is not properly initialized");
      }

      // Execute with Turso Database
      let executeResult: any;

      // Determine if this is a SELECT query or modifying query
      const isSelectQuery = /^SELECT\s/i.test(sql.trim());

      // Get or create cached prepared statement
      let stmt = this.statementCache.get(sql);
      if (!stmt) {
        if (enableDebugLogs) {
          console.log(`[Database Manager] Statement cache MISS for: ${sql.substring(0, 50)}...`);
        }
        stmt = this.database.prepare(sql);
        
        // Implement LRU cache eviction when cache is full
        if (this.statementCache.size >= this.maxCacheSize) {
          // Remove the first (oldest) entry
          const firstKey = this.statementCache.keys().next().value;
          if (firstKey) {
            this.statementCache.delete(firstKey);
            if (enableDebugLogs) {
              console.log(`[Database Manager] Evicted statement from cache: ${firstKey.substring(0, 50)}...`);
            }
          }
        }
        
        this.statementCache.set(sql, stmt);
      } else if (enableDebugLogs) {
        console.log(`[Database Manager] Statement cache HIT for: ${sql.substring(0, 50)}...`);
      }

      if (isSelectQuery) {
        // Use prepare().all() for SELECT queries
        const rows = stmt.all(...args);
        executeResult = {
          rows: rows || [],
          rowsAffected: 0,
          lastInsertRowid: undefined,
        };
      } else {
        // Use prepare().run() for INSERT/UPDATE/DELETE queries
        const info = stmt.run(...args);
        
        if (this.config.debugLogs) {
          console.log(`[Database Manager] Statement info:`, info);
        }
        
        executeResult = {
          rows: [],
          rowsAffected: info.changes || 0,
          lastInsertRowid: info.lastInsertRowid,
        };
      }

      // Convert to standardized format
      result = {
        rows: Array.isArray(executeResult.rows) ? executeResult.rows : [],
        rowsAffected: executeResult.rowsAffected
          ? Number(executeResult.rowsAffected)
          : 0,
        lastInsertRowid: executeResult.lastInsertRowid
          ? Number(executeResult.lastInsertRowid)
          : undefined,
      };

      if (enableDebugLogs) {
        console.log(
          `[Turso Adapter] Query executed successfully. Rows affected: ${result.rowsAffected}, Rows returned: ${result.rows.length}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (enableDebugLogs) {
        console.error(`[Turso Adapter] Query failed: ${errorMessage}`);
        console.error(`[Turso Adapter] Failed SQL: ${sql}`);
        console.error(`[Turso Adapter] Failed args:`, args);
      }

      throw error;
    }

    return result;
  }

  async batchExecute(
    operations: Array<{ sql: string; args?: any[] }>,
  ): Promise<any[]> {
    if (operations.length === 1) {
      // Fall back to single execution for single operations
      const op = operations[0];
      if (!op) {
        throw new Error("Invalid batch operation: empty operation at index 0");
      }
      const result = await this.executeQuery(op.sql, op.args || []);
      return [result];
    }

    if (this.config.debugLogs) {
      console.log(
        `[Turso Adapter] Executing batch of ${operations.length} operations`,
      );
    }

    try {
      // Use Turso Database transaction for batch operations
      const results: any[] = [];

      const transaction = this.database.transaction(
        (ops: Array<{ sql: string; args: any[] }>) => {
          for (const [index, op] of ops.entries()) {
            try {
              const isSelectQuery = /^SELECT\s/i.test(op.sql.trim());

              if (isSelectQuery) {
                const stmt = this.database.prepare(op.sql);
                const rows = stmt.all(...(op.args || []));
                results.push({
                  rows: rows || [],
                  rowsAffected: 0,
                  lastInsertRowid: undefined,
                  _meta: {
                    batchIndex: index,
                    executionTime: 0,
                    cached: false,
                  },
                });
              } else {
                const stmt = this.database.prepare(op.sql);
                const info = stmt.run(...(op.args || []));
                results.push({
                  rows: [],
                  rowsAffected: info.changes || 0,
                  lastInsertRowid: info.lastInsertRowid,
                  _meta: {
                    batchIndex: index,
                    executionTime: 0,
                    cached: false,
                  },
                });
              }
            } catch (error) {
              results.push({ error });
            }
          }
        },
      );

      // Execute the transaction (normalize operations to ensure args is always an array)
      const normalizedOps = operations.map((op) => ({
        ...op,
        args: op.args || [],
      }));
      transaction(normalizedOps);

      if (this.config.debugLogs) {
        console.log(`[Turso Adapter] Batch executed successfully`);
      }

      return results;
    } catch (error) {
      console.error(`[Turso Adapter] Batch execution failed:`, error);
      throw error;
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Simple health check query using Turso Database
      const stmt = this.database.prepare("SELECT 1");
      stmt.get();
      return { healthy: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        healthy: false,
        error: errorMessage,
      };
    }
  }
}
