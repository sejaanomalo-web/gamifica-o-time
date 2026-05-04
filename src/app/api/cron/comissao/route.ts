// Day 1 of each month, 03:00 UTC. Closes the previous month per collaborator.
// Persists tier + weights snapshots so future config changes don't recalculate past months.

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { prisma } from "@/lib/prisma";
import { calculateCommission, formatCents } from "@/lib/commission";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

function previousMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const iso = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
  return { start, end, iso };
}

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const { start, end, iso } = previousMonthRange();
  const tiers = await prisma.commissionTier.findMany({ include: { user: true } });
  const weights = await prisma.deliveryWeight.findMany();

  let closed = 0;
  for (const tier of tiers) {
    const exists = await prisma.commissionMonth.findUnique({
      where: { userId_monthISO: { userId: tier.userId, monthISO: iso } },
    });
    if (exists) continue;

    const [delivAgg, adjAgg] = await Promise.all([
      prisma.delivery.aggregate({
        where: { userId: tier.userId, deliveredAt: { gte: start, lt: end } },
        _sum: { pointsApplied: true },
      }),
      prisma.adjustment.aggregate({
        where: { userId: tier.userId, createdAt: { gte: start, lt: end } },
        _sum: { pointsDeducted: true },
      }),
    ]);

    const gross = delivAgg._sum.pointsApplied ?? 0;
    const adjustments = adjAgg._sum.pointsDeducted ?? 0;
    const net = Math.max(0, gross - adjustments);
    const result = calculateCommission(net, tier);

    await prisma.commissionMonth.create({
      data: {
        userId: tier.userId,
        monthISO: iso,
        grossPoints: gross,
        adjustmentsTotal: adjustments,
        netPoints: net,
        tierReached: result.tierReached,
        bonusValue: result.bonusValueCents,
        tierSnapshot: tier as unknown as object,
        weightsSnapshot: weights as unknown as object,
      },
    });

    await sendPushToUser(tier.userId, {
      title: `Comissão de ${iso} fechada.`,
      body: `Tier ${result.tierReached}. ${formatCents(result.bonusValueCents)} de bônus.`,
      url: "/perfil/comissionamento",
    });

    closed++;
  }
  return NextResponse.json({ ok: true, monthISO: iso, closed });
}
