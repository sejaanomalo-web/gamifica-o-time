import { prisma } from "@/lib/prisma";
import { calculateCommission, formatCents } from "@/lib/commission";
import { PeriodPicker } from "@/components/layout/PeriodPicker";
import { parsePeriod } from "@/lib/period";
import {
  DeliveryWeightsEditor,
  type WeightRow,
} from "@/components/feature/admin/DeliveryWeightsEditor";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/comissionamento] ${label} failed:`, err);
    return fallback;
  }
}

interface PageProps {
  searchParams: Promise<{ p?: string }>;
}

export default async function AdminComissionamentoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = parsePeriod(params.p);

  // Range pra preview: usa o período selecionado quando month/year, senão all-time = sem filtro de data
  const periodFilter =
    period.start && period.end ? { gte: period.start, lt: period.end } : undefined;

  type TiersWithUser = Awaited<
    ReturnType<typeof prisma.commissionTier.findMany<{ include: { user: true } }>>
  >;
  type HistoryWithUser = Awaited<
    ReturnType<
      typeof prisma.commissionMonth.findMany<{ include: { user: { select: { name: true } } } }>
    >
  >;

  const tiers = await safe<TiersWithUser>(
    "commissionTier.findMany",
    () => prisma.commissionTier.findMany({ include: { user: true } }),
    [],
  );
  const weights = await safe(
    "deliveryWeight.findMany",
    () =>
      prisma.deliveryWeight.findMany({
        orderBy: [{ active: "desc" }, { weight: "desc" }, { category: "asc" }],
      }),
    [] as Awaited<ReturnType<typeof prisma.deliveryWeight.findMany>>,
  );

  // Histórico: filtra por mês ISO se mês selecionado, prefixo de ano se ano,
  // tudo se all
  const historyWhere: { monthISO?: { startsWith: string } | string } = {};
  if (period.mode === "month" && period.monthISO) {
    historyWhere.monthISO = period.monthISO;
  } else if (period.mode === "year" && period.yearISO) {
    historyWhere.monthISO = { startsWith: period.yearISO };
  }
  const history = await safe<HistoryWithUser>(
    "commissionMonth.findMany",
    () =>
      prisma.commissionMonth.findMany({
        where: historyWhere,
        include: { user: { select: { name: true } } },
        orderBy: { closedAt: "desc" },
        take: 120,
      }),
    [],
  );

  const previews = await Promise.all(
    tiers.map(async (t) => {
      const [delivAgg, adjAgg] = await Promise.all([
        prisma.delivery
          .aggregate({
            where: {
              userId: t.userId,
              ...(periodFilter ? { deliveredAt: periodFilter } : {}),
            },
            _sum: { pointsApplied: true },
          })
          .catch(() => ({ _sum: { pointsApplied: 0 } })),
        prisma.adjustment
          .aggregate({
            where: {
              userId: t.userId,
              ...(periodFilter ? { createdAt: periodFilter } : {}),
            },
            _sum: { pointsDeducted: true },
          })
          .catch(() => ({ _sum: { pointsDeducted: 0 } })),
      ]);
      const gross = delivAgg._sum.pointsApplied ?? 0;
      const adj = adjAgg._sum.pointsDeducted ?? 0;
      const net = Math.max(0, gross - adj);
      const result = calculateCommission(net, t);
      return { user: t.user, gross, adj, net, ...result };
    }),
  );

  const previewLabel =
    period.mode === "all"
      ? "Tudo registrado"
      : period.mode === "year"
        ? `${period.yearISO} acumulado`
        : `${period.label} (em curso)`;

  const historyTotalCents = history.reduce((s, m) => s + m.bonusValue, 0);

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-6xl mx-auto w-full">
      <div className="flex items-end justify-between mb-8 gap-6 flex-wrap">
        <div>
          <span className="label-caps mb-3 block">Admin · Comissão</span>
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
            Comissio<br />
            <span
              className="text-[#C9953A]"
              style={{
                fontWeight: 300,
                fontStyle: "italic",
                textTransform: "lowercase",
                letterSpacing: "-0.02em",
              }}
            >
              namento.
            </span>
          </h1>
          <p className="text-mid text-sm mt-4 max-w-md">
            Configura, registra entregas e acompanha o progresso por mês, ano ou tudo.
          </p>
        </div>
        <PeriodPicker param={params.p ?? ""} />
      </div>

      <section className="mb-10">
        <h2 className="label-caps label-caps-muted mb-3">{previewLabel}</h2>
        <div className="ano-card-flat overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Colaborador</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Bruto</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Ajustes</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Líquido</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Tier</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Bônus</th>
              </tr>
            </thead>
            <tbody>
              {previews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-faint">
                    Sem colaboradores com tier configurado.
                  </td>
                </tr>
              )}
              {previews.map((p, i) => (
                <tr
                  key={p.user.id}
                  style={{
                    borderBottom: i < previews.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <td className="px-5 py-3 text-white">{p.user.name}</td>
                  <td className="px-5 py-3 text-right text-mid text-mono">{p.gross.toFixed(1)}</td>
                  <td className="px-5 py-3 text-right text-[#fb2c36] text-mono">−{p.adj.toFixed(1)}</td>
                  <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
                    {p.net.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 label-caps text-[10px]">{p.tierReached}</td>
                  <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
                    {formatCents(p.bonusValueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <DeliveryWeightsEditor
          rows={weights.map<WeightRow>((w) => ({
            id: w.id,
            category: w.category,
            group: w.group,
            weight: w.weight,
            active: w.active,
          }))}
        />
      </section>

      <section>
        <div className="flex items-end justify-between mb-3 gap-3">
          <h2 className="label-caps label-caps-muted">
            Histórico {period.mode === "all" ? "completo" : period.label}
          </h2>
          {history.length > 0 && (
            <span className="label-caps text-[#C9953A] text-mono">
              Total · {formatCents(historyTotalCents)}
            </span>
          )}
        </div>
        <div className="ano-card-flat overflow-hidden">
          {history.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center">
              Nenhum mês fechado nesse período ainda.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left px-5 py-3 label-caps label-caps-muted">Mês</th>
                  <th className="text-left px-5 py-3 label-caps label-caps-muted">Colaborador</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">Líquido</th>
                  <th className="text-left px-5 py-3 label-caps label-caps-muted">Tier</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">Bônus</th>
                  <th className="text-left px-5 py-3 label-caps label-caps-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((m, i) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <td className="px-5 py-3 text-white text-mono">{m.monthISO}</td>
                    <td className="px-5 py-3 text-mid">{m.user.name}</td>
                    <td className="px-5 py-3 text-right text-white text-mono">
                      {m.netPoints.toFixed(1)}
                    </td>
                    <td className="px-5 py-3 label-caps text-[10px]">{m.tierReached}</td>
                    <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
                      {formatCents(m.bonusValue)}
                    </td>
                    <td
                      className="px-5 py-3 label-caps text-[10px]"
                      style={{ color: m.status === "PAGO" ? "#C9953A" : "#8A7850" }}
                    >
                      {m.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
