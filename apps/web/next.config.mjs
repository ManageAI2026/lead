/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @lead/core ships prebuilt ESM in dist/ (package "exports" → dist/index.js),
  // so Next consumes it directly. It is built before this app in the build
  // pipeline (see vercel.json / package.json scripts).
  experimental: {
    // Keep server-only queue deps out of the client bundle.
    serverComponentsExternalPackages: ['bullmq', 'ioredis'],
  },
};

export default nextConfig;
