import { prisma } from "@/lib/prisma";
import { calculateCommission, formatCents } from "@/lib/commission";

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminComissionamentoPage() {
  const monthIso = currentMonthISO();
  const monthStart = new Date(`${monthIso}-01T00:00:00`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const [tiers, weights, history] = await Promise.all([
    prisma.commissionTier.findMany({ include: { user: true } }),
    prisma.deliveryWeight.findMany({ where: { active: true }, orderBy: { weight: "desc" } }),
    prisma.commissionMonth.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { closedAt: "desc" },
      take: 60,
    }),
  ]);

  // current-month preview per collaborator
  const previews = await Promise.all(
    tiers.map(async (t) => {
      const [delivAgg, adjAgg] = await Promise.all([
        prisma.delivery.aggregate({
          where: {
            userId: t.userId,
            deliveredAt: { gte: monthStart, lt: monthEnd },
          },
          _sum: { pointsApplied: true },
        }),
        prisma.adjustment.aggregate({
          where: {
            userId: t.userId,
            createdAt: { gte: monthStart, lt: monthEnd },
          },
          _sum: { pointsDeducted: true },
        }),
      ]);
      const gross = delivAgg._sum.pointsApplied ?? 0;
      const adj = adjAgg._sum.pointsDeducted ?? 0;
      const net = Math.max(0, gross - adj);
      const result = calculateCommission(net, t);
      return { user: t.user, gross, adj, net, ...result };
    }),
  );

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full">
      <h1 className="text-h2 uppercase text-anomalo-white mb-2">Comissionamento.</h1>
      <p className="text-anomalo-sand text-sm mb-8">
        Configura, registra entregas e fecha o mês.
      </p>

      <section className="mb-10">
        <h2 className="label-caps text-anomalo-sand mb-3">Preview do mês corrente</h2>
        <div className="border border-anomalo-gold-hair">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-anomalo-gold-hair">
                <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Colaborador</th>
                <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">Bruto</th>
                <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">Ajustes</th>
                <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">Líquido</th>
                <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Tier</th>
                <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">Bônus</th>
              </tr>
            </thead>
            <tbody>
              {previews.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-anomalo-muted">Sem colaboradores com tier configurado.</td></tr>
              )}
              {previews.map((p) => (
                <tr key={p.user.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-anomalo-white">{p.user.name}</td>
                  <td className="px-4 py-3 text-right text-anomalo-sand tabular-nums">{p.gross.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-red-400 tabular-nums">−{p.adj.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-anomalo-gold tabular-nums font-bold">{p.net.toFixed(1)}</td>
                  <td className="px-4 py-3 label-caps text-anomalo-gold text-[10px]">{p.tierReached}</td>
                  <td className="px-4 py-3 text-right text-anomalo-gold tabular-nums font-bold">
                    {formatCents(p.bonusValueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="label-caps text-anomalo-sand mb-3">Pesos das categorias</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {weights.map((w) => (
            <div key={w.id} className="border border-anomalo-gold-hair p-4">
              <span className="label-caps text-anomalo-sand mb-1 block text-[10px]">{w.group}</span>
              <p className="text-anomalo-white">{w.category}</p>
              <p className="mt-1 text-anomalo-gold tabular-nums font-bold">{w.weight.toFixed(1)}×</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="label-caps text-anomalo-sand mb-3">Histórico</h2>
        <div className="border border-anomalo-gold-hair">
          {history.length === 0 ? (
            <p className="text-anomalo-muted text-sm py-6 text-center">
              Nenhum mês fechado ainda.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-anomalo-gold-hair">
                  <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Mês</th>
                  <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Colaborador</th>
                  <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">Líquido</th>
                  <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Tier</th>
                  <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">Bônus</th>
                  <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-anomalo-white tabular-nums">{m.monthISO}</td>
                    <td className="px-4 py-3 text-anomalo-sand">{m.user.name}</td>
                    <td className="px-4 py-3 text-right text-anomalo-white tabular-nums">{m.netPoints.toFixed(1)}</td>
                    <td className="px-4 py-3 label-caps text-anomalo-gold text-[10px]">{m.tierReached}</td>
                    <td className="px-4 py-3 text-right text-anomalo-gold tabular-nums font-bold">{formatCents(m.bonusValue)}</td>
                    <td className="px-4 py-3 label-caps text-[10px]" style={{ color: m.status === "PAGO" ? "#C9953A" : "#8A7850" }}>
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
