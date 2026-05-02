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
      { protocol: 'http', hostname: 'localhost' }, // dev: API images from port 4100
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
  /**
   * Baseline Content-Security-Policy for the public property pages.
   *
   * What this protects against: a tenant on a paid tier injects malicious
   * JS via the website-builder Tracking Scripts feature. The CSP narrows
   * the blast radius — even if the script runs, it can only call out to
   * known analytics endpoints, not exfiltrate to arbitrary hosts.
   *
   * `'unsafe-inline'` for script-src is required because GTM / Pixel boot
   * code is inline. Once we move to a strict-dynamic / nonce model, drop it.
   * `'unsafe-eval'` is *not* listed — Razorpay's checkout iframe runs in its
   * own origin so it doesn't need it on our pages.
   */
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://static.hotjar.com https://www.clarity.ms https://checkout.razorpay.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://www.google.com https://maps.google.com https://checkout.razorpay.com https://api.razorpay.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        // Public property pages are at /[locale]/[slug] and below.
        // The middleware also rewrites subdomain/custom-domain hosts to this
        // path, so this matcher catches both routing styles.
        source: '/:locale(en|hi|bn|ta|te|mr|kn|ml|gu|pa)/:slug/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
        ],
      },
      {
        source: '/:locale(en|hi|bn|ta|te|mr|kn|ml|gu|pa)/:slug',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
        ],
      },
    ];
  },
};

const withNextIntl = require('next-intl/plugin')();

const baseConfig = withPWA(withNextIntl(nextConfig));

// Sentry wrapper. Source-map upload only happens when SENTRY_AUTH_TOKEN is
// set (typically in CI), so local dev/CI without the token stays quiet.
// `silent` suppresses Sentry's build chatter; `widenClientFileUpload` makes
// frame names from chunk-split files resolve cleanly in the Sentry UI.
const { withSentryConfig } = require('@sentry/nextjs');

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // Skip uploading source maps in environments without auth.
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

module.exports = withSentryConfig(baseConfig, sentryWebpackPluginOptions);
