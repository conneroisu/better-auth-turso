import { betterAuth } from "better-auth";
import { createClient } from "@libsql/client";
import { tursoAdapter } from "../../src/index";

// Create Turso client for the example
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const auth = betterAuth({
  database: tursoAdapter({
    client,
    debugLogs: {
      create: process.env.NODE_ENV === "development",
      findOne: process.env.NODE_ENV === "development",
      findMany: process.env.NODE_ENV === "development",
      update: process.env.NODE_ENV === "development",
      delete: process.env.NODE_ENV === "development",
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-here-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});