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
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      <Reveal>
        <Link
          href="/perfil"
          className="label-caps label-caps-muted hover:text-[#C9953A] inline-block transition-colors"
        >
          ← Perfil
        </Link>
        <h1
          className="mt-5 text-white"
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.25rem, 7vw, 3rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          }}
        >
          Sua<br />
          <span
            className="text-[#C9953A]"
            style={{
              fontWeight: 300,
              fontStyle: "italic",
              textTransform: "lowercase",
              letterSpacing: "-0.02em",
            }}
          >
            comissão.
          </span>
        </h1>
        <p className="mt-4 text-mid text-sm">
          {monthLabel(monthIso)} · Em curso.
        </p>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="ano-card-flat p-6">
            <span className="label-caps label-caps-muted block mb-3">Pontos do mês</span>
            <span
              className="text-mono text-white"
              style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              <CountUp value={Math.round(netPoints * 10) / 10} decimals={1} />
            </span>
          </div>
          <div className="ano-card-flat p-6">
            <span className="label-caps label-caps-muted block mb-3">Tier atual</span>
            <span className="label-caps text-base" style={{ fontSize: 14, color: "#C9953A" }}>
              {TIER_LABEL[result.tierReached]}
            </span>
          </div>
          <div className="ano-card-flat p-6">
            <span className="label-caps label-caps-muted block mb-3">Bônus estimado</span>
            <span
              className="text-mono text-[#C9953A]"
              style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              {formatCents(result.bonusValueCents)}
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={350}>
        <div className="mt-8 ano-card-flat p-6">
          <CommissionTierTrack tier={tier} netPoints={netPoints} />
          {next.nextMarker !== null && (
            <p className="mt-5 text-sm text-mid">
              Faltam{" "}
              <span className="text-mono text-[#C9953A]" style={{ fontWeight: 700 }}>
                {Math.max(0, Math.ceil(next.nextMarker - netPoints))}
              </span>{" "}
              pontos pra <span className="text-[#C9953A] font-semibold">{next.nextLabel}</span>.
            </p>
          )}
        </div>
      </Reveal>

      <Reveal delay={500}>
        <section className="mt-10">
          <h2 className="label-caps label-caps-muted mb-3">
            Suas entregas em {monthLabel(monthIso)}
          </h2>
          <div className="ano-card-flat overflow-hidden">
            {deliveries.length === 0 ? (
              <p className="text-faint text-sm py-10 text-center">
                Sem entregas registradas esse mês.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th className="text-left px-5 py-3 label-caps label-caps-muted">Data</th>
                    <th className="text-left px-5 py-3 label-caps label-caps-muted">Categoria</th>
                    <th className="text-right px-5 py-3 label-caps label-caps-muted">Qtd</th>
                    <th className="text-right px-5 py-3 label-caps label-caps-muted">Peso</th>
                    <th className="text-right px-5 py-3 label-caps label-caps-muted">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d, i) => (
                    <tr
                      key={d.id}
                      className={i < deliveries.length - 1 ? "" : ""}
                      style={{
                        borderBottom: i < deliveries.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}
                    >
                      <td className="px-5 py-3 text-mid text-mono">
                        {d.deliveredAt.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-white">{d.weight.category}</td>
                      <td className="px-5 py-3 text-right text-white text-mono">{d.count}</td>
                      <td className="px-5 py-3 text-right text-mid text-mono">
                        {d.weight.weight.toFixed(1)}×
                      </td>
                      <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
                        {d.pointsApplied.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "rgba(201,149,58,0.04)" }}>
                    <td colSpan={4} className="px-5 py-3 label-caps">
                      Total bruto
                    </td>
                    <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
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
        <section className="mt-8">
          <h2 className="label-caps label-caps-muted mb-3">Ajustes registrados</h2>
          <div className="ano-card-flat overflow-hidden">
            {adjustments.length === 0 ? (
              <p className="text-faint text-sm py-10 text-center">
                Sem ajustes esse mês. Mantém assim.
              </p>
            ) : (
              adjustments.map((a, i) => (
                <div
                  key={a.id}
                  className="px-5 py-4 flex items-center justify-between"
                  style={{
                    borderBottom: i < adjustments.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div>
                    <div className="text-white text-sm">{a.reason}</div>
                    <span className="label-caps label-caps-muted text-[10px] mt-1 block">
                      {a.createdAt.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <span className="text-[#fb2c36] text-mono font-bold text-sm">
                    −{a.pointsDeducted.toFixed(1)} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </Reveal>

      <Reveal delay={800}>
        <details
          className="mt-8 ano-card-flat p-5"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
        >
          <summary className="label-caps cursor-pointer select-none">
            Como funciona o cálculo?
          </summary>
          <table className="w-full mt-4 text-sm">
            <thead>
              <tr>
                <th className="text-left label-caps label-caps-muted py-2">Categoria</th>
                <th className="text-right label-caps label-caps-muted py-2">Peso</th>
              </tr>
            </thead>
            <tbody>
              {weights.map((w, i) => (
                <tr
                  key={w.id}
                  style={{
                    borderBottom: i < weights.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <td className="text-white py-2.5">{w.category}</td>
                  <td className="text-right text-[#C9953A] text-mono py-2.5">{w.weight.toFixed(1)}×</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-faint">
            Pontos da entrega = quantidade × peso. Cada ajuste deduz 5 pts.
          </p>
        </details>
      </Reveal>

      <Reveal delay={950}>
        <section className="mt-10">
          <h2 className="label-caps label-caps-muted mb-3">Meses anteriores</h2>
          {history.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center ano-card-flat">
              Nenhum mês fechado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {history.map((m) => (
                <div key={m.id} className="ano-card p-5">
                  <span className="label-caps label-caps-muted block mb-1">
                    {monthLabel(m.monthISO)}
                  </span>
                  <span className="label-caps block text-[10px] mb-3">
                    {TIER_LABEL[m.tierReached]}
                  </span>
                  <span
                    className="text-mono text-white block"
                    style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}
                  >
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
