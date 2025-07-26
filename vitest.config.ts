import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    timeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "examples/",
        "**/*.test.ts",
        "**/*.config.ts",
        "**/*.config.js",
      ],
    },
    setupFiles: ["./src/test-setup.ts"],
  },
  esbuild: {
    target: "node18",
  },
});