import DashboardLayoutClient from './layout-client';

/**
 * Dashboard segment is per-user, auth-gated, and consumes query params
 * (`admin_preview`, `from_setup`, `section`) inside `useSearchParams()` in the
 * client layout. Next.js 14 refuses to statically prerender any page in this
 * segment because of that hook usage — without `force-dynamic` here, the build
 * fails with "useSearchParams() should be wrapped in a suspense boundary"
 * across every dashboard page.
 *
 * `force-dynamic` opts the segment out of prerendering entirely; pages are
 * rendered on the server per request, exactly what we want for an auth-gated
 * SPA shell. The directive must live in a Server Component (this file), not
 * the `'use client'` layout below — that's why this thin wrapper exists.
 */
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
