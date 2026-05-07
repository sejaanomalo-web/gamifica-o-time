// /admin/metas — gestão de metas. Filtro por período (Mês/Ano/Tudo).
// Tabela mostra metas que valem no período selecionado, com escopo
// (Permanente/Mensal/Anual). Clicar em uma linha abre o GoalEditorDialog.

import { prisma } from "@/lib/prisma";
import { PeriodPicker } from "@/components/layout/PeriodPicker";
import { parsePeriod } from "@/lib/period";
import { AdminGoalsTable, type AdminGoalRow } from "@/components/feature/admin/AdminGoalsTable";
import { isValidRewardConfig, type RewardConfig } from "@/lib/tiers";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/metas] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ p?: string }>;
}

export default async function AdminMetasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = parsePeriod(params.p);

  // Filtro por escopo/período pra tabela.
  // - mode="all": tudo
  // - mode="month": MONTHLY do mês + PERMANENT (admin precisa ver os dois)
  // - mode="year": YEARLY do ano + PERMANENT
  const where: Record<string, unknown> = {};
  if (period.mode === "month" && period.monthISO) {
    where.OR = [
      { scope: "MONTHLY", monthISO: period.monthISO },
      { scope: "PERMANENT" },
    ];
  } else if (period.mode === "year" && period.yearISO) {
    where.OR = [
      { scope: "YEARLY", yearISO: period.yearISO },
      { scope: "PERMANENT" },
    ];
  }

  type GoalWithOwner = Awaited<
    ReturnType<typeof prisma.goal.findMany<{ include: { owner: { select: { name: true } } } }>>
  >;
  const goalsRaw = await safe<GoalWithOwner>(
    "goal.findMany",
    () =>
      prisma.goal.findMany({
        where,
        include: { owner: { select: { name: true } } },
        orderBy: [{ scope: "asc" }, { deadline: "asc" }],
        take: 200,
      }),
    [],
  );

  const collaborators = await safe(
    "user.findMany collaborators",
    () =>
      prisma.user.findMany({
        where: { role: "COLABORADOR" },
        select: { id: true, name: true, area: true },
        orderBy: { name: "asc" },
      }),
    [] as Array<{ id: string; name: string; area: string | null }>,
  );

  const goals: AdminGoalRow[] = goalsRaw.map((g) => {
    const rc =
      g.rewardConfig && isValidRewardConfig(g.rewardConfig)
        ? (g.rewardConfig as RewardConfig)
        : null;
    return {
      id: g.id,
      ownerId: g.ownerId,
      ownerName: g.owner.name,
      title: g.title,
      description: g.description,
      kpi: g.kpi,
      target: g.target,
      current: g.current,
      deadline: g.deadline.toISOString(),
      xpReward: g.xpReward,
      needsEvidence: g.needsEvidence,
      status: g.status,
      scope: g.scope,
      monthISO: g.monthISO,
      yearISO: g.yearISO,
      rewardConfig: rc,
    };
  });

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-6xl mx-auto w-full">
      <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
        <div>
          <span className="label-caps mb-3 block">Admin · Catálogo</span>
          <h1
            className="text-white"
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.25rem, 6vw, 2.75rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            Metas<br />
            <span
              className="text-[#C9953A]"
              style={{
                fontWeight: 300,
                fontStyle: "italic",
                textTransform: "lowercase",
                letterSpacing: "-0.02em",
              }}
            >
              do time.
            </span>
          </h1>
        </div>
        <PeriodPicker param={params.p ?? ""} />
      </div>

      <AdminGoalsTable goals={goals} collaborators={collaborators} />

      <p className="mt-6 text-faint text-xs">
        <strong className="text-mid">Permanente</strong> vale como padrão pra todo o período.
        <strong className="text-mid"> Mensal</strong> e
        <strong className="text-mid"> Anual</strong> substituem a permanente apenas no período selecionado.
      </p>
    </div>
  );
}
