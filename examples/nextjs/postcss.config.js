/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Add cssnano for production builds
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
}