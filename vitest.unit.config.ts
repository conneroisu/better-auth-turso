import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "unit",
    environment: "node",
    globals: true,
    timeout: 30000,
    include: ["src/**/*.unit.test.ts"],
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
