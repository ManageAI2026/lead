/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @lead/core ships prebuilt ESM in dist/ (package "exports" → dist/index.js),
  // so Next consumes it directly. It is built before this app in the build
  // pipeline (see vercel.json / package.json scripts).
};

export default nextConfig;
