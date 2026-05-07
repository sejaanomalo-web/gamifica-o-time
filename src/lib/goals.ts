// Resolver de metas por período + utils.
//
// Regras (alinhadas com o user em 2026-05-07):
// - PERMANENT vale como padrão pra todo período do colaborador.
// - MONTHLY substitui a permanente APENAS no monthISO selecionado.
//   Se houver QUALQUER MONTHLY no período do user, a permanente NÃO aparece.
// - YEARLY idem pra yearISO.
// - period.mode === "all" → mostra TODAS as metas (permanent + monthly + yearly).

import { prisma } from "@/lib/prisma";
import type { ParsedPeriod } from "@/lib/period";
import type { Goal, GoalScope } from "@/generated/prisma/client";

export interface ResolveOpts {
  userId: string;
  period: ParsedPeriod;
  status?: "ATIVA" | "CONCLUIDA" | "NAO_BATIDA" | "AGUARDANDO_VALIDACAO" | "REJEITADA";
}

/**
 * Retorna a lista de metas que valem para o usuário no período.
 * - "all": todas as metas dele.
 * - "month": MONTHLY do mês se houver, senão PERMANENT.
 * - "year": YEARLY do ano se houver, senão PERMANENT.
 */
export async function resolveGoalsForPeriod({
  userId,
  period,
  status,
}: ResolveOpts): Promise<Goal[]> {
  const baseWhere = {
    ownerId: userId,
    ...(status ? { status } : {}),
  };

  if (period.mode === "all") {
    return prisma.goal.findMany({
      where: baseWhere,
      orderBy: { deadline: "asc" },
    });
  }

  if (period.mode === "month" && period.monthISO) {
    const monthly = await prisma.goal.findMany({
      where: { ...baseWhere, scope: "MONTHLY", monthISO: period.monthISO },
      orderBy: { deadline: "asc" },
    });
    if (monthly.length > 0) return monthly;
    return prisma.goal.findMany({
      where: { ...baseWhere, scope: "PERMANENT" },
      orderBy: { deadline: "asc" },
    });
  }

  if (period.mode === "year" && period.yearISO) {
    const yearly = await prisma.goal.findMany({
      where: { ...baseWhere, scope: "YEARLY", yearISO: period.yearISO },
      orderBy: { deadline: "asc" },
    });
    if (yearly.length > 0) return yearly;
    return prisma.goal.findMany({
      where: { ...baseWhere, scope: "PERMANENT" },
      orderBy: { deadline: "asc" },
    });
  }

  return [];
}

/**
 * Resolve em batch pra múltiplos usuários (usado em /equipe).
 * Retorna Map<userId, Goal[]>.
 */
export async function resolveGoalsBatchForPeriod(
  userIds: string[],
  period: ParsedPeriod,
  status?: ResolveOpts["status"],
): Promise<Map<string, Goal[]>> {
  const out = new Map<string, Goal[]>();
  if (userIds.length === 0) return out;

  if (period.mode === "all") {
    const all = await prisma.goal.findMany({
      where: {
        ownerId: { in: userIds },
        ...(status ? { status } : {}),
      },
      orderBy: { deadline: "asc" },
    });
    for (const id of userIds) out.set(id, []);
    for (const g of all) {
      const arr = out.get(g.ownerId) ?? [];
      arr.push(g);
      out.set(g.ownerId, arr);
    }
    return out;
  }

  // Pra mode mensal/anual, agrupa por user e aplica fallback.
  const scopeWhere =
    period.mode === "month"
      ? { scope: "MONTHLY" as GoalScope, monthISO: period.monthISO ?? undefined }
      : { scope: "YEARLY" as GoalScope, yearISO: period.yearISO ?? undefined };

  const periodSpecific = await prisma.goal.findMany({
    where: {
      ownerId: { in: userIds },
      ...scopeWhere,
      ...(status ? { status } : {}),
    },
    orderBy: { deadline: "asc" },
  });

  const usersWithSpecific = new Set(periodSpecific.map((g) => g.ownerId));
  for (const id of userIds) out.set(id, []);
  for (const g of periodSpecific) {
    const arr = out.get(g.ownerId) ?? [];
    arr.push(g);
    out.set(g.ownerId, arr);
  }

  // Fallback: pega permanente pros users SEM período-específico.
  const usersNeedingPermanent = userIds.filter((id) => !usersWithSpecific.has(id));
  if (usersNeedingPermanent.length > 0) {
    const permanent = await prisma.goal.findMany({
      where: {
        ownerId: { in: usersNeedingPermanent },
        scope: "PERMANENT",
        ...(status ? { status } : {}),
      },
      orderBy: { deadline: "asc" },
    });
    for (const g of permanent) {
      const arr = out.get(g.ownerId) ?? [];
      arr.push(g);
      out.set(g.ownerId, arr);
    }
  }

  return out;
}

/**
 * Calcula o range temporal (start, end) de um período pra usar em
 * filtros de XpEvent.createdAt, Delivery.deliveredAt, Adjustment.createdAt.
 * - "all": null/null = sem filtro
 * - "month"/"year": range do período
 */
export function periodRange(period: ParsedPeriod): { start: Date | null; end: Date | null } {
  return { start: period.start, end: period.end };
}

/**
 * Helper pra montar um where clause com ou sem range (consistência em
 * todas as páginas que filtram por período).
 */
export function dateWhere(field: string, period: ParsedPeriod): Record<string, unknown> {
  if (!period.start || !period.end) return {};
  return { [field]: { gte: period.start, lt: period.end } };
}
