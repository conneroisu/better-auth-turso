import { expect, test, describe } from "bun:test";

// Simple integration test to verify the setup works
describe("Basic Setup Tests", () => {
  test("can import Better Auth", async () => {
    const betterAuth = await import("better-auth");
    expect(betterAuth).toBeDefined();
  });

  test("can import Turso adapter", async () => {
    const { tursoAdapter } = await import("better-auth-turso");
    expect(tursoAdapter).toBeTypeOf("function");
  });

  test("can import libSQL client", async () => {
    const { createClient } = await import("@libsql/client");
    expect(createClient).toBeTypeOf("function");
  });

  test("tursoAdapter creates adapter configuration", async () => {
    const { tursoAdapter } = await import("better-auth-turso");
    const { createClient } = await import("@libsql/client");
    
    const client = createClient({ url: ":memory:" });
    const adapter = tursoAdapter({ client });
    
    expect(adapter.config.adapterId).toBe("turso-adapter");
    expect(adapter.config.adapterName).toBe("Turso Adapter");
    expect(adapter.config.supportsJSON).toBe(true);
    expect(adapter.config.supportsDates).toBe(true);
    expect(adapter.config.supportsBooleans).toBe(true);
    expect(adapter.config.supportsNumericIds).toBe(true);
  });

  test("adapter throws error without client or config", async () => {
    const { tursoAdapter } = await import("better-auth-turso");
    
    expect(() => tursoAdapter({})).toThrow(
      "Either 'client' or 'config' must be provided to the Turso adapter"
    );
  });
});