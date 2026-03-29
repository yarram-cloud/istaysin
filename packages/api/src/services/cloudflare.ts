/**
 * Domain Helpers — Subdomain URL generation
 *
 * Subdomains work via wildcard DNS (*.istaysin.com) — no per-property provisioning needed.
 * Change PLATFORM_DOMAIN env var to switch the base domain for all subdomains.
 */

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || 'istaysin.com';

/**
 * Returns the full public URL for a property slug.
 */
export function getSubdomainUrl(slug: string): string {
  return `https://${slug}.${PLATFORM_DOMAIN}`;
}

/**
 * Returns just the hostname for a property slug.
 */
export function getSubdomainHost(slug: string): string {
  return `${slug}.${PLATFORM_DOMAIN}`;
}

/**
 * Returns the root domain for CNAME configuration.
 */
export function getRootDomain(): string {
  return PLATFORM_DOMAIN;
}
