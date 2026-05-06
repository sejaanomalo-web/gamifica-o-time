import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[loja] ${label} failed:`, err);
    return fallback;
  }
}

export default async function LojaPage() {
  const user = await requireAppUser();
  const items = await safe(
    "shopItem.findMany",
    () => prisma.shopItem.findMany({ where: { active: true }, orderBy: { costXp: "asc" } }),
    [] as Awaited<ReturnType<typeof prisma.shopItem.findMany>>,
  );
  const xpTotalAgg = await safe(
    "xpEvent.aggregate",
    () => prisma.xpEvent.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
    { _sum: { amount: 0 } },
  );
  const redeemTotalAgg = await safe(
    "redeem.aggregate",
    () =>
      prisma.redeem.aggregate({
        where: { userId: user.id, status: { not: "REJEITADO" } },
        _sum: { costXp: true },
      }),
    { _sum: { costXp: 0 } },
  );
  const balance = (xpTotalAgg._sum.amount ?? 0) - (redeemTotalAgg._sum.costXp ?? 0);

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-4xl mx-auto w-full">
      <Reveal>
        <span className="label-caps mb-3 block">Anômalo · Loja</span>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1
            className="text-white"
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            Loja<br />
            <span
              className="text-[#C9953A]"
              style={{
                fontWeight: 300,
                fontStyle: "italic",
                textTransform: "lowercase",
                letterSpacing: "-0.02em",
              }}
            >
              de recompensas.
            </span>
          </h1>
          <div className="text-right">
            <span className="label-caps label-caps-muted block mb-1">Saldo</span>
            <span
              className="text-mono text-[#C9953A] block"
              style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              <CountUp value={Math.max(0, balance)} duration={1.4} />
              <span className="label-caps label-caps-muted ml-2">XP</span>
            </span>
          </div>
        </div>
        <Link
          href="/loja/resgates"
          className="label-caps text-[#C9953A] hover:text-[#E0B25A] mt-5 inline-block transition-colors"
        >
          Histórico de resgates →
        </Link>
      </Reveal>

      <Reveal delay={250}>
        <div className="mt-10">
          {items.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center ano-card-flat">
              Nenhum prêmio cadastrado. O admin define o catálogo em /admin/gamificacao.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((it) => {
                const enough = balance >= it.costXp;
                return (
                  <div key={it.id} className="ano-card p-6 flex flex-col gap-5">
                    <div className="flex-1">
                      <h3 className="text-white text-base font-semibold mb-2">{it.name}</h3>
                      {it.description && (
                        <p className="text-mid text-sm leading-relaxed">{it.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="label-caps text-mono"
                        style={{ color: "#C9953A", fontSize: 13 }}
                      >
                        {it.costXp.toLocaleString("pt-BR")} XP
                      </span>
                      <button
                        disabled={!enough}
                        className={enough ? "btn-pill btn-gold" : "btn-pill btn-ghost"}
                        style={{
                          height: 40,
                          fontSize: 12,
                          padding: "0 22px",
                          opacity: enough ? 1 : 0.5,
                          cursor: enough ? "pointer" : "not-allowed",
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
