import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  // Enable TypeScript type checking in production
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimize images for production
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  outputFileTracingRoot: path.resolve(__dirname),

  // Production-ready headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },

  // Turbopack configuration (Next.js 16+)
  turbopack: {
    resolveAlias: {
      // Map Node.js modules to empty objects in browser
      'fs': { 'browser': {} },
      'net': { 'browser': {} },
      'tls': { 'browser': {} },
    },
  },
}

export default nextConfig
