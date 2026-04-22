/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@istays/shared'],
  images: {
    // Allow next/image to optimise images from any external HTTPS host.
    // Property owners can upload assets to Firebase Storage, AWS S3, Cloudinary, etc.
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // wildcard — covers all property CDN hosts
    ],
    // Reasonable quality/size defaults for hotel photography
    deviceSizes: [375, 640, 768, 1024, 1280, 1920],
    imageSizes: [64, 128, 256, 512],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100/api/v1'}/:path*`,
      },
    ];
  },
};

const withNextIntl = require('next-intl/plugin')();

module.exports = withPWA(withNextIntl(nextConfig));
