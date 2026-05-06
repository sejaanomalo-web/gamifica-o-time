import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  ENTREGUE: "Entregue",
  REJEITADO: "Rejeitado",
};

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: "#8A7850",
  APROVADO: "#C9953A",
  ENTREGUE: "#E0B25A",
  REJEITADO: "#fb2c36",
};

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[loja/resgates] ${label} failed:`, err);
    return fallback;
  }
}

export default async function ResgatesHistoryPage() {
  const user = await requireAppUser();
  type RedeemWithItem = Awaited<
    ReturnType<typeof prisma.redeem.findMany<{ include: { item: true } }>>
  >;
  const redeems = await safe<RedeemWithItem>(
    "redeem.findMany",
    () =>
      prisma.redeem.findMany({
        where: { userId: user.id },
        include: { item: true },
        orderBy: { createdAt: "desc" },
      }),
    [],
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      <Reveal>
        <Link
          href="/loja"
          className="label-caps label-caps-muted hover:text-[#C9953A] inline-block transition-colors"
        >
          ← Loja
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
          Seus<br />
          <span
            className="text-[#C9953A]"
            style={{
              fontWeight: 300,
              fontStyle: "italic",
              textTransform: "lowercase",
              letterSpacing: "-0.02em",
            }}
          >
            resgates.
          </span>
        </h1>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-10 ano-card-flat overflow-hidden">
          {redeems.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center">Nenhum resgate ainda.</p>
          ) : (
            redeems.map((r, i) => (
              <div
                key={r.id}
                className="px-5 py-4 flex items-center justify-between"
                style={{
                  borderBottom: i < redeems.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <div>
                  <div className="text-white text-sm font-semibold">{r.item.name}</div>
                  <span className="label-caps label-caps-muted text-[10px] mt-1 block text-mono">
                    {r.createdAt.toLocaleDateString("pt-BR")} · −{r.costXp} XP
                  </span>
                </div>
                <span
                  className="label-caps px-3 py-1.5 rounded-full"
                  style={{
                    color: STATUS_COLOR[r.status] ?? "#FFF",
                    background: "rgba(201,149,58,0.06)",
                    boxShadow: `inset 0 0 0 1px ${STATUS_COLOR[r.status] ?? "rgba(255,255,255,0.18)"}40`,
                  }}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
            ))
          )}
        </div>
      </Reveal>
    </div>
  );
}
