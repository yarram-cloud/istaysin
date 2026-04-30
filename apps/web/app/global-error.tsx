'use client';

/**
 * Top-level error boundary for the App Router.
 *
 * Next.js renders this when an error escapes every nested error.tsx in the
 * tree. We capture it in Sentry (a no-op when DSN is unset) and show a
 * branded fallback UI rather than the default white screen.
 *
 * Note: this file MUST include `<html>` and `<body>` because it replaces the
 * root layout when it renders.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-surface-200 shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-surface-900 mb-3">Something went wrong</h1>
          <p className="text-sm text-surface-500 mb-6">
            We&rsquo;ve been notified and are looking into it. Try again, or refresh the page.
          </p>
          {error.digest && (
            <p className="text-[11px] text-surface-400 font-mono mb-6">Reference: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
