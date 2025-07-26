import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-slate-900 mb-4">
            Better Auth + Turso
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            A complete authentication example using Better Auth with Turso database adapter
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">🚀 Fast & Secure</h3>
            <p className="text-slate-600">
              Built with Better Auth for comprehensive authentication and Turso for lightning-fast database operations.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">🌍 Edge Ready</h3>
            <p className="text-slate-600">
              Deploy globally with Turso's edge database network for optimal performance worldwide.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">🛡️ Type Safe</h3>
            <p className="text-slate-600">
              Full TypeScript support with proper type inference for both authentication and database operations.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">⚡ Bun Powered</h3>
            <p className="text-slate-600">
              Supercharged with Bun runtime for incredible performance and developer experience.
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Create Account</Link>
          </Button>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Quick Start</h3>
          <p className="text-slate-600 text-sm">
            Create an account or sign in to see the authentication flow in action. 
            The demo includes email/password auth, session management, and protected routes.
          </p>
        </div>
      </div>
    </div>
  );
}