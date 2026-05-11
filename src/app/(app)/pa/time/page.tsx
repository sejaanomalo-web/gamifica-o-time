// /pa/time — "Nosso time". Lista alfabética dos colaboradores com função
// e PA do mês + feed de atividade ao vivo. SEM ranking competitivo
// (ranking ao vivo continua só em /equipe pra admin).
//
// O dashboard pessoal (saudação + cards + barra) vive em /pa.

import { prisma } from "@/lib/prisma";
import { requireColaboradorPA } from "@/lib/pa-auth";
import {
  currentMesAno,
  mesAnoLabel,
  FUNCAO_LABEL,
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

  const time = colabs.map((c) => ({
    id: c.id,
    nome: c.nome,
    funcoes: c.funcoes,
    avatarUrl: c.avatarUrl,
    paTotal: totals.get(c.id) ?? 0,
    ehVoce: c.id === me.id,
  }));

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
      <span className="label-caps label-caps-muted block mb-3">
        Time · {mesAnoLabel(mesAno)}
      </span>
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
        Nosso<br />
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
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
        <section className="ano-card-flat p-5 md:p-6">
          <h2 className="label-caps mb-4">Quem está no time</h2>
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
