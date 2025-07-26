import type { ProcessedWhereClause } from "./types.js";

// Field name mappings for SQLite compatibility
const fieldNameMap = new Map([
  ["emailverified", "emailVerified"],
  ["createdat", "createdAt"],
  ["updatedat", "updatedAt"],
  ["userid", "userId"],
  ["accountid", "accountId"],
  ["providerid", "providerId"],
  ["accesstoken", "accessToken"],
  ["refreshtoken", "refreshToken"],
  ["idtoken", "idToken"],
  ["expiresat", "expiresAt"],
  ["lastinsertrowid", "lastInsertRowid"],
]);

// Caches for performance
const fieldNameCache = new Map<string, string>();
const deserializationCache = new Map<string, any>();

// Pre-compiled regular expressions for better performance
const compiledPatterns = {
  date: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  isoDate: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  json: /^[[{].*[\]}]$/,
};

// Known boolean fields for type conversion
const booleanFields = new Set([
  "emailVerified",
  "emailverified", // lowercased version from database
  "verified",
  "active",
  "enabled",
  "isActive",
  "isEnabled",
  "isVerified",
]);

export class DataUtils {
  // Optimized field name normalization with caching
  static normalizeFieldName(key: string): string {
    const cached = fieldNameCache.get(key);
    if (cached !== undefined) return cached;

    const lowerKey = key.toLowerCase();
    const normalized = fieldNameMap.get(lowerKey) || key;

    // Cache the result for future use
    if (fieldNameCache.size < 1000) {
      fieldNameCache.set(key, normalized);
    }

    return normalized;
  }

  // Optimized value sanitization
  static sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle dates
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle booleans - convert to integer for SQLite
    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }

    // Handle objects and arrays - stringify to JSON
    if (typeof value === "object" && value !== null) {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return value;
  }

  // Optimized deserialization with pattern caching
  static deserializeValue(value: any, fieldName?: string): any {
    // Fast path for null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Fast path for primitives that don't need transformation
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

    // Handle non-string values
    if (typeof value !== "string") {
      return value;
    }

    // Check cache for expensive string operations
    const cacheKey = `${typeof value}:${value.length}:${value.slice(0, 20)}`;
    const cached = deserializationCache.get(cacheKey);
    if (cached !== undefined) return cached;

    let result = value;

    // Optimized date parsing using pre-compiled regex
    if (compiledPatterns.isoDate.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        result = date as any;
      }
    }
    // JSON parsing for objects and arrays
    else if (value.length > 1 && compiledPatterns.json.test(value)) {
      try {
        result = JSON.parse(value);
      } catch {
        // Keep original value if JSON parsing fails
        result = value;
      }
    }

    // Cache the result for performance (limit cache size)
    if (deserializationCache.size < 10000) {
      deserializationCache.set(cacheKey, result);
    } else if (deserializationCache.size > 15000) {
      // Clear some cache entries when it gets too large
      const entries = Array.from(deserializationCache.entries());
      entries
        .splice(0, 5000)
        .forEach(([key]) => deserializationCache.delete(key));
      deserializationCache.set(cacheKey, result);
    }

    return result;
  }

  // Deserialize a complete row object
  static deserializeRow(row: any): any {
    if (!row || typeof row !== "object") {
      return row;
    }

    const deserializedRow: any = {};

    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = this.normalizeFieldName(key);
      deserializedRow[normalizedKey] = this.deserializeValue(
        value,
        normalizedKey,
      );
    }

    return deserializedRow;
  }

  // Process WHERE conditions into SQL
  static processWhereConditions(where: any[]): ProcessedWhereClause {
    if (!Array.isArray(where) || where.length === 0) {
      return { whereClause: "", whereValues: [] };
    }

    const conditions: string[] = [];
    const values: any[] = [];

    for (const condition of where) {
      const {
        field,
        operator = "eq",
        value,
        connector: _connector = "AND",
      } = condition;

      if (!field) continue;

      let sqlOperator: string;
      let paramValue = this.sanitizeValue(value);

      switch (operator) {
        case "eq":
          sqlOperator = "=";
          break;
        case "ne":
          sqlOperator = "!=";
          break;
        case "gt":
          sqlOperator = ">";
          break;
        case "gte":
          sqlOperator = ">=";
          break;
        case "lt":
          sqlOperator = "<";
          break;
        case "lte":
          sqlOperator = "<=";
          break;
        case "in":
          sqlOperator = "IN";
          if (Array.isArray(value)) {
            const placeholders = value.map(() => "?").join(", ");
            conditions.push(`${field} ${sqlOperator} (${placeholders})`);
            values.push(...value.map((v) => this.sanitizeValue(v)));
            continue;
          }
          break;
        case "contains":
          sqlOperator = "LIKE";
          paramValue = `%${value}%`;
          break;
        case "startsWith":
          sqlOperator = "LIKE";
          paramValue = `${value}%`;
          break;
        case "endsWith":
          sqlOperator = "LIKE";
          paramValue = `%${value}`;
          break;
        default:
          sqlOperator = "=";
      }

      if (operator !== "in") {
        conditions.push(`${field} ${sqlOperator} ?`);
        values.push(paramValue);
      }
    }

    const whereClause = conditions.length > 0 ? conditions.join(" AND ") : "";

    return {
      whereClause,
      whereValues: values,
    };
  }

  // Extract table name from SQL for cache invalidation
  static extractTableName(sql: string): string {
    const match = sql.match(
      /(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|FROM)\s+(\w+)/i,
    );
    return match?.[1] ?? "";
  }

  // Calculate rough data size for caching
  static calculateDataSize(data: any): number {
    if (!data) return 0;

    try {
      return JSON.stringify(data).length;
    } catch {
      return String(data).length;
    }
  }

  // Sleep utility for retry logic
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
