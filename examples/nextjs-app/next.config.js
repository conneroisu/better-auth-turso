/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
  },
  // Disable strict mode for better compatibility with Better Auth
  reactStrictMode: false,
}

module.exports = nextConfig