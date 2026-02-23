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
      // Proxy Bunny CDN requests through Next.js to avoid hotlink protection on localhost
      {
        source: '/cdn/reels/:path*',
        destination: 'https://vz-8955c328-692.b-cdn.net/:path*',
      },
      {
        source: '/cdn/videos/:path*',
        destination: 'https://vz-6b68e26c-531.b-cdn.net/:path*',
      },
    ];
  },
};

export default nextConfig;
