// /pa/time — Ranking ao vivo + Feed cronológico do time.
// Server component que carrega dados; client component PaTeamLive
// inscreve em Supabase Realtime pra atualizar sem reload.

import { prisma } from "@/lib/prisma";
import { requireColaboradorPA } from "@/lib/pa-auth";
import {
  calcularComissao,
  calcularProgresso,
  currentMesAno,
  mesAnoLabel,
  NIVEL_LABEL,
  NIVEL_COR,
  FUNCAO_LABEL,
  formatBRL,
  type FuncaoCodigo,
} from "@/lib/pa";
import { PaTeamLive } from "@/components/feature/pa/PaTeamLive";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[pa/time] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PaTimePage() {
  const me = await requireColaboradorPA();
  const mesAno = currentMesAno();
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  // Todos os colaboradores ativos
  const colabs = await safe(
    "colab.findMany",
    () =>
      prisma.colaborador.findMany({
        where: { ativo: true },
        select: { id: true, nome: true, funcoes: true, avatarUrl: true },
      }),
    [] as Array<{
      id: string;
      nome: string;
      funcoes: FuncaoCodigo[];
      avatarUrl: string | null;
    }>,
  );

  // PA total por colaborador no mês
  const totals = await safe(
    "acao.groupBy",
    async () => {
      const rows = await prisma.acaoPontuada.groupBy({
        by: ["colaboradorId"],
        where: { data: { gte: inicio, lt: fim } },
        _sum: { paGerado: true },
      });
      return new Map(rows.map((r) => [r.colaboradorId, Number(r._sum.paGerado ?? 0)]));
    },
    new Map<string, number>(),
  );

  const ranking = colabs
    .map((c) => {
      const paTotal = totals.get(c.id) ?? 0;
      const comissao = calcularComissao(paTotal);
      return {
        id: c.id,
        nome: c.nome,
        funcoes: c.funcoes as FuncaoCodigo[],
        avatarUrl: c.avatarUrl,
        paTotal,
        nivel: comissao.nivel,
        comissao: comissao.totalComissao,
        progresso: calcularProgresso(paTotal),
        ehVoce: c.id === me.id,
      };
    })
    .sort((a, b) => b.paTotal - a.paTotal);

  // Últimas 20 ações pra feed
  type AcaoFeed = Awaited<
    ReturnType<
      typeof prisma.acaoPontuada.findMany<{
        include: {
          colaborador: { select: { nome: true } };
          atividade: { select: { nome: true } };
        };
      }>
    >
  >;
  const acoes = await safe<AcaoFeed>(
    "acao.findMany feed",
    () =>
      prisma.acaoPontuada.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          colaborador: { select: { nome: true } },
          atividade: { select: { nome: true } },
        },
      }),
    [],
  );

  const feed = acoes.map((a) => ({
    id: a.id,
    colaboradorNome: a.colaborador.nome,
    atividadeNome: a.atividade.nome,
    paGerado: Number(a.paGerado),
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
      <span className="label-caps mb-3 block">Time · {mesAnoLabel(mesAno)}</span>
      <h1
        className="text-white mb-8"
        style={{
          fontWeight: 900,
          fontSize: "clamp(2.25rem, 7vw, 3rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        Ranking<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          ao vivo.
        </span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6">
        {/* Ranking */}
        <section className="ano-card-flat p-5 md:p-6">
          <h2 className="label-caps mb-4">Ranking</h2>
          <ul className="flex flex-col gap-3">
            {ranking.map((r, i) => {
              const isExcelencia = r.nivel === "excelencia";
              return (
                <li
                  key={r.id}
                  className="relative flex items-center gap-3 px-3 py-3 rounded-2xl"
                  style={{
                    background: r.ehVoce
                      ? "rgba(201,149,58,0.10)"
                      : "rgba(255,255,255,0.025)",
                    boxShadow: r.ehVoce
                      ? "inset 0 0 0 1px #C9953A"
                      : isExcelencia
                        ? "inset 0 0 0 1px rgba(224,178,90,0.40), 0 0 24px rgba(224,178,90,0.18)"
                        : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="text-mono tabular-nums flex-shrink-0 text-right"
                    style={{
                      width: 28,
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: "-0.04em",
                      color: i === 0 ? "#E0B25A" : "rgba(255,255,255,0.30)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: "rgba(201,149,58,0.10)",
                      boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.30)",
                      color: "#C9953A",
                    }}
                  >
                    {r.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.avatarUrl} alt={r.nome} className="w-full h-full object-cover" />
                    ) : (
                      r.nome
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span
                        className="text-white truncate"
                        style={{ fontSize: 15, fontWeight: r.ehVoce ? 800 : 600 }}
                      >
                        {r.nome}
                        {r.ehVoce && (
                          <span
                            className="ml-2 label-caps text-[9px] px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(201,149,58,0.12)",
                              color: "#E0B25A",
                              boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.35)",
                            }}
                          >
                            Você
                          </span>
                        )}
                      </span>
                      <span
                        className="text-mono tabular-nums flex-shrink-0"
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#C9953A",
                        }}
                      >
                        {r.paTotal.toFixed(1)} PA
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden mb-1"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${r.progresso}%`,
                          background: "linear-gradient(90deg, #C9953A 0%, #E0B25A 100%)",
                          transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] gap-2">
                      <span className="label-caps label-caps-muted truncate">
                        {r.funcoes.map((f) => FUNCAO_LABEL[f] ?? f).join(" · ")}
                      </span>
                      <span
                        className="label-caps flex-shrink-0"
                        style={{ color: NIVEL_COR[r.nivel] }}
                      >
                        {NIVEL_LABEL[r.nivel]} · {formatBRL(r.comissao)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Feed */}
        <section className="ano-card-flat p-5 md:p-6">
          <h2 className="label-caps mb-4">Atividade ao vivo</h2>
          <PaTeamLive initialFeed={feed} />
        </section>
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
