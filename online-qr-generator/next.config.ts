import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hide the Next.js dev indicator (the floating badge). Dev-only; no effect in production.
  devIndicators: false,
  // Each app is deployed from its own Vercel project (Root Directory = this folder).
  // Keep config minimal; add per-app image domains / redirects here as needed.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
