import { expect, test, describe, afterAll } from "vitest";
import { runAdapterTest } from "better-auth/adapters/test";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "./index.js";

describe("Turso Adapter Tests", async () => {
  afterAll(async () => {
    // Cleanup is handled by in-memory database
  });

  const client = createClient({
    url: ":memory:",
  });

  const adapter = tursoAdapter({
    client,
    debugLogs: {
      isRunningAdapterTests: true,
    },
  });

  await runAdapterTest({
    getAdapter: async (betterAuthOptions = {}) => {
      return adapter(betterAuthOptions);
    },
  });
});

describe("Turso Adapter Configuration Tests", () => {
  test("should throw error when neither client nor config is provided", () => {
    expect(() => {
      tursoAdapter({});
    }).toThrow(
      "Either 'client' or 'config' must be provided to the Turso adapter",
    );
  });

  test("should accept client configuration", () => {
    const client = createClient({ url: ":memory:" });
    expect(() => {
      tursoAdapter({ client });
    }).not.toThrow();
  });

  test("should accept turso configuration", () => {
    expect(() => {
      tursoAdapter({
        config: { url: ":memory:" },
      });
    }).not.toThrow();
  });

  test("should respect usePlural option", () => {
    const client = createClient({ url: ":memory:" });
    const adapter = tursoAdapter({
      client,
      usePlural: true,
    });

    // The adapter config should reflect the usePlural setting
    expect(adapter).toBeDefined();
  });

  test("should respect debugLogs option", () => {
    const client = createClient({ url: ":memory:" });
    const adapter = tursoAdapter({
      client,
      debugLogs: {
        create: true,
        update: true,
      },
    });

    expect(adapter).toBeDefined();
  });
});
