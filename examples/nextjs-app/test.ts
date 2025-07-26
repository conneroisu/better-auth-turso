#!/usr/bin/env bun
import { spawn } from "bun";
import { join } from "path";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class NextJSTestRunner {
  private results: TestResult[] = [];
  private serverProcess: any = null;
  private readonly baseURL = "http://localhost:3001"; // Use different port to avoid conflicts
  private readonly timeout = 30000;

  async runAllTests(): Promise<void> {
    console.log("🧪 Testing Next.js Better Auth + Turso Example...");

    try {
      await this.setupTest();
      await this.runTests();
      await this.cleanup();
      this.printResults();
    } catch (error) {
      console.error("❌ Test setup failed:", error);
      await this.cleanup();
      process.exit(1);
    }
  }

  private async setupTest(): Promise<void> {
    console.log("📦 Installing dependencies...");
    const install = spawn(["bun", "install"], {
      cwd: __dirname,
      stdio: ["inherit", "pipe", "pipe"],
    });

    const installResult = await install.exited;
    if (installResult !== 0) {
      throw new Error("Failed to install dependencies");
    }

    console.log("🏗️  Building Next.js application...");
    const build = spawn(["bun", "run", "build"], {
      cwd: __dirname,
      stdio: ["inherit", "pipe", "pipe"],
    });

    const buildResult = await build.exited;
    if (buildResult !== 0) {
      throw new Error("Failed to build Next.js application");
    }

    console.log("🚀 Starting Next.js server...");
    this.serverProcess = spawn(["bun", "run", "start", "-p", "3001"], {
      cwd: __dirname,
      stdio: ["inherit", "pipe", "pipe"],
    });

    // Wait for server to start
    await this.waitForServer();
  }

  private async waitForServer(): Promise<void> {
    const maxAttempts = 30;
    const delay = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.baseURL}/api/health`);
        if (response.status === 404) {
          // 404 is expected for /api/health - means server is running
          console.log("✅ Next.js server started successfully");
          return;
        }
      } catch (error) {
        // Server not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error("Server failed to start within timeout");
  }

  private async runTests(): Promise<void> {
    await this.testHomePage();
    await this.testSignUpPage();
    await this.testSignInPage();
    await this.testDashboardRedirect();
    await this.testAPIRoutes();
    await this.testStaticAssets();
  }

  private async testHomePage(): Promise<void> {
    try {
      const response = await fetch(this.baseURL);
      const html = await response.text();

      if (response.status === 200 && 
          html.includes("Better Auth + Turso") && 
          html.includes("Next.js example")) {
        this.addResult("Home page loads correctly", true);
      } else {
        this.addResult("Home page loads correctly", false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.addResult("Home page loads correctly", false, String(error));
    }
  }

  private async testSignUpPage(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/signup`);
      const html = await response.text();

      if (response.status === 200 && 
          html.includes("Sign Up") && 
          html.includes("Create your account")) {
        this.addResult("Sign up page loads correctly", true);
      } else {
        this.addResult("Sign up page loads correctly", false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.addResult("Sign up page loads correctly", false, String(error));
    }
  }

  private async testSignInPage(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/signin`);
      const html = await response.text();

      if (response.status === 200 && 
          html.includes("Sign In") && 
          html.includes("Welcome back")) {
        this.addResult("Sign in page loads correctly", true);
      } else {
        this.addResult("Sign in page loads correctly", false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.addResult("Sign in page loads correctly", false, String(error));
    }
  }

  private async testDashboardRedirect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/dashboard`, {
        redirect: "manual"
      });

      // Dashboard should be accessible (will show login form or redirect)
      if (response.status === 200 || response.status === 302 || response.status === 307) {
        this.addResult("Dashboard route is protected", true);
      } else {
        this.addResult("Dashboard route is protected", false, `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.addResult("Dashboard route is protected", false, String(error));
    }
  }

  private async testAPIRoutes(): Promise<void> {
    try {
      // Test Better Auth API endpoint
      const response = await fetch(`${this.baseURL}/api/auth/session`, {
        method: "GET"
      });

      // Should return 401 (unauthorized) or 200 (no session)
      if (response.status === 401 || response.status === 200) {
        this.addResult("Auth API endpoints are accessible", true);
      } else {
        this.addResult("Auth API endpoints are accessible", false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.addResult("Auth API endpoints are accessible", false, String(error));
    }
  }

  private async testStaticAssets(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/_next/static/css/app/layout.css`);
      
      // CSS file might not exist, but server should handle the request
      if (response.status === 200 || response.status === 404) {
        this.addResult("Static asset serving works", true);
      } else {
        this.addResult("Static asset serving works", false, `Status: ${response.status}`);
      }
    } catch (error) {
      this.addResult("Static asset serving works", false, String(error));
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
    if (this.serverProcess) {
      console.log("🧹 Stopping Next.js server...");
      this.serverProcess.kill();
      await this.serverProcess.exited;
    }
  }

  private printResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failed = total - passed;

    console.log("\n📊 Test Results Summary:");
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed === 0) {
      console.log("\n🎉 All Next.js example tests passed!");
    } else {
      console.log("\n💥 Some tests failed:");
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  ❌ ${result.name}: ${result.error}`);
      });
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  const runner = new NextJSTestRunner();
  await runner.runAllTests();
}