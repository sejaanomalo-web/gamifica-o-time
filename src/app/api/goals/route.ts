// GET /api/goals — metas do user logado, filtradas pelo período (?p=...).
// Aplica regra de substituição: MONTHLY/YEARLY substituem PERMANENT
// no período selecionado. Quando ?p=all, mostra tudo.

import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { resolveGoalsForPeriod } from "@/lib/goals";
import { parsePeriod } from "@/lib/period";

export async function GET(req: Request) {
  const user = await requireAppUser();

  const { searchParams } = new URL(req.url);
  const period = parsePeriod(searchParams.get("p"));

  let goals: Awaited<ReturnType<typeof resolveGoalsForPeriod>> = [];
  try {
    goals = await resolveGoalsForPeriod({ userId: user.id, period });
  } catch (err) {
    // Migration 005 (scope/yearISO) ou 004 (rewardConfig/monthISO) não
    // aplicada — devolve listas vazias em vez de 500.
    console.error("[api/goals] resolveGoalsForPeriod failed:", err);
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
    scope: g.scope,
  });

  return NextResponse.json({
    ativas: goals.filter((g) => g.status === "ATIVA").map(toCard),
    historico: goals.filter((g) => g.status === "CONCLUIDA").map(toCard),
    naoBatidas: goals.filter((g) => g.status === "NAO_BATIDA").map(toCard),
  });
}
