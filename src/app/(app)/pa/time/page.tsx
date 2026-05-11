// /pa/time — aba PADRÃO ao abrir o app. Une o overview do colaborador
// (saudação + posição + nível + barra) com a visão do time (lista
// alfabética + atividade ao vivo).

import { prisma } from "@/lib/prisma";
import { requireColaboradorPA } from "@/lib/pa-auth";
import {
  calcularNivel,
  currentMesAno,
  mesAnoLabel,
  FUNCAO_LABEL,
  NIVEL_LABEL,
  NIVEL_COR,
  paAteProximoNivel,
  progressoDoNivelAtual,
  saudacao,
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

  // PA acumulado no mês por colaborador (não rejeitada)
  const totals = await safe(
    "acao.groupBy",
    async () => {
      const rows = await prisma.acaoPontuada.groupBy({
        by: ["colaboradorId"],
        where: { data: { gte: inicio, lt: fim }, status: { not: "REJEITADA" } },
        _sum: { paGerado: true },
      });
      return new Map(rows.map((r) => [r.colaboradorId, Number(r._sum.paGerado ?? 0)]));
    },
    new Map<string, number>(),
  );

  // Todos os colaboradores ativos
  const colabs = await safe(
    "colab.findMany",
    () =>
      prisma.colaborador.findMany({
        where: { ativo: true },
        select: { id: true, nome: true, funcoes: true, avatarUrl: true },
        orderBy: { nome: "asc" },
      }),
    [] as Array<{
      id: string;
      nome: string;
      funcoes: FuncaoCodigo[];
      avatarUrl: string | null;
    }>,
  );

  const time = colabs.map((c) => ({
    id: c.id,
    nome: c.nome,
    funcoes: c.funcoes,
    avatarUrl: c.avatarUrl,
    paTotal: totals.get(c.id) ?? 0,
    ehVoce: c.id === me.id,
  }));

  // Dados pessoais (overview no topo)
  const meu = totals.get(me.id) ?? 0;
  const nivel = calcularNivel(meu);
  const proximo = paAteProximoNivel(meu);
  const dentroNivel = progressoDoNivelAtual(meu);

  // Ranking competitivo escondido — calcula só pra posição
  const ranking = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const myIndex = ranking.findIndex((id) => id === me.id);
  const posicao = myIndex >= 0 ? myIndex + 1 : colabs.length;

  // Últimas 15 ações pra feed
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
    "acao feed",
    () =>
      prisma.acaoPontuada.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        where: { status: { not: "REJEITADA" } },
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
      {/* ─── OVERVIEW PESSOAL (saudação + posição + nível + barra) ─── */}
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
          {me.nome.split(" ")[0].toLowerCase()}.
        </span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
        <div className="ano-card-flat p-5">
          <span className="label-caps label-caps-muted block mb-2">PA do mês</span>
          <span
            className="text-mono text-[#C9953A] tabular-nums block"
            style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            {meu.toFixed(1)}
          </span>
        </div>

        <div className="ano-card-flat p-5">
          <span className="label-caps label-caps-muted block mb-2">Posição</span>
          <span
            className="text-mono text-white tabular-nums block"
            style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            #{String(posicao).padStart(2, "0")}
          </span>
          <span className="label-caps label-caps-muted text-[10px] mt-1 block">
            de {colabs.length} no time
          </span>
        </div>

        <div className="ano-card-flat p-5">
          <span className="label-caps label-caps-muted block mb-2">Nível</span>
          <span
            className="block"
            style={{
              fontSize: 22,
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

      {/* Barra do progresso dentro do nível */}
      <div className="ano-card-flat p-5 mt-3">
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

      {/* ─── TIME (lista alfabética sem ranking competitivo) ─── */}
      <h2
        className="text-white mt-10 mb-5"
        style={{
          fontWeight: 900,
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
        }}
      >
        Nosso{" "}
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          time.
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
        <section className="ano-card-flat p-5 md:p-6">
          <h3 className="label-caps mb-4">Quem está no time</h3>
          <ul className="flex flex-col gap-2">
            {time.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl"
                style={{
                  background: c.ehVoce
                    ? "rgba(201,149,58,0.06)"
                    : "rgba(255,255,255,0.02)",
                  boxShadow: c.ehVoce
                    ? "inset 0 0 0 1px rgba(201,149,58,0.30)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: "rgba(201,149,58,0.08)",
                    boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.25)",
                    color: "#C9953A",
                  }}
                >
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatarUrl}
                      alt={c.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    c.nome
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-white truncate"
                      style={{ fontSize: 15, fontWeight: c.ehVoce ? 800 : 600 }}
                    >
                      {c.nome}
                      {c.ehVoce && (
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
                      className="text-mono tabular-nums text-[#C9953A] flex-shrink-0"
                      style={{ fontSize: 14, fontWeight: 700 }}
                    >
                      {c.paTotal.toFixed(1)} PA
                    </span>
                  </div>
                  <span className="label-caps label-caps-muted text-[10px] mt-0.5 block">
                    {c.funcoes.map((f) => FUNCAO_LABEL[f] ?? f).join(" · ")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="ano-card-flat p-5 md:p-6">
          <h3 className="label-caps mb-4">Atividade ao vivo</h3>
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
