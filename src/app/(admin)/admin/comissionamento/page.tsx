import { prisma } from "@/lib/prisma";
import { calculateCommission, formatCents } from "@/lib/commission";

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/comissionamento] ${label} failed:`, err);
    return fallback;
  }
}

export default async function AdminComissionamentoPage() {
  const monthIso = currentMonthISO();
  const monthStart = new Date(`${monthIso}-01T00:00:00`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

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
    () => prisma.deliveryWeight.findMany({ where: { active: true }, orderBy: { weight: "desc" } }),
    [] as Awaited<ReturnType<typeof prisma.deliveryWeight.findMany>>,
  );
  const history = await safe<HistoryWithUser>(
    "commissionMonth.findMany",
    () =>
      prisma.commissionMonth.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { closedAt: "desc" },
        take: 60,
      }),
    [],
  );

  const previews = await Promise.all(
    tiers.map(async (t) => {
      const [delivAgg, adjAgg] = await Promise.all([
        prisma.delivery
          .aggregate({
            where: { userId: t.userId, deliveredAt: { gte: monthStart, lt: monthEnd } },
            _sum: { pointsApplied: true },
          })
          .catch(() => ({ _sum: { pointsApplied: 0 } })),
        prisma.adjustment
          .aggregate({
            where: { userId: t.userId, createdAt: { gte: monthStart, lt: monthEnd } },
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

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-6xl mx-auto w-full">
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
      <p className="text-mid text-sm mt-4 max-w-md mb-10">
        Configura, registra entregas e fecha o mês.
      </p>

      <section className="mb-10">
        <h2 className="label-caps label-caps-muted mb-3">Preview do mês corrente</h2>
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
        <h2 className="label-caps label-caps-muted mb-3">Pesos das categorias</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {weights.map((w) => (
            <div key={w.id} className="ano-card p-5">
              <span className="label-caps mb-2 block text-[10px]">{w.group}</span>
              <p className="text-white text-base font-semibold">{w.category}</p>
              <p className="mt-2 text-[#C9953A] text-mono font-bold" style={{ fontSize: 18 }}>
                {w.weight.toFixed(1)}×
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="label-caps label-caps-muted mb-3">Histórico</h2>
        <div className="ano-card-flat overflow-hidden">
          {history.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center">Nenhum mês fechado ainda.</p>
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
