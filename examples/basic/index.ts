import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { tursoAdapter } from "../../src/index.js";

console.log("🚀 Starting Better Auth Turso Example...");

// Create Turso database (using in-memory database for example)
const database = new Database(":memory:"); // Use file database in production: "./database.db"

// Configure Better Auth with Turso adapter
const auth = betterAuth({
  database: tursoAdapter({
    database,
    debugLogs: {
      create: true,
      findOne: true,
      update: true,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
    },
  },
});

// Example usage
async function runExample() {
  try {
    console.log("\n📝 Creating a user...");

    // Access the database adapter directly for demonstration
    const testAdapter = tursoAdapter({
      database,
      debugLogs: {
        create: true,
        findOne: true,
      },
    });

    const db = testAdapter.adapter({});

    // Create a user
    const user = await db.create({
      model: "user",
      data: {
        email: "john.doe@example.com",
        name: "John Doe",
        emailVerified: false,
        firstName: "John",
        lastName: "Doe",
      },
    });

    console.log("✅ User created:", {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    console.log("\n🔍 Finding the user...");

    // Find the user
    const foundUser = await db.findOne({
      model: "user",
      where: [{ field: "email", value: "john.doe@example.com" }],
    });

    console.log("✅ User found:", {
      id: foundUser?.id,
      email: foundUser?.email,
      name: foundUser?.name,
    });

    console.log("\n📊 Checking database tables...");

    // Show created tables
    const tablesStmt = database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const tables = tablesStmt.all();

    console.log(
      "✅ Database tables created:",
      tables.map((row: any) => row.name) || [],
    );

    console.log("\n🎉 Example completed successfully!");
  } catch (error) {
    console.error("❌ Example failed:", error);
    process.exit(1);
  }
}

// Run the example
runExample().catch(console.error);
