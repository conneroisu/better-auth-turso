import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "property",
    environment: "node",
    globals: true,
    timeout: 120000, // Property tests can take longer
    include: ["src/**/*.property.test.ts"],
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
