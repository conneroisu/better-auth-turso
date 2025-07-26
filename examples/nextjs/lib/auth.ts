import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { tursoAdapter } from "better-auth-turso";

export const auth = betterAuth({
  database: tursoAdapter({
    config: process.env.NODE_ENV === "development" 
      ? {
          // Local development with SQLite file
          url: "file:./dev.db",
        }
      : {
          // Production with Turso remote database
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        },
    debugLogs: process.env.NODE_ENV === "development",
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for demo purposes
  },
  
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },
  
  trustedOrigins: ["http://localhost:3000", process.env.BETTER_AUTH_URL],
  
  plugins: [
    nextCookies(), // Enable Next.js cookie support
  ],
});