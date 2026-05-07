import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireAppUser();

  let goals: Awaited<ReturnType<typeof prisma.goal.findMany>> = [];
  try {
    goals = await prisma.goal.findMany({
      where: { ownerId: user.id },
      orderBy: { deadline: "asc" },
    });
  } catch (err) {
    // Migration 004 (Goal.rewardConfig + Goal.monthISO) ainda não aplicada
    // no banco — devolve listas vazias em vez de 500.
    console.error("[api/goals] findMany failed:", err);
    return NextResponse.json({ ativas: [], historico: [], naoBatidas: [] });
  }

  const toCard = (g: typeof goals[number]) => ({
    id: g.id,
    title: g.title,
    area: g.kpi,
    progress: g.current,
    target: g.target,
    daysLeft: Math.max(0, Math.ceil((g.deadline.getTime() - Date.now()) / 86400000)),
    xpReward: g.xpReward,
    status: g.status,
  });

  return NextResponse.json({
    ativas: goals.filter((g) => g.status === "ATIVA").map(toCard),
    historico: goals.filter((g) => g.status === "CONCLUIDA").map(toCard),
    naoBatidas: goals.filter((g) => g.status === "NAO_BATIDA").map(toCard),
  });
}
