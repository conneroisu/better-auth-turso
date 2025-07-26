"use client";

import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";

export default function HomePage() {
  const session = useSession();

  if (session.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Better Auth + Turso</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Next.js example with Turso database adapter
          </p>
        </div>

        {session.data ? (
          <div className="text-center space-y-4">
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">
                Welcome back!
              </h2>
              <p className="text-green-700 dark:text-green-400">
                Email: {session.data.user.email}
              </p>
              <p className="text-green-700 dark:text-green-400">
                Name: {session.data.user.name || "Not provided"}
              </p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                Session ID: {session.data.session.id}
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Go to Dashboard
              </Link>

              <button
                onClick={() => signOut()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Not signed in</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please sign in to access your dashboard
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/signin"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}

        <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Features Demonstrated</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="font-medium text-blue-800 dark:text-blue-300">
                Authentication
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                Email & Password
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <div className="font-medium text-purple-800 dark:text-purple-300">
                Database
              </div>
              <div className="text-purple-600 dark:text-purple-400">
                Turso Adapter
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="font-medium text-green-800 dark:text-green-300">
                Session
              </div>
              <div className="text-green-600 dark:text-green-400">
                Management
              </div>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div className="font-medium text-orange-800 dark:text-orange-300">
                UI
              </div>
              <div className="text-orange-600 dark:text-orange-400">
                React Hooks
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
