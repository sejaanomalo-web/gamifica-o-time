// Daily check (1am UTC). For seasons that ended in the past 24h,
// generate a frozen WrappedSnapshot per collaborator and notify.

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const since = new Date(Date.now() - 25 * 3600 * 1000);
  const closedSeasons = await prisma.season.findMany({
    where: { isActive: false, endsAt: { gte: since, lte: new Date() } },
  });

  let snapshotsCreated = 0;

  for (const season of closedSeasons) {
    const totals = await prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { seasonId: season.id },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    for (let i = 0; i < totals.length; i++) {
      const t = totals[i];
      const finalRank = i + 1;
      const totalXp = t._sum.amount ?? 0;

      const goalsBeaten = await prisma.goal.count({
        where: { ownerId: t.userId, seasonId: season.id, status: "CONCLUIDA" },
      });

      const peak = await prisma.xpEvent.groupBy({
        by: ["createdAt"],
        where: { userId: t.userId, seasonId: season.id },
        _sum: { amount: true },
      });
      const peakItem = peak.sort((a, b) => (b._sum.amount ?? 0) - (a._sum.amount ?? 0))[0];

      await prisma.wrappedSnapshot.upsert({
        where: { userId_seasonId: { userId: t.userId, seasonId: season.id } },
        update: {},
        create: {
          userId: t.userId,
          seasonId: season.id,
          goalsBeaten,
          totalXp,
          peakDay: peakItem?.createdAt ?? null,
          peakDayXp: peakItem?._sum.amount ?? 0,
          finalRank,
          closingPhrase: "Construção. Constância.",
        },
      });
      snapshotsCreated++;

      await sendPushToUser(t.userId, {
        title: `Sua retrospectiva chegou.`,
        body: `Temporada ${season.number} em revisão. Toca pra ver.`,
        url: `/perfil/wrapped/${season.id}`,
      });
    }
  }

  return NextResponse.json({ ok: true, snapshotsCreated });
}
