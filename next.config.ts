import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true, // Required for PostHog reverse proxy
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.bunnycdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin/companies',
        destination: '/admin/clients',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Proxy Bunny CDN requests through Next.js to bypass hotlink protection
      {
        source: '/cdn/videos/:path*',
        destination: 'https://vz-6b68e26c-531.b-cdn.net/:path*',
      },
      // Proxy PostHog requests through our domain to bypass ad blockers
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
};

export default nextConfig;
