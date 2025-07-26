import { beforeAll, afterAll, afterEach } from "vitest";

// Global test setup
beforeAll(() => {
  // Set up any global test configuration
  process.env.NODE_ENV = "test";
});

afterAll(() => {
  // Clean up after all tests
});

afterEach(() => {
  // Clean up after each test
});
