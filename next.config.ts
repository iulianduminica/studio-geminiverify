
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // By default, Next.js will fail your build if you have TypeScript errors.
  // This is a good thing, but it can be frustrating during development.
  // We are setting this to `false` to enforce good practices.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.giphy.com',
      },
    ],
  },
};

export default nextConfig;
