import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

export default async function LojaPage() {
  const user = await requireAppUser();
  const [items, xpTotalAgg, redeemTotalAgg] = await Promise.all([
    prisma.shopItem.findMany({ where: { active: true }, orderBy: { costXp: "asc" } }),
    prisma.xpEvent.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
    prisma.redeem.aggregate({
      where: { userId: user.id, status: { not: "REJEITADO" } },
      _sum: { costXp: true },
    }),
  ]);
  const balance = (xpTotalAgg._sum.amount ?? 0) - (redeemTotalAgg._sum.costXp ?? 0);

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-4xl mx-auto w-full">
      <Reveal>
        <span className="label-caps text-anomalo-gold mb-3 block">Anômalo · Loja</span>
        <div className="flex items-end justify-between gap-6">
          <h1
            className="text-anomalo-white"
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            Resgate.
          </h1>
          <div className="text-right">
            <span className="label-caps text-anomalo-sand block mb-1">Saldo</span>
            <span className="font-black text-anomalo-gold tabular-nums" style={{ fontSize: "2rem" }}>
              <CountUp value={Math.max(0, balance)} duration={1.4} />
              <span className="label-caps text-anomalo-sand ml-2">XP</span>
            </span>
          </div>
        </div>
        <Link
          href="/loja/resgates"
          className="label-caps text-anomalo-gold hover:underline mt-3 inline-block"
        >
          Histórico de resgates →
        </Link>
      </Reveal>

      <Reveal delay={250}>
        <div className="mt-10">
          {items.length === 0 ? (
            <p className="text-anomalo-muted text-sm py-12 text-center border border-anomalo-gold-hair">
              Nenhum prêmio cadastrado. Admin define em /admin/gamificacao.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-anomalo-gold-hair border border-anomalo-gold-hair">
              {items.map((it) => {
                const enough = balance >= it.costXp;
                return (
                  <div key={it.id} className="bg-anomalo-black p-6 flex flex-col">
                    <div className="flex-1">
                      <h3 className="font-bold text-anomalo-white text-base mb-2">{it.name}</h3>
                      {it.description && (
                        <p className="text-anomalo-sand text-xs leading-relaxed">
                          {it.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="label-caps text-anomalo-gold tabular-nums">
                        {it.costXp.toLocaleString("pt-BR")} XP
                      </span>
                      <button
                        disabled={!enough}
                        className="label-caps px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        style={{
                          background: enough ? "#C9953A" : "transparent",
                          color: enough ? "#000" : "#5A4A2A",
                          border: enough ? "none" : "1px solid #5A4A2A",
                        }}
                      >
                        {enough ? "Resgatar" : `Faltam ${it.costXp - balance} XP`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
