/**
 * Sentry — Next.js server runtime (Node.js).
 *
 * Captures errors thrown inside Server Components, Route Handlers, and API
 * routes hosted in `apps/web`. Distinct DSN from the Express API in
 * `packages/api` so issues group by surface.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  const isProd = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.SENTRY_RELEASE || undefined,

    tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
      : isProd
      ? 0.1
      : 1.0,

    beforeSend(event) {
      const redact = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          if (
            k === 'password' ||
            k === 'currentPassword' ||
            k === 'newPassword' ||
            k === 'razorpaySecret' ||
            k === 'twilioToken' ||
            k === 'accessToken' ||
            k === 'refreshToken' ||
            k === 'apiKey'
          ) {
            obj[k] = '[redacted]';
          } else if (typeof obj[k] === 'object') {
            redact(obj[k]);
          }
        }
      };
      if (event.request?.data) redact(event.request.data);
      if (event.extra) redact(event.extra);
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        if (h.authorization) h.authorization = '[redacted]';
        if (h.cookie) h.cookie = '[redacted]';
      }
      return event;
    },
  });
}
