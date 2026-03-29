import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PricingResult {
  totalAmount: number;
  nightlyRates: {
    date: string;
    rate: number;
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

  const baseRate = roomType.baseRate;
  const extraBedCharge = (roomType.extraBedCharge || 0) * extraBeds;

  // Retrieve all active pricing rules for this tenant that could apply
  // (Either specific to this room type, or applicable to all room types)
  const rules = await prisma.pricingRule.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [{ roomTypeId: null }, { roomTypeId }],
    },
    orderBy: { priority: 'desc' }, // Highest priority first
  });

  const nightlyRates: { date: string; rate: number; ruleApplied?: string }[] = [];
  let totalAmount = 0;

  // Iterate over each night
  // We don't charge for the checkOut date itself, so we loop until date < checkOut
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
        // If no date boundaries are set, it applies to any date
        matchesDate = true;
      }

      // 2. Check Days of Week (if daysOfWeek array is populated)
      let matchesDays = true;
      if (rule.daysOfWeek && Array.isArray(rule.daysOfWeek) && rule.daysOfWeek.length > 0) {
        matchesDays = rule.daysOfWeek.includes(current.getDay());
      }

      if (matchesDate && matchesDays) {
        // We found our highest priority matching rule
        appliedRuleName = rule.name;
        
        if (rule.adjustmentType === 'percentage') {
          // Positive adjustmentValue means markup, negative means markdown
          appliedRate = baseRate * (1 + (rule.adjustmentValue / 100));
        } else if (rule.adjustmentType === 'fixed_addition') {
          appliedRate = baseRate + rule.adjustmentValue;
        } else if (rule.adjustmentType === 'fixed_override') {
          appliedRate = rule.adjustmentValue;
        }
        
        break; // Stop looking because the rules are ordered by highest priority
      }
    }

    // Add extra bed charges to the night's rate
    // Floor the value so we don't end up with wild decimals like 100.000000001
    const finalNightRate = Math.round(appliedRate + extraBedCharge);

    nightlyRates.push({
      date: current.toISOString().split('T')[0],
      rate: finalNightRate,
      ruleApplied: appliedRuleName,
    });

    totalAmount += finalNightRate;

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return { totalAmount, nightlyRates };
}
