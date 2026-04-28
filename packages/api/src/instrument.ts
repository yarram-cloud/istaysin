/**
 * Sentry instrumentation bootstrap.
 *
 * MUST be the very first import in `src/index.ts` so the auto-instrumented
 * Node.js core modules (http, fs, etc.) are wrapped before anything else
 * touches them. If you import this after `express` or `prisma`, you will get
 * partial (or zero) instrumentation.
 *
 * Behaviour:
 *   - DSN-gated. If SENTRY_DSN is unset (e.g. local dev), this is a no-op
 *     and the `@sentry/node` runtime never sends any network traffic.
 *   - Sensitive request body fields (password, razorpaySecret, twilioToken,
 *     accessToken) are redacted in `beforeSend` so they cannot leak into
 *     error reports.
 *   - Production samples 10% of traces by default; tune via
 *     SENTRY_TRACES_SAMPLE_RATE.
 *
 * Tagging the active scope per-request (userId, tenantId, role) is done in
 * the auth middleware — Sentry's auto async-context handling propagates
 * those tags to every span and exception captured during the request.
 */

import dotenv from 'dotenv';
import path from 'path';

// dotenv must run before reading SENTRY_DSN.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  const isProd = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.GIT_SHA || undefined,

    // 10% in prod is a sane default — bump per-route if you need deep traces
    // for a specific path. 100% in dev so you can verify integration locally.
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : isProd
      ? 0.1
      : 1.0,

    // Default integrations (httpIntegration, expressIntegration) are loaded
    // automatically in v8+. We don't override them.

    beforeSend(event) {
      // Redact sensitive fields anywhere they appear in request bodies.
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

      // Strip Authorization / Cookie headers — these can carry session tokens.
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        if (h.authorization) h.authorization = '[redacted]';
        if (h.cookie) h.cookie = '[redacted]';
      }

      return event;
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[Sentry] Initialized (env=${process.env.NODE_ENV || 'development'})`);
}

export const sentryEnabled = !!dsn;
