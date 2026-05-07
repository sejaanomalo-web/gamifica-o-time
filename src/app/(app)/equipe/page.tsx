// Dashboard do Time — admin-only. Tela "kiosk" pra TV no escritório.
// Roda 24h, auto-refresh a cada 30s, animação constante.

import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCollaboratorIds } from "@/lib/collaborators";
import { TeamDashboard, type TeamMember, type ActivityEvent } from "@/components/feature/teamtv/TeamDashboard";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[equipe] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EquipePage() {
  const user = await requireAppUser();
  if (user.role !== "ADMIN") redirect("/dashboard");

  const season = await safe(
    "season.findFirst",
    () => prisma.season.findFirst({ where: { isActive: true } }),
    null,
  );

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 86400000);

  // Apenas COLABORADORes entram no game. ADMINs são gestores e ficam de fora
  // de qualquer ranking, contagem ou destaque.
  const collaboratorIds = await safe(
    "collaboratorIds",
    () => getCollaboratorIds(),
    [] as string[],
  );

  // Sempre busca todos os colaboradores (mesmo os zerados aparecem na equipe)
  const collaboratorUsers = await safe(
    "user.findMany collaborators",
    () =>
      prisma.user.findMany({
        where: { role: "COLABORADOR" },
        select: { id: true, name: true, area: true, avatarUrl: true },
        orderBy: { name: "asc" },
      }),
    [] as Array<{
      id: string;
      name: string;
      area: string | null;
      avatarUrl: string | null;
    }>,
  );

  let members: TeamMember[] = [];
  let totalSeasonXp = 0;
  let totalDeliveriesToday = 0;
  let totalDeliveriesWeek = 0;
  let totalGoalsBeaten = 0;
  let avgLevel = 0;
  let daysLeftInSeason = 0;
  let seasonNumber = 0;

  if (season && collaboratorIds.length > 0) {
    seasonNumber = season.number;
    daysLeftInSeason = Math.max(
      0,
      Math.ceil((season.endsAt.getTime() - Date.now()) / 86400000),
    );

    const totals = await safe(
      "xpEvent.groupBy totals",
      async () => {
        const rows = await prisma.xpEvent.groupBy({
          by: ["userId"],
          where: { seasonId: season.id, userId: { in: collaboratorIds } },
          _sum: { amount: true },
        });
        return rows.map((r) => ({ userId: r.userId, sum: r._sum.amount ?? 0 }));
      },
      [] as { userId: string; sum: number }[],
    );
    const totalsMap = new Map(totals.map((t) => [t.userId, t.sum]));

    const weekly = await safe(
      "xpEvent.groupBy weekly",
      async () => {
        const rows = await prisma.xpEvent.groupBy({
          by: ["userId"],
          where: {
            seasonId: season.id,
            createdAt: { gte: weekStart },
            userId: { in: collaboratorIds },
          },
          _sum: { amount: true },
        });
        return rows.map((r) => ({ userId: r.userId, sum: r._sum.amount ?? 0 }));
      },
      [] as { userId: string; sum: number }[],
    );
    const weeklyMap = new Map(weekly.map((w) => [w.userId, w.sum]));

    const todayDeliveries = await safe(
      "delivery.groupBy today",
      async () => {
        const rows = await prisma.delivery.groupBy({
          by: ["userId"],
          where: {
            deliveredAt: { gte: dayStart },
            userId: { in: collaboratorIds },
          },
          _sum: { count: true },
        });
        return rows.map((r) => ({ userId: r.userId, n: r._sum.count ?? 0 }));
      },
      [] as { userId: string; n: number }[],
    );
    const todayMap = new Map(todayDeliveries.map((t) => [t.userId, t.n]));

    const weekDeliveries = await safe(
      "delivery.groupBy week",
      async () => {
        const rows = await prisma.delivery.groupBy({
          by: ["userId"],
          where: {
            deliveredAt: { gte: weekStart },
            userId: { in: collaboratorIds },
          },
          _sum: { count: true },
        });
        return rows.map((r) => ({ userId: r.userId, n: r._sum.count ?? 0 }));
      },
      [] as { userId: string; n: number }[],
    );
    const weekMap = new Map(weekDeliveries.map((w) => [w.userId, w.n]));

    const goalsCounts = await safe(
      "goal.groupBy concluidas",
      async () => {
        const rows = await prisma.goal.groupBy({
          by: ["ownerId"],
          where: {
            status: "CONCLUIDA",
            seasonId: season.id,
            ownerId: { in: collaboratorIds },
          },
          _count: { _all: true },
        });
        return rows.map((r) => ({ userId: r.ownerId, n: r._count._all }));
      },
      [] as { userId: string; n: number }[],
    );
    const goalsMap = new Map(goalsCounts.map((g) => [g.userId, g.n]));

    members = collaboratorUsers
      .map((u) => {
        const xp = totalsMap.get(u.id) ?? 0;
        return {
          userId: u.id,
          name: u.name,
          area: u.area,
          avatarUrl: u.avatarUrl,
          xp,
          weekXp: weeklyMap.get(u.id) ?? 0,
          todayCount: todayMap.get(u.id) ?? 0,
          weekCount: weekMap.get(u.id) ?? 0,
          goalsBeaten: goalsMap.get(u.id) ?? 0,
          level: Math.floor(xp / 1000) + 1,
        };
      })
      .sort((a, b) => b.xp - a.xp);

    totalSeasonXp = members.reduce((s, m) => s + m.xp, 0);
    totalDeliveriesToday = members.reduce((s, m) => s + m.todayCount, 0);
    totalDeliveriesWeek = members.reduce((s, m) => s + m.weekCount, 0);
    totalGoalsBeaten = members.reduce((s, m) => s + m.goalsBeaten, 0);
    avgLevel = members.length
      ? Math.round((members.reduce((s, m) => s + m.level, 0) / members.length) * 10) / 10
      : 0;
  }

  type MuralEventWithUser = Awaited<
    ReturnType<typeof prisma.muralEvent.findMany<{
      include: { user: { select: { name: true; avatarUrl: true } } };
    }>>
  >;
  const events = await safe<MuralEventWithUser>(
    "muralEvent.findMany",
    () =>
      prisma.muralEvent.findMany({
        where: { user: { role: "COLABORADOR" } },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { name: true, avatarUrl: true } } },
      }),
    [],
  );

  const activity: ActivityEvent[] = events.map((ev) => {
    const payload = ev.payload as { text?: string; emoji?: string } | null;
    return {
      id: ev.id,
      type: ev.type,
      userName: ev.user.name,
      avatarUrl: ev.user.avatarUrl ?? null,
      text: payload?.text ?? "—",
      emoji: payload?.emoji ?? "",
      createdAt: ev.createdAt.toISOString(),
    };
  });

  return (
    <TeamDashboard
      members={members}
      activity={activity}
      totalSeasonXp={totalSeasonXp}
      totalDeliveriesToday={totalDeliveriesToday}
      totalDeliveriesWeek={totalDeliveriesWeek}
      totalGoalsBeaten={totalGoalsBeaten}
      avgLevel={avgLevel}
      seasonNumber={seasonNumber}
      daysLeftInSeason={daysLeftInSeason}
    />
  );
}
