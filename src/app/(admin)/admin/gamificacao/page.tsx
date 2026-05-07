// /admin/gamificacao — gestão de temporadas (e regras futuras).
// Hoje foca em CRUD de Season — criar/encerrar/estender prazo/remover.

import { prisma } from "@/lib/prisma";
import { SeasonManager, type SeasonRow } from "@/components/feature/admin/SeasonManager";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/gamificacao] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GamificacaoPage() {
  const seasons = await safe(
    "season.findMany",
    () => prisma.season.findMany({ orderBy: { number: "desc" } }),
    [] as Awaited<ReturnType<typeof prisma.season.findMany>>,
  );

  // Conta XP e metas por temporada (em paralelo)
  const counts = await safe(
    "counts",
    async () => {
      const [xpRows, goalRows] = await Promise.all([
        prisma.xpEvent.groupBy({ by: ["seasonId"], _count: { _all: true } }),
        prisma.goal.groupBy({ by: ["seasonId"], _count: { _all: true } }),
      ]);
      const xpMap = new Map(xpRows.map((r) => [r.seasonId, r._count._all]));
      const goalMap = new Map(goalRows.map((r) => [r.seasonId, r._count._all]));
      return { xpMap, goalMap };
    },
    { xpMap: new Map<string, number>(), goalMap: new Map<string, number>() },
  );

  const rows: SeasonRow[] = seasons.map((s) => ({
    id: s.id,
    number: s.number,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    isActive: s.isActive,
    xpCount: counts.xpMap.get(s.id) ?? 0,
    goalsCount: counts.goalMap.get(s.id) ?? 0,
  }));

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
      <span className="label-caps mb-3 block">Admin · Regras</span>
      <h1
        className="text-white mb-4"
        style={{
          fontWeight: 900,
          fontSize: "clamp(2.25rem, 6vw, 2.75rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        Gami<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          ficação.
        </span>
      </h1>
      <p className="text-mid text-sm mb-10 max-w-md">
        Configura as temporadas do game. Cada temporada tem seu próprio ranking,
        XP acumulado e metas — quando encerra, a próxima começa do zero.
      </p>

      <SeasonManager seasons={rows} />
    </div>
  );
}
