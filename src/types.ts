import type { AdapterDebugLogs } from "better-auth/adapters";

/**
 * Type definitions for Turso Database instance from @tursodatabase/turso
 * This matches the API provided by the Turso SQLite driver
 */
export interface TursoDatabase {
  /** Prepare a SQL statement for execution */
  prepare(sql: string): {
    /** Execute query and return all rows */
    all(...params: any[]): any[];
    /** Execute query and return first row */
    get(...params: any[]): any;
    /** Execute query and return execution info */
    run(...params: any[]): { changes: number; lastInsertRowid: number };
  };
  /** Create a transaction that executes multiple operations atomically */
  transaction<T extends any[], R>(fn: (...args: T) => R): (...args: T) => R;
  /** Execute a PRAGMA statement */
  pragma(statement: string): any[];
  /** Close the database connection */
  close(): void;
}

// Type definitions for internal use
export interface QueryResult {
  rows: any[];
  rowsAffected: number;
  lastInsertRowid?: number;
  _meta?: {
    cached?: boolean;
    executionTime?: number;
    tableName?: string;
    batchIndex?: number;
  };
}

export interface ProcessedWhereClause {
  whereClause: string;
  whereValues: any[];
}

export interface TursoAdapterConfig {
  /**
   * Turso database instance or path to database file
   */
  database?: TursoDatabase | string;

  /**
   * Helps you debug issues with the adapter
   */
  debugLogs?: AdapterDebugLogs;

  /**
   * If the table names in the schema are plural
   */
  usePlural?: boolean;

  /**
   * Performance optimization settings
   */
  performance?: {
    enableQueryCache?: boolean;
    enablePreparedStatements?: boolean;
    enableBatchOptimization?: boolean;
    cacheTtl?: number;
    maxCacheSize?: number;
    maxPreparedStatements?: number;
    batchSize?: number;
  };

  /**
   * Connection pool settings
   */
  connectionPool?: {
    maxConnections?: number;
    connectionTimeout?: number;
    queryTimeout?: number;
  };

  /**
   * Error handling and retry settings
   */
  errorHandling?: {
    maxRetries?: number;
    retryDelay?: number;
    exponentialBackoff?: boolean;
  };
}

// Performance monitoring types
export interface PerformanceMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  batchOperations: number;
  totalQueryTime: number;
}

export interface QueryCacheEntry {
  data: any;
  timestamp: number;
  size: number;
  accessCount: number;
}

export interface PreparedStatementInfo {
  sql: string;
  usageCount: number;
  lastUsed: number;
}
