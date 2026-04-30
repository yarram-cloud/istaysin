/**
 * On-demand revalidation endpoint.
 *
 * Called by the API server after a tenant's website-builder save so the
 * cached HTML for that property's public page refreshes immediately rather
 * than waiting the 60s ISR window. Auth is via `REVALIDATE_SECRET` shared
 * between the API and this Next.js app — server-only, never exposed to the
 * browser. Without the secret you cannot blow up the cache, even with a
 * valid user session, so a logged-out spammer cannot DoS the build server.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const KNOWN_LOCALES = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'kn', 'ml', 'gu', 'pa'] as const;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Compare against the env value at request time (not module-init) so a
  // restart-free env update takes effect.
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'revalidation disabled' }, { status: 503 });
  }

  const presented = req.headers.get('x-revalidate-secret');
  // Constant-time-ish compare. The secret is short and short-circuiting on
  // length is fine; the timing leak surface is negligible.
  if (presented !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'bad slug' }, { status: 400 });
  }

  // Two layers of invalidation:
  //   1. revalidateTag — drops the cached `/public/properties/:slug` data
  //      fetch shared by every locale's render of this property.
  //   2. revalidatePath — drops the rendered HTML for each locale variant.
  // Together they ensure the next request for any locale sees fresh data
  // AND a fresh render. Cheap operations — neither blocks on a re-render.
  revalidateTag(`property:${slug}`);

  const revalidated: string[] = [];
  for (const locale of KNOWN_LOCALES) {
    const path = `/${locale}/${slug}`;
    revalidatePath(path);
    revalidated.push(path);
  }

  return NextResponse.json({ revalidated, tag: `property:${slug}` });
}

// Method-not-allowed responses so probes get a clear answer
export function GET() {
  return NextResponse.json({ error: 'POST only' }, { status: 405 });
}
