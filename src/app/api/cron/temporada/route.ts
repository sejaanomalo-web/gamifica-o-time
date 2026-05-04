// Daily check (Vercel cron 0 0 * * *). If active season has ended,
// rotate: close it, create the next one, award top-3 badges.

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const now = new Date();
  const active = await prisma.season.findFirst({ where: { isActive: true } });

  if (!active) {
    const startsAt = now;
    const endsAt = new Date(now.getTime() + 30 * 86400000);
    const created = await prisma.season.create({
      data: { number: 1, startsAt, endsAt, isActive: true },
    });
    return NextResponse.json({ created: created.id });
  }

  if (now < active.endsAt) {
    return NextResponse.json({ ok: true, status: "season-ongoing" });
  }

  // close + open next
  await prisma.season.update({
    where: { id: active.id },
    data: { isActive: false },
  });
  const next = await prisma.season.create({
    data: {
      number: active.number + 1,
      startsAt: now,
      endsAt: new Date(now.getTime() + 30 * 86400000),
      isActive: true,
    },
  });

  // award top-3
  const top = await prisma.xpEvent.groupBy({
    by: ["userId"],
    where: { seasonId: active.id },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 3,
  });
  const champBadge = await prisma.badge.upsert({
    where: { id: `champion-${active.id}` },
    update: {},
    create: {
      id: `champion-${active.id}`,
      name: `Campeão da Temporada ${active.number}`,
      description: `Top 3 da temporada ${active.number}.`,
      iconUrl: "",
      criterion: "Terminar entre os 3 maiores XP da temporada.",
      isAuto: true,
    },
  });
  for (const t of top) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: t.userId, badgeId: champBadge.id } },
      update: {},
      create: { userId: t.userId, badgeId: champBadge.id },
    });
  }

  return NextResponse.json({ closed: active.id, opened: next.id, top: top.length });
}
