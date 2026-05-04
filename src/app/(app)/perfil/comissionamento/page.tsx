import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { CommissionTierTrack } from "@/components/feature/commission/CommissionTierTrack";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { calculateCommission, formatCents, pointsToNextMarker } from "@/lib/commission";

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
}

export default async function ComissionamentoPage() {
  const user = await requireAppUser();
  const tier = await prisma.commissionTier.findUnique({ where: { userId: user.id } });

  if (!tier) {
    return (
      <div className="px-5 md:px-8 py-6 md:py-10 max-w-3xl mx-auto w-full">
        <Link href="/perfil" className="label-caps text-anomalo-sand hover:text-anomalo-gold">
          ← Perfil
        </Link>
        <h1 className="mt-4 text-h2 uppercase">Comissionamento.</h1>
        <p className="mt-6 text-anomalo-sand text-sm">
          Seu plano de comissionamento ainda não foi configurado. Fale com o admin.
        </p>
      </div>
    );
  }

  const monthIso = currentMonthISO();
  const monthStart = new Date(`${monthIso}-01T00:00:00`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const [deliveries, adjustments, weights, history] = await Promise.all([
    prisma.delivery.findMany({
      where: {
        userId: user.id,
        deliveredAt: { gte: monthStart, lt: monthEnd },
      },
      include: { weight: true },
      orderBy: { deliveredAt: "desc" },
    }),
    prisma.adjustment.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deliveryWeight.findMany({ where: { active: true }, orderBy: { weight: "desc" } }),
    prisma.commissionMonth.findMany({
      where: { userId: user.id },
      orderBy: { closedAt: "desc" },
      take: 6,
    }),
  ]);

  const grossPoints = deliveries.reduce((s, d) => s + d.pointsApplied, 0);
  const adjustmentsTotal = adjustments.reduce((s, a) => s + a.pointsDeducted, 0);
  const netPoints = Math.max(0, grossPoints - adjustmentsTotal);
  const result = calculateCommission(netPoints, tier);
  const next = pointsToNextMarker(netPoints, tier);

  const TIER_LABEL: Record<string, string> = {
    BASE: "Base",
    META_1: "Meta 1",
    META_2: "Meta 2",
    EXCELENCIA: "Excelência",
  };

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-3xl mx-auto w-full">
      <Reveal>
        <Link href="/perfil" className="label-caps text-anomalo-sand hover:text-anomalo-gold">
          ← Perfil
        </Link>
        <h1 className="mt-4 text-h2 uppercase text-anomalo-white" style={{ letterSpacing: "-0.01em" }}>
          Comissionamento.
        </h1>
        <p className="mt-3 text-anomalo-sand text-sm">
          {monthLabel(monthIso)} · Em curso.
        </p>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-px bg-anomalo-gold-hair border border-anomalo-gold-hair">
          <div className="bg-anomalo-black p-5">
            <span className="label-caps text-anomalo-sand block mb-2">Pontos do mês</span>
            <span className="font-black text-anomalo-white text-3xl tabular-nums">
              <CountUp value={Math.round(netPoints * 10) / 10} decimals={1} />
            </span>
          </div>
          <div className="bg-anomalo-black p-5">
            <span className="label-caps text-anomalo-sand block mb-2">Tier atual</span>
            <span className="label-caps text-anomalo-gold text-base">
              {TIER_LABEL[result.tierReached]}
            </span>
          </div>
          <div className="bg-anomalo-black p-5">
            <span className="label-caps text-anomalo-sand block mb-2">Bônus estimado</span>
            <span className="font-black text-anomalo-gold text-3xl tabular-nums">
              {formatCents(result.bonusValueCents)}
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={350}>
        <div className="mt-8">
          <CommissionTierTrack tier={tier} netPoints={netPoints} />
          {next.nextMarker !== null && (
            <p className="mt-4 text-sm text-anomalo-sand">
              Faltam{" "}
              <span className="text-anomalo-gold font-bold tabular-nums">
                {Math.max(0, Math.ceil(next.nextMarker - netPoints))}
              </span>{" "}
              pontos pra <span className="text-anomalo-gold">{next.nextLabel}</span>.
            </p>
          )}
        </div>
      </Reveal>

      <Reveal delay={500}>
        <section className="mt-10">
          <h2 className="label-caps text-anomalo-sand mb-3">
            Suas entregas em {monthLabel(monthIso)}
          </h2>
          <div className="border border-anomalo-gold-hair">
            {deliveries.length === 0 ? (
              <p className="text-anomalo-muted text-sm py-6 text-center">
                Sem entregas registradas esse mês.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-anomalo-gold-hair">
                    <th className="text-left px-4 py-2.5 label-caps text-anomalo-sand text-[10px]">Data</th>
                    <th className="text-left px-4 py-2.5 label-caps text-anomalo-sand text-[10px]">Categoria</th>
                    <th className="text-right px-4 py-2.5 label-caps text-anomalo-sand text-[10px]">Qtd</th>
                    <th className="text-right px-4 py-2.5 label-caps text-anomalo-sand text-[10px]">Peso</th>
                    <th className="text-right px-4 py-2.5 label-caps text-anomalo-sand text-[10px]">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5 text-anomalo-sand tabular-nums">
                        {d.deliveredAt.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-2.5 text-anomalo-white">{d.weight.category}</td>
                      <td className="px-4 py-2.5 text-right text-anomalo-white tabular-nums">{d.count}</td>
                      <td className="px-4 py-2.5 text-right text-anomalo-sand tabular-nums">{d.weight.weight.toFixed(1)}×</td>
                      <td className="px-4 py-2.5 text-right text-anomalo-gold tabular-nums font-bold">
                        {d.pointsApplied.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-anomalo-surface">
                    <td colSpan={4} className="px-4 py-2.5 label-caps text-anomalo-sand">
                      Total bruto
                    </td>
                    <td className="px-4 py-2.5 text-right text-anomalo-gold tabular-nums font-bold">
                      {grossPoints.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </section>
      </Reveal>

      <Reveal delay={650}>
        <section className="mt-10">
          <h2 className="label-caps text-anomalo-sand mb-3">Ajustes registrados</h2>
          <div className="border border-anomalo-gold-hair">
            {adjustments.length === 0 ? (
              <p className="text-anomalo-muted text-sm py-6 text-center">
                Sem ajustes esse mês. Mantém assim.
              </p>
            ) : (
              adjustments.map((a) => (
                <div
                  key={a.id}
                  className="border-b border-white/5 last:border-0 px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-anomalo-white text-sm">{a.reason}</div>
                    <span className="label-caps text-anomalo-muted text-[10px]">
                      {a.createdAt.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <span className="text-red-400 tabular-nums font-bold text-sm">
                    −{a.pointsDeducted.toFixed(1)} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </Reveal>

      <Reveal delay={800}>
        <details className="mt-10 border border-anomalo-gold-hair p-4">
          <summary className="label-caps text-anomalo-gold cursor-pointer">
            Como funciona o cálculo?
          </summary>
          <table className="w-full mt-4 text-sm">
            <thead>
              <tr>
                <th className="text-left label-caps text-anomalo-sand py-2">Categoria</th>
                <th className="text-right label-caps text-anomalo-sand py-2">Peso</th>
              </tr>
            </thead>
            <tbody>
              {weights.map((w) => (
                <tr key={w.id} className="border-b border-white/5 last:border-0">
                  <td className="text-anomalo-white py-2">{w.category}</td>
                  <td className="text-right text-anomalo-gold tabular-nums">{w.weight.toFixed(1)}×</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-anomalo-muted">
            Pontos da entrega = quantidade × peso. Cada ajuste deduz 5 pts.
          </p>
        </details>
      </Reveal>

      <Reveal delay={950}>
        <section className="mt-10">
          <h2 className="label-caps text-anomalo-sand mb-3">Meses anteriores</h2>
          {history.length === 0 ? (
            <p className="text-anomalo-muted text-sm py-6 text-center border border-anomalo-gold-hair">
              Nenhum mês fechado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {history.map((m) => (
                <div key={m.id} className="border border-anomalo-gold-hair p-4">
                  <span className="label-caps text-anomalo-sand block mb-1">
                    {monthLabel(m.monthISO)}
                  </span>
                  <span className="label-caps text-anomalo-gold block text-[10px] mb-2">
                    {TIER_LABEL[m.tierReached]}
                  </span>
                  <span className="font-bold text-anomalo-white text-base tabular-nums">
                    {formatCents(m.bonusValue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}
