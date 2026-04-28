/**
 * Plan-tier feature flags.
 *
 * Centralised so the public-property response, the dashboard, the website
 * builder UI, and any future backend gate all read from one source of truth.
 *
 * The DB stores plan as a string (`tenant.plan`) populated from the
 * `saas_plans.code` column. Today's seeded codes are:
 *   - `free`         — minimal, evaluation
 *   - `basic`        — paid entry tier
 *   - `professional` — paid mid tier (custom website features)
 *   - `enterprise`   — paid top tier (everything)
 *
 * Adding a new feature: add it to PlanFeatures, decide which plans get it,
 * and grep for the existing flags to find every gate that should also
 * consult the new one.
 */

export interface PlanFeatures {
  /** Custom HTML/JS injected into the public property page (`<head>` / `<body>`). */
  customScripts: boolean;
  /** Custom CSS injected into the public property page. */
  customCss: boolean;
  /** Map a customer-owned domain (`www.acmehotel.com`) to the property. */
  customDomain: boolean;
  /** Multi-property switching (chains / groups). */
  multiProperty: boolean;
  /** OTA / channel-manager outbound integrations. */
  channelManager: boolean;
}

const DEFAULT_FEATURES: PlanFeatures = {
  customScripts: false,
  customCss: false,
  customDomain: false,
  multiProperty: false,
  channelManager: false,
};

const PLAN_FEATURES: Record<string, Partial<PlanFeatures>> = {
  free: {
    // All features off — the defaults already say so, listed here for clarity.
  },
  basic: {
    // Still no tenant-controlled HTML/CSS — that's the multi-tenant XSS surface.
  },
  professional: {
    customScripts: true,
    customCss: true,
    customDomain: true,
    channelManager: true,
  },
  enterprise: {
    customScripts: true,
    customCss: true,
    customDomain: true,
    multiProperty: true,
    channelManager: true,
  },
};

/**
 * Resolve the feature flags for a tenant's current plan.
 * Unknown plan strings safely fall back to all-features-off — fail closed.
 */
export function getPlanFeatures(plan: string | null | undefined): PlanFeatures {
  const normalised = (plan || '').toLowerCase();
  return { ...DEFAULT_FEATURES, ...(PLAN_FEATURES[normalised] || {}) };
}

/**
 * Convenience: single-feature check. Equivalent to
 *   getPlanFeatures(plan)[feature]
 * but more readable at call sites that only care about one flag.
 */
export function planAllows(plan: string | null | undefined, feature: keyof PlanFeatures): boolean {
  return getPlanFeatures(plan)[feature];
}
