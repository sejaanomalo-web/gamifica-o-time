// /pa/loja — colaborador troca PA por gift card (R$50 a R$500, de 50 em 50).
// Custo: 1 PA = R$1.
// Saldo ACUMULÁVEL (lifetime): PA total (não rejeitada) − resgates não
// rejeitados. Se o colab não trocar num mês, o saldo segue pro próximo.

import { prisma } from "@/lib/prisma";
import { requireColaboradorPA, getCachedPaSaldo } from "@/lib/pa-auth";
import { LojaClient } from "@/components/feature/pa/LojaClient";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[pa/loja] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PaLojaPage() {
  const colab = await requireColaboradorPA();

  // Dedup com o layout — o saldo já foi computado lá na TopBar e
  // reaproveitamos o mesmo resultado dentro deste request.
  const { saldo } = await safe(
    "saldo",
    () => getCachedPaSaldo(colab.id),
    { acumulado: 0, gasto: 0, saldo: 0 },
  );

  const historico = await safe(
    "lojaResgate.findMany",
    () =>
      prisma.lojaResgate.findMany({
        where: { colaboradorId: colab.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    [] as Awaited<ReturnType<typeof prisma.lojaResgate.findMany>>,
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      <span className="label-caps label-caps-muted block mb-3">Saldo acumulado</span>
      <h1
        className="text-white mb-8"
        style={{
          fontWeight: 900,
          fontSize: "clamp(2rem, 6vw, 2.75rem)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        Trocar PA por<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          gift card.
        </span>
      </h1>

      <div className="ano-card-flat p-6 mb-6">
        <span className="label-caps label-caps-muted block mb-2">Saldo disponível</span>
        <div className="flex items-baseline gap-3">
          <span
            className="text-mono text-[#C9953A] tabular-nums"
            style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            {saldo.toFixed(1)}
          </span>
          <span className="label-caps label-caps-muted">PA</span>
          <span className="text-mid text-xs ml-auto">
            ≈ R$ {saldo.toFixed(2).replace(".", ",")}
          </span>
        </div>
        <p className="text-[11px] text-mid mt-2">
          Saldo <strong className="text-mid">acumulável</strong> — PA total ganho (não rejeitado) menos
          resgates já solicitados. Cada R$1 do gift card custa 1 PA. Se não trocar
          esse mês, o saldo segue pro próximo.
        </p>
      </div>

      <LojaClient
        saldo={saldo}
        historico={historico.map((h) => ({
          id: h.id,
          valorReais: h.valorReais,
          paGasto: Number(h.paGasto),
          status: h.status,
          createdAt: h.createdAt.toISOString(),
        }))}
      />

      <span
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          bottom: 110,
          right: 16,
          color: "rgba(201,149,58,0.60)",
          fontSize: 14,
          fontWeight: 300,
        }}
      >
        Λ
      </span>
    </div>
  );
}
