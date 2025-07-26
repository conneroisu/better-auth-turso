import { betterAuth } from "better-auth";
import { tursoAdapter } from "../src/index.js";

// Example 1: Remote Database
export const authRemote = betterAuth({
  database: tursoAdapter({
    config: {
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
});

// Example 2: Local Database with Remote Sync (Embedded Replicas)
export const authEmbedded = betterAuth({
  database: tursoAdapter({
    config: {
      url: "file:local.db",
      syncUrl: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
      syncInterval: 60000, // Sync every minute
    },
    debugLogs: {
      create: true,
      update: true,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

// Example 3: Local Development
export const authLocal = betterAuth({
  database: tursoAdapter({
    config: {
      url: "file:./dev.db",
    },
    usePlural: false,
    debugLogs: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
});

// Example 4: Using existing client
import { createClient } from "@libsql/client";

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const authWithClient = betterAuth({
  database: tursoAdapter({
    client: tursoClient,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});