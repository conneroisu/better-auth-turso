import { expect, test, describe, afterAll } from "vitest";
import { runNumberIdAdapterTest } from "better-auth/adapters/test";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "./index.js";

describe("Turso Adapter Numeric ID Tests", async () => {
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

  await runNumberIdAdapterTest({
    getAdapter: async (betterAuthOptions = {}) => {
      return adapter(betterAuthOptions);
    },
  });
});
