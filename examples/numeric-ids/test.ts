import { betterAuth } from "better-auth";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "../../src/index.js";

console.log("🧪 Testing Numeric IDs Example...");

async function testNumericIdExample() {
  try {
    const client = createClient({
      url: ":memory:",
    });

    const auth = betterAuth({
      database: tursoAdapter({
        client,
        debugLogs: false,
      }),
      emailAndPassword: {
        enabled: true,
      },
      advanced: {
        database: {
          useNumberId: true,
        },
      },
    });

    console.log("✅ Auth instance with numeric IDs created");

    // Test sequential ID creation using the database adapter directly
    const testAdapter = tursoAdapter({
      client,
      debugLogs: false,
    });
    
    const db = testAdapter({
      advanced: {
        database: {
          useNumberId: true,
        },
      },
    });
    
    const users = [];
    
    for (let i = 1; i <= 3; i++) {
      const user = await db.create({
        model: "user",
        data: {
          email: `test${i}@example.com`,
          name: `Test User ${i}`,
          emailVerified: false,
        },
      });

      users.push(user);
      
      // Verify ID is a string representation of a number
      const numericId = parseInt(user.id);
      if (isNaN(numericId) || numericId !== i) {
        throw new Error(`Expected ID ${i}, got ${user.id}`);
      }
    }

    console.log("✅ Sequential numeric ID creation test passed");

    // Verify table schema
    const tableInfo = await client.execute({
      sql: "PRAGMA table_info(user)",
      args: [],
    });

    const idColumn = tableInfo.rows?.find((row: any) => row.name === "id");
    if (!idColumn || idColumn.type !== "INTEGER" || idColumn.pk !== 1) {
      throw new Error("ID column not properly configured as INTEGER PRIMARY KEY");
    }

    console.log("✅ Database schema test passed");

    // Test data integrity
    const allUsers = await client.execute({
      sql: "SELECT id, email FROM user ORDER BY id",
      args: [],
    });

    if (!allUsers.rows || allUsers.rows.length !== 3) {
      throw new Error("Expected 3 users in database");
    }

    for (let i = 0; i < 3; i++) {
      const row = allUsers.rows[i] as any;
      if (row.id !== i + 1) {
        throw new Error(`Expected user ${i + 1} to have ID ${i + 1}, got ${row.id}`);
      }
    }

    console.log("✅ Data integrity test passed");

    console.log("\n🎉 All numeric IDs tests passed!");
    return true;
    
  } catch (error) {
    console.error("❌ Numeric IDs test failed:", error);
    return false;
  }
}

testNumericIdExample().then(success => {
  process.exit(success ? 0 : 1);
});