// Commission calculation — pure function. Money values in CENTS.
// Test coverage in tests/unit/commission.test.ts.

import type { CommissionTier, CommissionTierReached } from "@/generated/prisma/client";

export interface CommissionResult {
  tierReached: CommissionTierReached;
  bonusValueCents: number;
  breakdown: { label: string; valueCents: number }[];
}

export function calculateCommission(netPoints: number, tier: CommissionTier): CommissionResult {
  const breakdown: { label: string; valueCents: number }[] = [];

  if (netPoints <= tier.baseMax) {
    return { tierReached: "BASE", bonusValueCents: 0, breakdown: [] };
  }

  let total = 0;

  if (netPoints >= tier.m1Min) {
    const m1Cap = Math.min(netPoints, tier.m1Max);
    const m1Steps = Math.floor((m1Cap - tier.m1Min + 1) / 20);
    const m1Bonus = m1Steps * tier.m1BonusPer20;
    if (m1Bonus > 0) {
      total += m1Bonus;
      breakdown.push({ label: `Meta 1 (${m1Steps} marcos de 20pts)`, valueCents: m1Bonus });
    }
  }

  if (netPoints >= tier.m2Min) {
    const m2Cap = Math.min(netPoints, tier.m2Max);
    const m2Steps = Math.floor((m2Cap - tier.m2Min + 1) / 20);
    const m2Bonus = m2Steps * tier.m2BonusPer20;
    if (m2Bonus > 0) {
      total += m2Bonus;
      breakdown.push({ label: `Meta 2 (${m2Steps} marcos de 20pts)`, valueCents: m2Bonus });
    }
  }

  if (netPoints >= tier.excellenceMin) {
    total += tier.excellenceFixedBonus;
    breakdown.push({ label: "Bônus fixo Excelência", valueCents: tier.excellenceFixedBonus });
    const excSteps = Math.floor((netPoints - tier.excellenceMin + 1) / tier.excellenceBonusStep);
    const excBonus = excSteps * tier.excellenceBonusPer10;
    if (excBonus > 0) {
      total += excBonus;
      breakdown.push({
        label: `Excelência (${excSteps} marcos de ${tier.excellenceBonusStep}pts)`,
        valueCents: excBonus,
      });
    }
    return { tierReached: "EXCELENCIA", bonusValueCents: total, breakdown };
  }

  if (netPoints >= tier.m2Min) return { tierReached: "META_2", bonusValueCents: total, breakdown };
  if (netPoints >= tier.m1Min) return { tierReached: "META_1", bonusValueCents: total, breakdown };
  return { tierReached: "BASE", bonusValueCents: 0, breakdown: [] };
}

export function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

// Helper: distance in points to next tier marker (used in /perfil/comissionamento UI).
export function pointsToNextMarker(netPoints: number, tier: CommissionTier): {
  nextMarker: number | null;
  nextLabel: string;
  nextBonusCents: number;
} {
  if (netPoints < tier.m1Min) {
    return { nextMarker: tier.m1Min, nextLabel: "Meta 1", nextBonusCents: tier.m1BonusPer20 };
  }
  if (netPoints < tier.m2Min) {
    return { nextMarker: tier.m2Min, nextLabel: "Meta 2", nextBonusCents: tier.m2BonusPer20 };
  }
  if (netPoints < tier.excellenceMin) {
    return {
      nextMarker: tier.excellenceMin,
      nextLabel: "Excelência",
      nextBonusCents: tier.excellenceFixedBonus,
    };
  }
  // already in excellence — next step is +N pts for next bonusPer10
  const stepsDone = Math.floor((netPoints - tier.excellenceMin + 1) / tier.excellenceBonusStep);
  const nextStepStart = tier.excellenceMin + (stepsDone + 1) * tier.excellenceBonusStep - 1;
  return {
    nextMarker: nextStepStart,
    nextLabel: `Próximo bônus de excelência`,
    nextBonusCents: tier.excellenceBonusPer10,
  };
}
