// Plan hierarchy utility — single source of truth for feature gating

export type PlanCode = 'free' | 'basic' | 'professional' | 'enterprise';

export const PLAN_RANK: Record<PlanCode, number> = {
  free:         0,
  basic:        1,
  professional: 2,
  enterprise:   3,
};

export const PLAN_LABELS: Record<PlanCode, string> = {
  free:         'Free',
  basic:        'Starter',
  professional: 'Professional',
  enterprise:   'Enterprise',
};

export const PLAN_HIGHLIGHTS: Record<PlanCode, string[]> = {
  free: [],
  basic: [
    'yourhotel.istaysin.com subdomain',
    'Website builder',
    'Staff management',
    'GST invoicing',
    'Unlimited bookings',
  ],
  professional: [
    'Advanced analytics',
    'Seasonal rates & pricing engine',
    'Phone + email support',
    'API access',
  ],
  enterprise: [
    'Custom domain',
    'OTA / Channel Manager integration',
    'Multi-property management',
    'Dedicated account manager',
  ],
};

/** Returns true if the user's current plan meets or exceeds the required plan */
export function hasAccess(userPlan: string, requiredPlan: PlanCode): boolean {
  const userRank = PLAN_RANK[userPlan as PlanCode] ?? 0;
  const reqRank  = PLAN_RANK[requiredPlan];
  return userRank >= reqRank;
}

/** Read the current plan from localStorage (safe — returns 'free' on SSR/miss) */
export function getCurrentPlan(): PlanCode {
  if (typeof window === 'undefined') return 'free';
  try {
    const memberships = localStorage.getItem('memberships');
    if (memberships) {
      const parsed = JSON.parse(memberships);
      return (parsed?.[0]?.tenant?.plan as PlanCode) || 'free';
    }
  } catch { /* ignore */ }
  return 'free';
}
