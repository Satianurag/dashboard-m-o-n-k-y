import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  outputFileTracingRoot: path.resolve(__dirname),

  allowedDevOrigins: ["*.replit.dev", "*.sisko.replit.dev"],
}

export default nextConfig
