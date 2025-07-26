/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Bun runtime
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
    // Enable Bun-specific optimizations
    bundlePagesRouterDependencies: true,
    optimizePackageImports: ['lucide-react'],
  },
  
  // Environment variables for better-auth and Turso
  env: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  },
  
  // Optimize for production builds with Bun
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // TypeScript configuration
  typescript: {
    // Skip type checking during build if you want faster builds
    // ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Skip ESLint during build if you want faster builds
    // ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig