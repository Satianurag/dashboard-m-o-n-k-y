import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  // Note: cacheComponents (PPR) is incompatible with `export const revalidate`
  // We use ISR with revalidate=60s which provides excellent caching

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
  // We provide an empty config to silence the warning about having webpack config
  turbopack: {},

  // Webpack fallback for production
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

export default nextConfig
