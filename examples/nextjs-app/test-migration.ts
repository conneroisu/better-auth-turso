#!/usr/bin/env bun
/**
 * Test script to verify Better Auth CLI migration functionality
 */

import { spawn } from "bun";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

interface MigrationTestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class MigrationTestRunner {
  private results: MigrationTestResult[] = [];
  private readonly schemaFile = join(__dirname, "schema.sql");

  async runTests(): Promise<void> {
    console.log("🧪 Testing Better Auth CLI Migration Integration...");

    try {
      await this.setupTest();
      await this.runMigrationTests();
      this.printResults();
    } catch (error) {
      console.error("❌ Migration test setup failed:", error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async setupTest(): Promise<void> {
    console.log("📦 Installing dependencies for migration test...");
    
    // Clean up any existing schema file
    if (existsSync(this.schemaFile)) {
      unlinkSync(this.schemaFile);
    }
  }

  private async runMigrationTests(): Promise<void> {
    await this.testSchemaGeneration();
    await this.testGeneratedSchemaContent();
    await this.testCustomOutput();
    await this.testConfigDetection();
  }

  private async testSchemaGeneration(): Promise<void> {
    try {
      console.log("🔄 Testing schema generation...");
      
      const generateProcess = spawn(["npx", "@better-auth/cli@latest", "generate", "--y"], {
        cwd: __dirname,
        stdio: ["inherit", "pipe", "pipe"],
      });

      const result = await generateProcess.exited;
      
      if (result === 0 && existsSync(this.schemaFile)) {
        this.addResult("Schema generation command succeeds", true);
      } else {
        this.addResult("Schema generation command succeeds", false, `Exit code: ${result}, file exists: ${existsSync(this.schemaFile)}`);
      }
    } catch (error) {
      this.addResult("Schema generation command succeeds", false, String(error));
    }
  }

  private async testGeneratedSchemaContent(): Promise<void> {
    try {
      if (!existsSync(this.schemaFile)) {
        this.addResult("Generated schema contains required tables", false, "Schema file not found");
        return;
      }

      const schemaContent = readFileSync(this.schemaFile, "utf-8");
      
      // Check for required tables
      const requiredTables = ["user", "session", "account", "verification"];
      const missingTables = requiredTables.filter(table => 
        !schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`) &&
        !schemaContent.includes(`CREATE TABLE ${table}`)
      );

      if (missingTables.length === 0) {
        this.addResult("Generated schema contains required tables", true);
      } else {
        this.addResult("Generated schema contains required tables", false, `Missing tables: ${missingTables.join(", ")}`);
      }

      // Check for Turso/SQLite specific syntax
      if (schemaContent.includes("TEXT") && schemaContent.includes("INTEGER")) {
        this.addResult("Schema uses SQLite/Turso compatible types", true);
      } else {
        this.addResult("Schema uses SQLite/Turso compatible types", false, "Missing SQLite data types");
      }

      // Check for primary keys and constraints
      if (schemaContent.includes("PRIMARY KEY") && schemaContent.includes("UNIQUE")) {
        this.addResult("Schema includes constraints and keys", true);
      } else {
        this.addResult("Schema includes constraints and keys", false, "Missing constraints");
      }

    } catch (error) {
      this.addResult("Generated schema content validation", false, String(error));
    }
  }

  private async testCustomOutput(): Promise<void> {
    try {
      const customFile = join(__dirname, "custom-schema.sql");
      
      // Clean up if exists
      if (existsSync(customFile)) {
        unlinkSync(customFile);
      }

      const generateProcess = spawn([
        "npx", "@better-auth/cli@latest", "generate", 
        "--output", customFile, 
        "--y"
      ], {
        cwd: __dirname,
        stdio: ["inherit", "pipe", "pipe"],
      });

      const result = await generateProcess.exited;
      
      if (result === 0 && existsSync(customFile)) {
        this.addResult("Custom output path works", true);
        unlinkSync(customFile); // Cleanup
      } else {
        this.addResult("Custom output path works", false, `Exit code: ${result}`);
      }
    } catch (error) {
      this.addResult("Custom output path works", false, String(error));
    }
  }

  private async testConfigDetection(): Promise<void> {
    try {
      // Test with explicit config path
      const generateProcess = spawn([
        "npx", "@better-auth/cli@latest", "generate", 
        "--config", "./auth.ts",
        "--y"
      ], {
        cwd: __dirname,
        stdio: ["inherit", "pipe", "pipe"],
      });

      const result = await generateProcess.exited;
      
      if (result === 0) {
        this.addResult("Explicit config path detection works", true);
      } else {
        this.addResult("Explicit config path detection works", false, `Exit code: ${result}`);
      }
    } catch (error) {
      this.addResult("Explicit config path detection works", false, String(error));
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

  private async cleanup(): Promise<void> {
    // Clean up generated files
    const filesToClean = [
      this.schemaFile,
      join(__dirname, "custom-schema.sql")
    ];

    for (const file of filesToClean) {
      if (existsSync(file)) {
        try {
          unlinkSync(file);
        } catch (error) {
          console.log(`⚠️  Could not clean up ${file}: ${error}`);
        }
      }
    }
  }

  private printResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failed = total - passed;

    console.log("\n📊 Migration Test Results:");
    console.log(`Passed: ${passed}/${total}`);

    if (failed === 0) {
      console.log("🎉 All migration tests passed!");
    } else {
      console.log(`💥 ${failed} test(s) failed`);
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  ❌ ${result.name}: ${result.error}`);
      });
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  const runner = new MigrationTestRunner();
  await runner.runTests();
}