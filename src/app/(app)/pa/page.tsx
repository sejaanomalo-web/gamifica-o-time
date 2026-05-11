// /pa — Home do colaborador. Saudação + PA do mês + nível + posição
// no ranking geral + barra do progresso DENTRO do nível atual.
// Sem comissão estimada. Sem botão "registrar" (vai pra /pa/registrar).

import { prisma } from "@/lib/prisma";
import { requireColaboradorPA } from "@/lib/pa-auth";
import {
  calcularNivel,
  currentMesAno,
  mesAnoLabel,
  NIVEL_LABEL,
  NIVEL_COR,
  paAteProximoNivel,
  progressoDoNivelAtual,
  saudacao,
  FUNCAO_LABEL,
  type FuncaoCodigo,
} from "@/lib/pa";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[pa/home] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PaHomePage() {
  const colab = await requireColaboradorPA();
  const mesAno = currentMesAno();
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  // PA do colaborador no mês — exclui REJEITADA
  const meu = await safe(
    "acao.aggregate me",
    async () => {
      const r = await prisma.acaoPontuada.aggregate({
        where: {
          colaboradorId: colab.id,
          data: { gte: inicio, lt: fim },
          status: { not: "REJEITADA" },
        },
        _sum: { paGerado: true },
      });
      return Number(r._sum.paGerado ?? 0);
    },
    0,
  );

  // Ranking geral pra posição
  const ranking = await safe(
    "groupBy ranking",
    async () => {
      const rows = await prisma.acaoPontuada.groupBy({
        by: ["colaboradorId"],
        where: { data: { gte: inicio, lt: fim }, status: { not: "REJEITADA" } },
        _sum: { paGerado: true },
        orderBy: { _sum: { paGerado: "desc" } },
      });
      return rows.map((r) => ({
        userId: r.colaboradorId,
        pa: Number(r._sum.paGerado ?? 0),
      }));
    },
    [] as { userId: string; pa: number }[],
  );

  // Total de colaboradores ativos (denominador)
  const totalColabs = await safe(
    "colab.count",
    () => prisma.colaborador.count({ where: { ativo: true } }),
    0,
  );

  const myIndex = ranking.findIndex((r) => r.userId === colab.id);
  // Se o user não tem ação no mês, ele entra no final do ranking
  const posicao = myIndex >= 0 ? myIndex + 1 : Math.max(totalColabs, ranking.length + 1);

  const nivel = calcularNivel(meu);
  const proximo = paAteProximoNivel(meu);
  const dentroNivel = progressoDoNivelAtual(meu);

  const funcoesLabel = colab.funcoes
    .map((f) => FUNCAO_LABEL[f as FuncaoCodigo] ?? f)
    .join(" · ");

  return (
    <div className="relative px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      {/* Saudação */}
      <span className="label-caps label-caps-muted block mb-3">
        {mesAnoLabel(mesAno)}
      </span>
      <h1
        className="text-white"
        style={{
          fontWeight: 900,
          fontSize: "clamp(1.75rem, 6vw, 2.5rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
        }}
      >
        {saudacao()},<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          {colab.nome.split(" ")[0].toLowerCase()}.
        </span>
      </h1>
      <p className="text-mid text-sm mt-3">{funcoesLabel}</p>

      {/* PA + Posição + Nível */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
        <div className="ano-card-flat p-6">
          <span className="label-caps label-caps-muted block mb-2">PA do mês</span>
          <span
            className="text-mono text-[#C9953A] tabular-nums block"
            style={{
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {meu.toFixed(1)}
          </span>
        </div>

        <div className="ano-card-flat p-6">
          <span className="label-caps label-caps-muted block mb-2">Posição</span>
          <span
            className="text-mono text-white tabular-nums block"
            style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            #{String(posicao).padStart(2, "0")}
          </span>
          <span className="label-caps label-caps-muted text-[10px] mt-1 block">
            de {totalColabs} no time
          </span>
        </div>

        <div className="ano-card-flat p-6">
          <span className="label-caps label-caps-muted block mb-2">Nível</span>
          <span
            className="block"
            style={{
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: NIVEL_COR[nivel],
              textTransform: "uppercase",
            }}
          >
            {NIVEL_LABEL[nivel]}
          </span>
          {proximo.proximo && (
            <span className="label-caps label-caps-muted text-[10px] mt-1 block">
              {proximo.faltam?.toFixed(1)} PA até {NIVEL_LABEL[proximo.proximo]}
            </span>
          )}
          {!proximo.proximo && (
            <span className="label-caps text-[10px] mt-1 block" style={{ color: "#E0B25A" }}>
              Topo do mês.
            </span>
          )}
        </div>
      </div>

      {/* Barra do progresso dentro do nível atual */}
      <div className="ano-card-flat p-6 mt-3">
        <div className="flex items-baseline justify-between mb-3">
          <span className="label-caps label-caps-muted">
            Progresso · {NIVEL_LABEL[nivel]}
          </span>
          <span className="text-mono text-[#C9953A] tabular-nums text-sm font-bold">
            {dentroNivel.pct}%
          </span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden bg-white/[0.06]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${dentroNivel.pct}%`,
              background: "linear-gradient(90deg, #C9953A 0%, #E0B25A 100%)",
              boxShadow: "0 0 10px rgba(201,149,58,0.45)",
              transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-mid text-mono">
          <span>{dentroNivel.base} PA</span>
          <span className="text-[#C9953A]">{meu.toFixed(1)} PA</span>
          <span>{dentroNivel.topo} PA</span>
        </div>
      </div>

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
