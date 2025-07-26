// Test setup file for Vitest
// This file is executed before running tests

// Set up global test environment
globalThis.__testClient = undefined;
globalThis.__numericTestClient = undefined;

// Mock console methods if needed for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Helper to restore console in case of cleanup
export function restoreConsole() {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
}

// Add any global test utilities here
export function createClient(config: any) {
  // Dynamic import to avoid circular dependencies
  return import("better-sqlite3").then(({ default: Database }) => {
    return new Database(config.url || ":memory:");
  });
}