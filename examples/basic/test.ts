import { betterAuth } from "better-auth";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "../../src/index.js";

console.log("🧪 Testing Better Auth Turso Example...");

async function testExample() {
  try {
    // Create client
    const client = createClient({
      url: ":memory:",
    });

    // Create auth instance
    const auth = betterAuth({
      database: tursoAdapter({
        client,
        debugLogs: false, // Disable debug logs for testing
      }),
      emailAndPassword: {
        enabled: true,
      },
    });

    console.log("✅ Auth instance created");

    // Create a test adapter instance directly to test functionality
    const testAdapter = tursoAdapter({
      client,
      debugLogs: false,
    });
    
    const db = testAdapter({});
    
    // Create a user directly through the adapter
    const user = await db.create({
      model: "user",
      data: {
        email: "test@example.com",
        name: "Test User",
        emailVerified: false,
      },
    });

    if (!user || !user.id) {
      throw new Error("Failed to create user");
    }

    console.log("✅ User creation test passed");

    // Test user retrieval
    const foundUser = await db.findOne({
      model: "user",
      where: [{ field: "email", value: "test@example.com" }],
    });

    if (!foundUser || foundUser.email !== "test@example.com") {
      throw new Error("Failed to retrieve user");
    }

    console.log("✅ User retrieval test passed");

    // Test database tables exist
    const tables = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table'",
      args: [],
    });

    const tableNames = tables.rows?.map((row: any) => row.name) || [];
    const requiredTables = ["user"];
    
    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        throw new Error(`Required table '${table}' not found`);
      }
    }

    console.log("✅ Database schema test passed");

    console.log("\n🎉 All example tests passed!");
    return true;
    
  } catch (error) {
    console.error("❌ Example test failed:", error);
    return false;
  }
}

// Run tests and exit with appropriate code
testExample().then(success => {
  process.exit(success ? 0 : 1);
});