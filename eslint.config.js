// @ts-check
/* eslint-env node */

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "dist/**/*",
      "node_modules/**/*",
      "*.js",
      "*.mjs",
      "*.d.ts",
      "coverage/**/*",
      "vitest.*.config.ts",
      "vitest.config.ts",
      "examples/**/*",
      "__tests__/**/*",
      "src/**/*.test.ts",
      "src/**/*.spec.ts",
      "src/test-setup.ts",
      "eslint.config.js",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Basic rules for adapter code
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off", // Database adapters need flexibility
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],

      // Core ESLint rules
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      "no-duplicate-imports": "error",
    },
  },
);
