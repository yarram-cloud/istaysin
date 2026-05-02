import { prisma } from '../config/database';

export interface PricingResult {
  totalAmount: number; // Base rate without tax (includes extra beds)
  totalGst: number;    // Tax amount
  grandTotal: number;  // Base + Tax
  // 'nightly' = one entry per night; 'monthly' = one entry per billing month
  pricingUnit: 'nightly' | 'monthly';
  // For nightly bookings each entry is one night; for monthly bookings each entry is one billing period.
  // The shape is preserved across both modes so downstream folio generation is uniform.
  nightlyRates: {
    date: string;
    rate: number;
    gstAmount: number;
    gstPercent: number;
    ruleApplied?: string;
  }[];
}

// Default GST slabs — used when PlatformSettings has no custom config
const DEFAULT_GST_SLABS = [
  { maxRate: 1000,      gstPercent: 0 },
  { maxRate: 7500,      gstPercent: 12 },
  { maxRate: 99999999,  gstPercent: 18 },
];

/** Load GST slabs from PlatformSettings or fall back to defaults */
async function loadGstSlabs(): Promise<{ maxRate: number; gstPercent: number }[]> {
  try {
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'global' } });
    const config = (settings?.config as Record<string, any>) || {};
    if (Array.isArray(config.gstSlabs) && config.gstSlabs.length > 0) {
      return config.gstSlabs
        .map((s: any) => ({ maxRate: Number(s.maxRate), gstPercent: Number(s.gstPercent) }))
        .sort((a: any, b: any) => a.maxRate - b.maxRate);
    }
  } catch (err) {
    console.error('[GST SLABS] Failed to load from DB, using defaults', err);
  }
  return DEFAULT_GST_SLABS;
}

/** Determine GST percent for a given nightly rate using the slab table */
function getGstPercent(rate: number, slabs: { maxRate: number; gstPercent: number }[]): number {
  for (const slab of slabs) {
    if (rate <= slab.maxRate) return slab.gstPercent;
  }
  // If rate exceeds all slabs, use the last slab's rate
  return slabs[slabs.length - 1]?.gstPercent ?? 0;
}

export async function calculatePricing(
  tenantId: string,
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  extraBeds: number = 0
): Promise<PricingResult> {
  const roomType = await prisma.roomType.findFirst({
    where: { id: roomTypeId, tenantId },
  });

  if (!roomType) {
    throw new Error('RoomType not found');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { config: true },
  });
  
  const tenantConfig = (tenant?.config as Record<string, any>) || {};
  const gstEnabled = tenantConfig.gstEnabled === true;

  // Load GST slabs once per pricing calculation
  const gstSlabs = gstEnabled ? await loadGstSlabs() : [];

  const baseRate = roomType.baseRate;
  const extraBedCharge = (roomType.extraBedCharge || 0) * extraBeds;
  const pricingUnit: 'nightly' | 'monthly' = roomType.pricingUnit === 'monthly' ? 'monthly' : 'nightly';

  // Retrieve all active pricing rules for this tenant that could apply
  const rules = await prisma.pricingRule.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [{ roomTypeId: null }, { roomTypeId }],
    },
    orderBy: { priority: 'desc' }, // Highest priority first
  });

  const nightlyRates: { date: string; rate: number; gstAmount: number; gstPercent: number; ruleApplied?: string }[] = [];
  let totalAmount = 0;
  let totalGst = 0;

  // ── Monthly billing path ──────────────────────────────────────
  // PG / Hostel / long-stay rooms: charge once per calendar month, not per night.
  if (pricingUnit === 'monthly') {
    // Calendar-month math handles common cases (Jan 1 → Feb 1 = 1 month) more reliably
    // than days/30 division, which over-bills 31-day months.
    const start = new Date(checkIn); start.setHours(0, 0, 0, 0);
    const end = new Date(checkOut); end.setHours(0, 0, 0, 0);
    const calendarMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      + (end.getDate() >= start.getDate() ? 0 : -1);
    const numMonths = Math.max(1, calendarMonths || 1);

    const cursor = new Date(start);

    for (let i = 0; i < numMonths; i++) {
      // Pricing rules currently target nightly slots; for monthly we apply them to the period start date
      let appliedRate = baseRate;
      let appliedRuleName: string | undefined;
      for (const rule of rules) {
        let matchesDate = true;
        if (rule.startDate && rule.endDate) {
          const rStart = new Date(rule.startDate); rStart.setHours(0, 0, 0, 0);
          const rEnd = new Date(rule.endDate); rEnd.setHours(23, 59, 59, 999);
          matchesDate = cursor >= rStart && cursor <= rEnd;
        }
        if (matchesDate) {
          appliedRuleName = rule.name;
          if (rule.adjustmentType === 'percentage') appliedRate = baseRate * (1 + rule.adjustmentValue / 100);
          else if (rule.adjustmentType === 'fixed_addition') appliedRate = baseRate + rule.adjustmentValue;
          else if (rule.adjustmentType === 'fixed_override') appliedRate = rule.adjustmentValue;
          break;
        }
      }

      const finalMonthRate = Math.round(appliedRate + extraBedCharge);
      let gstPercent = 0;
      let gstAmount = 0;
      if (gstEnabled && gstSlabs.length > 0) {
        gstPercent = getGstPercent(finalMonthRate, gstSlabs);
        gstAmount = Math.round(finalMonthRate * (gstPercent / 100));
      }

      nightlyRates.push({
        date: cursor.toISOString().split('T')[0],
        rate: finalMonthRate,
        gstAmount,
        gstPercent,
        ruleApplied: appliedRuleName,
      });

      totalAmount += finalMonthRate;
      totalGst += gstAmount;

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return {
      totalAmount,
      totalGst,
      grandTotal: totalAmount + totalGst,
      pricingUnit,
      nightlyRates,
    };
  }

  // ── Nightly billing path (default) ────────────────────────────
  // Iterate over each night
  const current = new Date(checkIn);
  current.setHours(0, 0, 0, 0);

  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    let appliedRate = baseRate;
    let appliedRuleName: string | undefined = undefined;

    // Find the highest priority rule that applies to this specific date
    for (const rule of rules) {
      let matchesDate = false;

      // 1. Check Date Range Bounds
      if (rule.startDate && rule.endDate) {
        const rStart = new Date(rule.startDate);
        rStart.setHours(0, 0, 0, 0);
        const rEnd = new Date(rule.endDate);
        rEnd.setHours(23, 59, 59, 999);
        
        matchesDate = current >= rStart && current <= rEnd;
      } else {
        matchesDate = true;
      }

      // 2. Check Days of Week
      let matchesDays = true;
      if (rule.daysOfWeek && Array.isArray(rule.daysOfWeek) && rule.daysOfWeek.length > 0) {
        matchesDays = rule.daysOfWeek.includes(current.getDay());
      }

      if (matchesDate && matchesDays) {
        appliedRuleName = rule.name;
        
        if (rule.adjustmentType === 'percentage') {
          appliedRate = baseRate * (1 + (rule.adjustmentValue / 100));
        } else if (rule.adjustmentType === 'fixed_addition') {
          appliedRate = baseRate + rule.adjustmentValue;
        } else if (rule.adjustmentType === 'fixed_override') {
          appliedRate = rule.adjustmentValue;
        }
        break; 
      }
    }

    const finalNightRate = Math.round(appliedRate + extraBedCharge);
    let gstAmount = 0;
    let gstPercent = 0;

    if (gstEnabled && gstSlabs.length > 0) {
      gstPercent = getGstPercent(finalNightRate, gstSlabs);
      gstAmount = finalNightRate * (gstPercent / 100);
    }

    gstAmount = Math.round(gstAmount);

    nightlyRates.push({
      date: current.toISOString().split('T')[0],
      rate: finalNightRate,
      gstAmount,
      gstPercent,
      ruleApplied: appliedRuleName,
    });

    totalAmount += finalNightRate;
    totalGst += gstAmount;

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return {
    totalAmount,
    totalGst,
    grandTotal: totalAmount + totalGst,
    pricingUnit,
    nightlyRates,
  };
}

