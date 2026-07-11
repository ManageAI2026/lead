/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the shared workspace package from source.
  transpilePackages: ['@lead/core'],
  experimental: {
    // Keep server-only queue deps out of the client bundle.
    serverComponentsExternalPackages: ['bullmq', 'ioredis'],
  },
};

export default nextConfig;
