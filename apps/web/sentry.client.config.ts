/**
 * Sentry — browser runtime.
 *
 * Loaded by `@sentry/nextjs` automatically when the bundler builds for the
 * client. DSN-gated: with NEXT_PUBLIC_SENTRY_DSN unset, init is a no-op and
 * the SDK never sends a network request.
 *
 * Bundle impact: ~30–35 KB gzipped on the public property page. Replay is
 * disabled by default; turn it on per-route if you need session recordings.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  const isProd = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,

    // Match the API: 10% perf traces in prod, 100% locally.
    tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
      : isProd
      ? 0.1
      : 1.0,

    // Replay disabled — opt-in only because it has real bundle + bandwidth cost.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Filter noise that has no actionable signal.
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network blips
      'NetworkError',
      'Network request failed',
      'Load failed',
      'Failed to fetch',
      // Tenant-injected analytics scripts (we capture these on purpose at low volume)
      'Non-Error promise rejection captured',
    ],

    beforeSend(event) {
      // Strip headers that could carry session tokens
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        if (h.authorization) h.authorization = '[redacted]';
        if (h.cookie) h.cookie = '[redacted]';
      }
      // Strip auth fields from any captured form data
      const redact = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          if (
            k === 'password' ||
            k === 'currentPassword' ||
            k === 'newPassword' ||
            k === 'accessToken' ||
            k === 'refreshToken' ||
            k === 'apiKey' ||
            k === 'razorpaySecret'
          ) {
            obj[k] = '[redacted]';
          } else if (typeof obj[k] === 'object') {
            redact(obj[k]);
          }
        }
      };
      if (event.request?.data) redact(event.request.data);
      if (event.extra) redact(event.extra);
      return event;
    },
  });
}
