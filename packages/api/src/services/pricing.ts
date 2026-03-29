import { prisma } from '../config/database';

export interface PricingResult {
  totalAmount: number; // Base rate without tax (includes extra beds)
  totalGst: number;    // Tax amount
  grandTotal: number;  // Base + Tax
  nightlyRates: {
    date: string;
    rate: number;
    gstAmount: number;
    ruleApplied?: string;
  }[];
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

  const baseRate = roomType.baseRate;
  const extraBedCharge = (roomType.extraBedCharge || 0) * extraBeds;

  // Retrieve all active pricing rules for this tenant that could apply
  const rules = await prisma.pricingRule.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [{ roomTypeId: null }, { roomTypeId }],
    },
    orderBy: { priority: 'desc' }, // Highest priority first
  });

  const nightlyRates: { date: string; rate: number; gstAmount: number; ruleApplied?: string }[] = [];
  let totalAmount = 0;
  let totalGst = 0;

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

    if (gstEnabled) {
      // Indian GST Slabs for Hotel Rooms
      if (finalNightRate > 7500) {
        gstAmount = finalNightRate * 0.18;
      } else if (finalNightRate > 1000) {
        gstAmount = finalNightRate * 0.12;
      } else {
        gstAmount = 0;
      }
    }

    gstAmount = Math.round(gstAmount);

    nightlyRates.push({
      date: current.toISOString().split('T')[0],
      rate: finalNightRate,
      gstAmount,
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
    nightlyRates 
  };
}
