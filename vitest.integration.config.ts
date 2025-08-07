import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "integration",
    environment: "node",
    globals: true,
    timeout: 60000,
    include: ["src/**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "dist/**",
        "node_modules/**",
        "**/*.d.ts",
        "**/*.config.ts",
        "**/*.test.ts",
      ],
    },
  },
  esbuild: {
    target: "node18",
  },
});
