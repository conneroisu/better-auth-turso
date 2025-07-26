"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-600">Welcome, {session.user.name}</span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">User Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-500">Name:</span>
                <p className="text-slate-900">{session.user.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-500">Email:</span>
                <p className="text-slate-900">{session.user.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-500">Role:</span>
                <p className="text-slate-900">{session.user.role || "user"}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Session Info</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-500">Session ID:</span>
                <p className="text-slate-900 font-mono text-xs">{session.session.id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-500">Expires At:</span>
                <p className="text-slate-900 text-sm">
                  {new Date(session.session.expiresAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-500">Created At:</span>
                <p className="text-slate-900 text-sm">
                  {new Date(session.session.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Database Info</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-500">Adapter:</span>
                <p className="text-slate-900">Turso (libSQL)</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-500">Runtime:</span>
                <p className="text-slate-900">Bun</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-500">Framework:</span>
                <p className="text-slate-900">Next.js 15</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">🎉 Authentication Success!</h2>
          <div className="prose max-w-none">
            <p className="text-slate-600 mb-4">
              Congratulations! You've successfully authenticated using Better Auth with the Turso database adapter.
              This dashboard demonstrates a protected route that requires authentication.
            </p>
            
            <h3 className="text-lg font-semibold text-slate-900 mb-3">What's working:</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600 mb-6">
              <li>Email/password authentication</li>
              <li>Session management with cookies</li>
              <li>Protected routes with middleware</li>
              <li>User data stored in Turso database</li>
              <li>TypeScript type safety throughout</li>
              <li>Bun runtime for optimal performance</li>
            </ul>

            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">Tech Stack:</h4>
              <div className="text-sm text-slate-600">
                <strong>Auth:</strong> Better Auth • <strong>Database:</strong> Turso (libSQL) • 
                <strong>Framework:</strong> Next.js 15 • <strong>Runtime:</strong> Bun • 
                <strong>Styling:</strong> Tailwind CSS • <strong>Language:</strong> TypeScript
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}