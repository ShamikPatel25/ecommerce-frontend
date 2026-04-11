import type { NextConfig } from "next";

// Internal URL used by Next.js *server* to reach Django (inside Docker network).
// Override via BACKEND_INTERNAL_URL env var; default assumes Docker Compose service name 'backend'.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://backend:8000';

const nextConfig: NextConfig = {
  output: 'standalone',

  turbopack: {},

  // Proxy /media/** to Django so images work correctly inside Docker.
  // The browser requests /media/..., Next.js server rewrites it to backend:8000/media/...
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: `${BACKEND_INTERNAL_URL}/media/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        // Proxied through Next.js itself (relative /media/** path)
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/media/**',
      },
      {
        // Local development — direct access to Django
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        // Docker internal network (container-to-container)
        protocol: 'http',
        hostname: 'backend',
        port: '8000',
        pathname: '/**',
      },
      {
        // Any HTTP host (catches all dev/staging scenarios)
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
      {
        // Any HTTPS host (production)
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;