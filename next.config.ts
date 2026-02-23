import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
  async rewrites() {
    return [
      // Proxy Bunny CDN requests through Next.js to bypass hotlink protection
      {
        source: '/cdn/videos/:path*',
        destination: 'https://vz-6b68e26c-531.b-cdn.net/:path*',
      },
    ];
  },
};

export default nextConfig;
