import type { PlanTier } from '@istays/shared';

interface PlanLimits {
  maxRooms: number;
  maxBookingsPerMonth: number;
  features: {
    housekeeping: boolean;
    analytics: boolean;
    customDomain: boolean;
    gstInvoicing: boolean;
    removeBranding: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    otaIntegration: boolean;
    apiAccess: boolean;
    multiProperty: boolean;
  };
  monthlyPrice: number;
  annualPrice: number;
}

export const PLAN_CONFIG: Record<PlanTier, PlanLimits> = {
  free: {
    maxRooms: 5,
    maxBookingsPerMonth: 50,
    features: {
      housekeeping: false,
      analytics: false,
      customDomain: false,
      gstInvoicing: false,
      removeBranding: false,
      emailNotifications: true,
      smsNotifications: false,
      otaIntegration: false,
      apiAccess: false,
      multiProperty: false,
    },
    monthlyPrice: 0,
    annualPrice: 0,
  },
  starter: {
    maxRooms: 20,
    maxBookingsPerMonth: -1, // unlimited
    features: {
      housekeeping: false,
      analytics: false,
      customDomain: false,
      gstInvoicing: false,
      removeBranding: true,
      emailNotifications: true,
      smsNotifications: false,
      otaIntegration: false,
      apiAccess: false,
      multiProperty: false,
    },
    monthlyPrice: 999,
    annualPrice: 9590, // 20% discount
  },
  professional: {
    maxRooms: 100,
    maxBookingsPerMonth: -1,
    features: {
      housekeeping: true,
      analytics: true,
      customDomain: true,
      gstInvoicing: true,
      removeBranding: true,
      emailNotifications: true,
      smsNotifications: true,
      otaIntegration: false,
      apiAccess: false,
      multiProperty: false,
    },
    monthlyPrice: 2999,
    annualPrice: 28790,
  },
  enterprise: {
    maxRooms: -1, // unlimited
    maxBookingsPerMonth: -1,
    features: {
      housekeeping: true,
      analytics: true,
      customDomain: true,
      gstInvoicing: true,
      removeBranding: true,
      emailNotifications: true,
      smsNotifications: true,
      otaIntegration: true,
      apiAccess: true,
      multiProperty: true,
    },
    monthlyPrice: 7999,
    annualPrice: 76790,
  },
  custom: {
    maxRooms: -1,
    maxBookingsPerMonth: -1,
    features: {
      housekeeping: true,
      analytics: true,
      customDomain: true,
      gstInvoicing: true,
      removeBranding: true,
      emailNotifications: true,
      smsNotifications: true,
      otaIntegration: true,
      apiAccess: true,
      multiProperty: true,
    },
    monthlyPrice: 0, // contact sales
    annualPrice: 0,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_CONFIG[plan as PlanTier] || PLAN_CONFIG.free;
}

export function isFeatureEnabled(plan: string, feature: keyof PlanLimits['features']): boolean {
  const limits = getPlanLimits(plan);
  return limits.features[feature] ?? false;
}
