/**
 * Security utilities for preventing SQL injection and validating inputs
 */

// Valid table names for Better Auth (whitelist approach)
const VALID_TABLE_NAMES = new Set([
  'user', 'users',
  'session', 'sessions', 
  'account', 'accounts',
  'verification', 'verifications',
  'twoFactor', 'twoFactors',
  'passkey', 'passkeys',
  'invitation', 'invitations',
  'member', 'members',
  'organization', 'organizations',
  'role', 'roles',
  'permission', 'permissions'
]);

// Valid column patterns (alphanumeric + underscore, camelCase)
const VALID_COLUMN_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

// Maximum lengths to prevent buffer overflow attacks
const MAX_IDENTIFIER_LENGTH = 64;
const MAX_COLUMN_LENGTH = 64;

/**
 * Validates and sanitizes table names against a whitelist
 * @param tableName - Table name to validate
 * @returns Validated table name
 * @throws Error if table name is invalid
 */
export function validateTableName(tableName: string): string {
  if (!tableName || typeof tableName !== 'string') {
    throw new Error('Table name must be a non-empty string');
  }

  if (tableName.length > MAX_IDENTIFIER_LENGTH) {
    throw new Error(`Table name exceeds maximum length of ${MAX_IDENTIFIER_LENGTH} characters`);
  }

  // Remove any whitespace
  const sanitized = tableName.trim();
  
  if (!VALID_TABLE_NAMES.has(sanitized)) {
    throw new Error(`Invalid table name: ${sanitized}. Must be one of: ${Array.from(VALID_TABLE_NAMES).join(', ')}`);
  }

  return sanitized;
}

/**
 * Validates column names using pattern matching
 * @param columnName - Column name to validate
 * @returns Validated column name
 * @throws Error if column name is invalid
 */
export function validateColumnName(columnName: string): string {
  if (!columnName || typeof columnName !== 'string') {
    throw new Error('Column name must be a non-empty string');
  }

  if (columnName.length > MAX_COLUMN_LENGTH) {
    throw new Error(`Column name exceeds maximum length of ${MAX_COLUMN_LENGTH} characters`);
  }

  const sanitized = columnName.trim();

  if (!VALID_COLUMN_PATTERN.test(sanitized)) {
    throw new Error(`Invalid column name: ${sanitized}. Must contain only alphanumeric characters and underscores, starting with a letter`);
  }

  return sanitized;
}

/**
 * Validates sort field names using same rules as column names
 * @param sortField - Sort field name to validate
 * @returns Validated sort field name
 * @throws Error if sort field is invalid
 */
export function validateSortField(sortField: string): string {
  return validateColumnName(sortField); // Same validation rules
}

/**
 * Validates sort direction
 * @param direction - Sort direction
 * @returns Validated direction (ASC or DESC)
 * @throws Error if direction is invalid
 */
export function validateSortDirection(direction: string): 'ASC' | 'DESC' {
  if (!direction || typeof direction !== 'string') {
    return 'ASC'; // Default to ASC
  }

  const sanitized = direction.trim().toUpperCase();
  
  if (sanitized !== 'ASC' && sanitized !== 'DESC') {
    throw new Error(`Invalid sort direction: ${direction}. Must be ASC or DESC`);
  }

  return sanitized as 'ASC' | 'DESC';
}

/**
 * Sanitizes debug log data by redacting sensitive information
 * @param data - Data to sanitize for logging
 * @returns Sanitized data safe for logging
 */
export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = new Set([
    'password', 'token', 'secret', 'key', 'hash', 'salt',
    'email', 'phoneNumber', 'ssn', 'creditCard', 'personalId',
    'sessionToken', 'accessToken', 'refreshToken', 'apiKey',
    'clientSecret', 'privateKey', 'encryptionKey'
  ]);

  const sanitized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('token')) {
      // Redact sensitive data
      (sanitized as any)[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      // Recursively sanitize nested objects
      (sanitized as any)[key] = sanitizeLogData(value);
    } else {
      (sanitized as any)[key] = value;
    }
  }

  return sanitized;
}

/**
 * Creates a SQL identifier (table or column name) safely
 * This wraps identifiers in quotes to prevent injection
 * Note: Only use this for already-validated identifiers
 * @param identifier - Pre-validated identifier
 * @returns Quoted identifier safe for SQL
 */
export function quoteSqlIdentifier(identifier: string): string {
  // Double any existing quotes to escape them
  const escaped = identifier.replace(/"/g, '""');
  return `"${escaped}"`;
}