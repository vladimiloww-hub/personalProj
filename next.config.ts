import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Encrypted prize picture read by the route at runtime (see scripts/encrypt-prize.mjs).
  outputFileTracingIncludes: {
    '/api/mreomd/prize': ['./private/prize.enc'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
}

export default nextConfig
