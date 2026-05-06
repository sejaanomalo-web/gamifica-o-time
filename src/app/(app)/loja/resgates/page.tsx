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

export default async function ResgatesHistoryPage() {
  const user = await requireAppUser();
  const redeems = await prisma.redeem.findMany({
    where: { userId: user.id },
    include: { item: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-3xl mx-auto w-full">
      <Reveal>
        <Link href="/loja" className="label-caps text-anomalo-sand hover:text-anomalo-gold">
          ← Loja
        </Link>
        <h1 className="mt-4 text-h2 uppercase text-anomalo-white" style={{ letterSpacing: "-0.01em" }}>
          Seus resgates.
        </h1>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-8 border border-anomalo-gold-hair">
          {redeems.length === 0 ? (
            <p className="text-anomalo-muted text-sm py-12 text-center">
              Nenhum resgate ainda.
            </p>
          ) : (
            redeems.map((r) => (
              <div
                key={r.id}
                className="border-b border-white/5 last:border-0 px-4 py-3.5 flex items-center justify-between"
              >
                <div>
                  <div className="text-anomalo-white text-sm font-medium">{r.item.name}</div>
                  <span className="label-caps text-anomalo-muted text-[10px]">
                    {r.createdAt.toLocaleDateString("pt-BR")} · −{r.costXp} XP
                  </span>
                </div>
                <span
                  className="label-caps text-[10px]"
                  style={{
                    color:
                      r.status === "ENTREGUE"
                        ? "#c9b298"
                        : r.status === "REJEITADO"
                          ? "#E26B4A"
                          : "#8d7556",
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
