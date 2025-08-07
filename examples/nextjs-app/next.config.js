/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@tursodatabase/turso"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Turso packages for server-side
      config.externals.push({
        "@tursodatabase/turso": "@tursodatabase/turso",
      });
    }
    return config;
  },
  // Disable strict mode for better compatibility with Better Auth
  reactStrictMode: false,
};

module.exports = nextConfig;
