#!/usr/bin/env bun
/**
 * Simple test script for Next.js example
 * This performs basic validation without starting a server
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class SimpleNextJSTest {
  private results: TestResult[] = [];

  async runTests(): Promise<void> {
    console.log("🧪 Running Simple Next.js Tests...");

    this.testPackageJson();
    this.testSourceFiles();
    this.testBuildFiles();
    this.testConfiguration();
    this.testAuthSetup();

    this.printResults();
  }

  private testPackageJson(): void {
    try {
      const packagePath = join(__dirname, "package.json");
      if (!existsSync(packagePath)) {
        this.addResult("Package.json exists", false, "File not found");
        return;
      }

      const packageContent = JSON.parse(readFileSync(packagePath, "utf-8"));
      
      const requiredDeps = ["next", "react", "react-dom", "better-auth", "@libsql/client"];
      const missingDeps = requiredDeps.filter(dep => !packageContent.dependencies?.[dep]);
      
      if (missingDeps.length === 0) {
        this.addResult("Required dependencies present", true);
      } else {
        this.addResult("Required dependencies present", false, `Missing: ${missingDeps.join(", ")}`);
      }

      const requiredScripts = ["dev", "build", "start"];
      const missingScripts = requiredScripts.filter(script => !packageContent.scripts?.[script]);
      
      if (missingScripts.length === 0) {
        this.addResult("Required scripts present", true);
      } else {
        this.addResult("Required scripts present", false, `Missing: ${missingScripts.join(", ")}`);
      }

    } catch (error) {
      this.addResult("Package.json validation", false, String(error));
    }
  }

  private testSourceFiles(): void {
    const requiredFiles = [
      "src/app/layout.tsx",
      "src/app/page.tsx",
      "src/app/signin/page.tsx",
      "src/app/signup/page.tsx",
      "src/app/dashboard/page.tsx",
      "src/app/api/auth/[...all]/route.ts",
      "src/lib/auth.ts",
      "src/lib/auth-client.ts",
      "src/app/globals.css"
    ];

    let missingFiles: string[] = [];

    for (const file of requiredFiles) {
      const filePath = join(__dirname, file);
      if (!existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length === 0) {
      this.addResult("All required source files exist", true);
    } else {
      this.addResult("All required source files exist", false, `Missing: ${missingFiles.join(", ")}`);
    }
  }

  private testBuildFiles(): void {
    const configFiles = [
      "next.config.js",
      "tsconfig.json",
      "tailwind.config.js",
      "postcss.config.js"
    ];

    let missingConfigs: string[] = [];

    for (const file of configFiles) {
      const filePath = join(__dirname, file);
      if (!existsSync(filePath)) {
        missingConfigs.push(file);
      }
    }

    if (missingConfigs.length === 0) {
      this.addResult("Configuration files exist", true);
    } else {
      this.addResult("Configuration files exist", false, `Missing: ${missingConfigs.join(", ")}`);
    }
  }

  private testConfiguration(): void {
    try {
      // Test Next.js config
      const nextConfigPath = join(__dirname, "next.config.js");
      if (existsSync(nextConfigPath)) {
        const configContent = readFileSync(nextConfigPath, "utf-8");
        if (configContent.includes("@libsql/client")) {
          this.addResult("Next.js config includes libSQL external package", true);
        } else {
          this.addResult("Next.js config includes libSQL external package", false, "Missing serverComponentsExternalPackages");
        }
      }

      // Test TypeScript config
      const tsConfigPath = join(__dirname, "tsconfig.json");
      if (existsSync(tsConfigPath)) {
        const tsConfig = JSON.parse(readFileSync(tsConfigPath, "utf-8"));
        if (tsConfig.compilerOptions?.paths?.["@/*"]) {
          this.addResult("TypeScript path mapping configured", true);
        } else {
          this.addResult("TypeScript path mapping configured", false, "Missing @/* path mapping");
        }
      }

    } catch (error) {
      this.addResult("Configuration validation", false, String(error));
    }
  }

  private testAuthSetup(): void {
    try {
      // Test main auth.ts file
      const authPath = join(__dirname, "auth.ts");
      if (existsSync(authPath)) {
        const authContent = readFileSync(authPath, "utf-8");
        
        if (authContent.includes("tursoAdapter")) {
          this.addResult("Turso adapter configured", true);
        } else {
          this.addResult("Turso adapter configured", false, "Missing tursoAdapter import/usage");
        }

        if (authContent.includes("emailAndPassword")) {
          this.addResult("Email/password authentication enabled", true);
        } else {
          this.addResult("Email/password authentication enabled", false, "Missing emailAndPassword config");
        }
      }

      // Test auth-client.ts file
      const authClientPath = join(__dirname, "src/lib/auth-client.ts");
      if (existsSync(authClientPath)) {
        const authClientContent = readFileSync(authClientPath, "utf-8");
        
        if (authClientContent.includes("createAuthClient")) {
          this.addResult("Auth client configured", true);
        } else {
          this.addResult("Auth client configured", false, "Missing createAuthClient");
        }
      }

      // Test API route
      const apiRoutePath = join(__dirname, "src/app/api/auth/[...all]/route.ts");
      if (existsSync(apiRoutePath)) {
        const apiContent = readFileSync(apiRoutePath, "utf-8");
        
        if (apiContent.includes("toNextJsHandler")) {
          this.addResult("API routes configured", true);
        } else {
          this.addResult("API routes configured", false, "Missing toNextJsHandler");
        }
      }

    } catch (error) {
      this.addResult("Auth configuration validation", false, String(error));
    }
  }

  private addResult(name: string, passed: boolean, error?: string): void {
    this.results.push({ name, passed, error });
    const status = passed ? "✅" : "❌";
    console.log(`${status} ${name}`);
    if (error) {
      console.log(`   Error: ${error}`);
    }
  }

  private printResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failed = total - passed;

    console.log("\n📊 Simple Test Results:");
    console.log(`Passed: ${passed}/${total}`);

    if (failed === 0) {
      console.log("🎉 All simple tests passed!");
    } else {
      console.log(`💥 ${failed} test(s) failed`);
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  const runner = new SimpleNextJSTest();
  await runner.runTests();
}