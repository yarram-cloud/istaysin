import { NextRequest, NextResponse } from 'next/server';

/**
 * Tenant Resolution Middleware
 *
 * Resolves the current tenant from:
 * 1. Subdomain: propertyslug.istaysin.com
 * 2. Custom domain: www.myproperty.com (via API lookup)
 * 3. Path-based: istaysin.com/property/[slug] (passthrough)
 *
 * For subdomains and custom domains, rewrites the URL internally to /property/[slug]/...
 * so existing page components work without duplication.
 */

// Root domain — requests to this domain are NOT subdomains
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'istaysin.com';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100/api/v1';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/admin'];
// Routes that should redirect if already authenticated
const authRoutes = ['/login', '/register'];

// Simple in-memory cache for custom domain lookups (TTL: 5 minutes)
const domainCache = new Map<string, { slug: string | null; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function resolveCustomDomain(domain: string): Promise<string | null> {
  const cached = domainCache.get(domain);
  if (cached && cached.expiry > Date.now()) {
    return cached.slug;
  }

  try {
    const res = await fetch(`${API_URL}/public/resolve-domain?domain=${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      const slug = data.data?.slug || null;
      domainCache.set(domain, { slug, expiry: Date.now() + CACHE_TTL });
      return slug;
    }
  } catch {
    // API unreachable — don't cache failures
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const headers = new Headers(request.headers);
  const accessToken = request.cookies.get('accessToken')?.value;

  // Use x-forwarded-host (set by Cloudflare/proxy) or fall back to nextUrl.hostname
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const hostname = forwardedHost?.split(':')[0] || request.nextUrl.hostname;

  // Skip tenant resolution for static assets, API routes, and system paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  let tenantSlug: string | null = null;
  let isSubdomainOrCustomDomain = false;

  // 1. Check subdomain (e.g., grand-hotel.istaysin.com)
  const rootParts = ROOT_DOMAIN.split('.');
  const hostParts = hostname.split('.');

  if (hostParts.length > rootParts.length) {
    const subdomain = hostParts.slice(0, hostParts.length - rootParts.length).join('.');
    // Skip common non-tenant subdomains
    if (!['www', 'app', 'api', 'admin', 'mail', 'blog'].includes(subdomain)) {
      tenantSlug = subdomain;
      isSubdomainOrCustomDomain = true;
    }
  }

  // 2. Check custom domain (hostname doesn't match root domain at all)
  if (!tenantSlug) {
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isRootDomain = hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`;

    if (!isLocalhost && !isRootDomain) {
      const slug = await resolveCustomDomain(hostname);
      if (slug) {
        tenantSlug = slug;
        isSubdomainOrCustomDomain = true;
      }
    }
  }

  // 3. For subdomain/custom domain requests: REWRITE to /property/[slug]/...
  if (tenantSlug && isSubdomainOrCustomDomain) {
    headers.set('x-tenant-slug', tenantSlug);

    // If already on a /property/ path, don't double-rewrite
    if (pathname.startsWith('/property/')) {
      return NextResponse.next({ request: { headers } });
    }

    // Skip platform pages (dashboard, login, register, admin)
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/admin')
    ) {
      // Still apply auth guards for protected routes
      if (protectedRoutes.some((route) => pathname.startsWith(route)) && !accessToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next({ request: { headers } });
    }

    // Rewrite: / → /property/[slug], /rooms → /property/[slug]/rooms, etc.
    const rewritePath = pathname === '/' ? `/property/${tenantSlug}` : `/property/${tenantSlug}${pathname}`;

    const url = request.nextUrl.clone();
    url.pathname = rewritePath;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // 4. Path-based: /property/[slug] — just set the header
  if (!tenantSlug) {
    const match = pathname.match(/^\/property\/([a-z0-9-]+)/);
    if (match) {
      tenantSlug = match[1];
    }
  }

  if (tenantSlug) {
    headers.set('x-tenant-slug', tenantSlug);
  }

  // Auth guard: protected routes need authentication
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
