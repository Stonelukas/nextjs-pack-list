import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // CSS optimization disabled due to critters issue
  // experimental: {
  //   optimizeCss: true,
  // },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for WorkOS AuthKit Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "node:https": false,
        "node:http": false,
        "node:fs": false,
        "node:path": false,
        "node:crypto": false,
        "node:stream": false,
        "node:util": false,
        "node:url": false,
        "node:querystring": false,
        "https": false,
        "http": false,
        "fs": false,
        "path": false,
        "crypto": false,
        "stream": false,
        "util": false,
        "url": false,
        "querystring": false,
      };
    }
    return config;
  },
};

// Bundle analyzer configuration
import bundleAnalyzer from '@next/bundle-analyzer';
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
