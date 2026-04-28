import type { NextConfig } from "next";

// Internal URL used by Next.js *server* to reach Django (inside Docker network).
// Override via BACKEND_INTERNAL_URL env var; default assumes Docker Compose service name 'backend'.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://backend:8000';

// Production image domains — comma-separated list of hostnames (e.g., "api.mysite.com,cdn.mysite.com")
const extraImageDomains = (process.env.NEXT_PUBLIC_IMAGE_DOMAINS || '')
  .split(',')
  .map(d => d.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: 'standalone',

  turbopack: {},

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

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
      // Proxied through Next.js itself (relative /media/** path)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/media/**',
      },
      // Local development — direct access to Django
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      // Docker internal network (container-to-container)
      {
        protocol: 'http',
        hostname: 'backend',
        port: '8000',
        pathname: '/**',
      },
      // Production domains from env var
      ...extraImageDomains.map(hostname => ({
        protocol: 'https' as const,
        hostname,
        pathname: '/**',
      })),
    ],
  },
};

export default nextConfig;