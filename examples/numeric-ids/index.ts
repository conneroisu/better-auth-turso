import { betterAuth } from "better-auth";
import Database from "@tursodatabase/turso";
import { tursoAdapter } from "../../src/index.js";

console.log("🚀 Starting Better Auth Turso Numeric IDs Example...");

// Create Turso database
const database = new Database(":memory:");

// Configure Better Auth with Turso adapter using numeric IDs
const auth = betterAuth({
  database: tursoAdapter({
    database,
    debugLogs: {
      create: true,
      findOne: true,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      useNumberId: true, // Enable auto-incrementing numeric IDs
    },
  },
});

async function runNumericIdExample() {
  try {
    console.log("\n📝 Creating users with auto-increment IDs...");

    // Access the database adapter directly for demonstration
    const testAdapter = tursoAdapter({
      client,
      debugLogs: {
        create: true,
        findOne: true,
      },
    });

    const db = testAdapter({
      advanced: {
        database: {
          useNumberId: true,
        },
      },
    });

    // Create multiple users to demonstrate auto-increment
    const users = [];

    for (let i = 1; i <= 3; i++) {
      const user = await db.create({
        model: "user",
        data: {
          email: `user${i}@example.com`,
          name: `User ${i}`,
          emailVerified: false,
        },
      });

      users.push(user);
      console.log(
        `✅ User ${i} created with ID: ${user.id} (type: ${typeof user.id})`,
      );
    }

    console.log("\n🔢 Verifying numeric ID sequence...");

    // Verify IDs are sequential numbers (as strings)
    for (let i = 0; i < users.length; i++) {
      const expectedId = (i + 1).toString();
      const actualId = users[i].id;

      if (actualId !== expectedId) {
        throw new Error(`Expected ID ${expectedId}, got ${actualId}`);
      }

      // Verify it can be parsed as a number
      const numericId = parseInt(actualId);
      if (isNaN(numericId) || numericId !== i + 1) {
        throw new Error(`ID ${actualId} is not a valid sequential number`);
      }
    }

    console.log("✅ Numeric ID sequence is correct!");

    console.log("\n🔍 Finding users by numeric ID...");

    // Test finding users by their numeric IDs
    for (const user of users) {
      const foundUser = await db.findOne({
        model: "user",
        where: [{ field: "id", value: user.id }],
      });

      if (!foundUser || foundUser.id !== user.id) {
        throw new Error(`Failed to find user with ID ${user.id}`);
      }

      console.log(`✅ User with ID ${user.id} found successfully`);
    }

    console.log("\n📊 Checking database schema...");

    // Check table schema to verify INTEGER PRIMARY KEY AUTOINCREMENT
    const userTableInfo = await client.execute({
      sql: "PRAGMA table_info(user)",
      args: [],
    });

    const idColumn = userTableInfo.rows?.find((row: any) => row.name === "id");
    if (!idColumn) {
      throw new Error("ID column not found");
    }

    console.log("✅ ID column info:", {
      name: idColumn.name,
      type: idColumn.type,
      primaryKey: idColumn.pk === 1,
    });

    if (idColumn.type !== "INTEGER" || idColumn.pk !== 1) {
      throw new Error("ID column is not configured as INTEGER PRIMARY KEY");
    }

    // Show the actual data in the database
    const allUsers = await client.execute({
      sql: "SELECT id, name, email FROM user ORDER BY id",
      args: [],
    });

    console.log("\n📋 Users in database:");
    allUsers.rows?.forEach((row: any) => {
      console.log(
        `  ID: ${row.id} (${typeof row.id}) - ${row.name} (${row.email})`,
      );
    });

    console.log("\n🎉 Numeric IDs example completed successfully!");
  } catch (error) {
    console.error("❌ Numeric IDs example failed:", error);
    process.exit(1);
  }
}

// Run the example
runNumericIdExample().catch(console.error);
