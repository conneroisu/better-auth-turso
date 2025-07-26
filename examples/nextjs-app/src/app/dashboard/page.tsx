"use client";

import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const session = useSession();
  const router = useRouter();

  if (session.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session.data) {
    router.push("/signin");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {session.data.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome to your dashboard, {session.data.user.name || "User"}!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This is a protected route that requires authentication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              User Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">ID:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">{session.data.user.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">{session.data.user.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {session.data.user.name || "Not provided"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Verified:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {session.data.user.emailVerified ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Session Details
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Session ID:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">
                  {session.data.session.id}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Created:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date(session.data.session.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Expires:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date(session.data.session.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Database Info
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Database:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">Turso (libSQL)</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Adapter:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">better-auth-turso</span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Storage:</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {process.env.TURSO_DATABASE_URL ? "Remote" : "Local"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Example Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  Email Authentication
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Session Management
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  Protected Routes
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  Database Integration
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}