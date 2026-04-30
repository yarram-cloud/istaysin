/**
 * Sentry — Next.js edge runtime.
 *
 * Captures errors thrown inside `apps/web/middleware.ts` (where the custom-
 * domain resolution + auth guards run). The edge runtime is a stripped-down
 * V8 isolate, so we only initialise the minimum SDK surface here.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim();

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
  });
}
