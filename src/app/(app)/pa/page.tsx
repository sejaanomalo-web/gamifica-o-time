// Dashboard pessoal do colaborador no sistema PA.
// PA do mês, nível atingido, comissão estimada, progresso, botão registrar.

import { prisma } from "@/lib/prisma";
import { requireColaboradorPA } from "@/lib/pa-auth";
import {
  calcularComissao,
  calcularProgresso,
  currentMesAno,
  formatBRL,
  mesAnoLabel,
  NIVEL_LABEL,
  NIVEL_COR,
  paAteProximoNivel,
  FUNCAO_LABEL,
  type FuncaoCodigo,
} from "@/lib/pa";
import { PaDashboardClient } from "@/components/feature/pa/PaDashboardClient";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[pa/dashboard] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PaDashboardPage() {
  const colab = await requireColaboradorPA();
  const mesAno = currentMesAno();
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  const total = await safe(
    "acao.aggregate",
    async () => {
      const r = await prisma.acaoPontuada.aggregate({
        where: { colaboradorId: colab.id, data: { gte: inicio, lt: fim } },
        _sum: { paGerado: true },
      });
      return Number(r._sum.paGerado ?? 0);
    },
    0,
  );
  const paTotal = total;
  const comissao = calcularComissao(paTotal);
  const progresso = calcularProgresso(paTotal);
  const proximo = paAteProximoNivel(paTotal);

  const acoesHoje = await safe(
    "acao.count today",
    () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje.getTime() + 86400000);
      return prisma.acaoPontuada.count({
        where: {
          colaboradorId: colab.id,
          data: { gte: hoje, lt: amanha },
        },
      });
    },
    0,
  );

  // Atividades disponíveis pra registrar (do catálogo, filtradas pelas funções do colaborador)
  const atividades = await safe(
    "atividades.findMany",
    () =>
      prisma.atividadeCatalogo.findMany({
        where: {
          ativo: true,
          funcao: { in: colab.funcoes },
        },
        orderBy: [{ funcao: "asc" }, { ordem: "asc" }],
      }),
    [] as Awaited<ReturnType<typeof prisma.atividadeCatalogo.findMany>>,
  );

  const initials = colab.nome
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const funcoesLabel = colab.funcoes
    .map((f) => FUNCAO_LABEL[f as FuncaoCodigo] ?? f)
    .join(" · ");

  return (
    <div className="relative px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
          style={{
            background: "rgba(201,149,58,0.10)",
            color: "#C9953A",
            boxShadow: "inset 0 0 0 1.5px #C9953A, 0 0 20px rgba(201,149,58,0.25)",
          }}
        >
          {colab.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={colab.avatarUrl}
              alt={colab.nome}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <span className="label-caps label-caps-muted block mb-1">{funcoesLabel}</span>
          <h1
            className="text-white"
            style={{
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {colab.nome}
          </h1>
        </div>
      </div>

      <span className="label-caps mb-3 block">Comissionamento · {mesAnoLabel(mesAno)}</span>

      {/* PA grande + Nível + Comissão */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <div className="ano-card-flat p-6">
          <span className="label-caps label-caps-muted block mb-2">PA do mês</span>
          <span
            className="text-mono text-[#C9953A] tabular-nums block"
            style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            {paTotal.toFixed(1)}
          </span>
          <span className="label-caps label-caps-muted text-[10px] mt-1 block">
            {acoesHoje > 0
              ? `+${acoesHoje} ação${acoesHoje > 1 ? "ões" : ""} hoje`
              : "Nenhuma ação hoje"}
          </span>
        </div>

        <div className="ano-card-flat p-6">
          <span className="label-caps label-caps-muted block mb-2">Nível atual</span>
          <span
            className="block"
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: NIVEL_COR[comissao.nivel],
              textTransform: "uppercase",
            }}
          >
            {NIVEL_LABEL[comissao.nivel]}
          </span>
          {proximo.proximo && (
            <span className="label-caps label-caps-muted text-[10px] mt-1 block">
              Faltam {proximo.faltam?.toFixed(1)} PA pra {NIVEL_LABEL[proximo.proximo]}
            </span>
          )}
        </div>

        <div className="ano-card-flat p-6">
          <span className="label-caps label-caps-muted block mb-2">Comissão estimada</span>
          <span
            className="text-mono text-[#C9953A] tabular-nums block"
            style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}
          >
            {formatBRL(comissao.totalComissao)}
          </span>
          <span className="label-caps label-caps-muted text-[10px] mt-1 block">
            R$ {comissao.valorPorPontos.toFixed(2).replace(".", ",")} pontos
            {comissao.bonusMilestone > 0 &&
              ` · +R$ ${comissao.bonusMilestone.toFixed(2).replace(".", ",")} bônus`}
          </span>
        </div>
      </div>

      {/* Barra de progresso com marcadores */}
      <div className="ano-card-flat p-6 mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <span className="label-caps label-caps-muted">Progresso</span>
          <span className="text-mono text-[#C9953A] tabular-nums text-sm font-bold">
            {progresso}%
          </span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden bg-white/[0.06]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progresso}%`,
              background: "linear-gradient(90deg, #C9953A 0%, #E0B25A 100%)",
              boxShadow: "0 0 10px rgba(201,149,58,0.45)",
              transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
          {/* Marcadores em 80, 160, 240 (porcentagens 33.3%, 66.7%, 100%) */}
          {[
            { pct: (80 / 240) * 100, label: "80" },
            { pct: (160 / 240) * 100, label: "160" },
            { pct: 100, label: "240" },
          ].map((m) => (
            <div
              key={m.label}
              className="absolute top-0 bottom-0"
              style={{ left: `${m.pct}%`, width: 1, background: "rgba(255,255,255,0.30)" }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-mid text-mono">
          <span>0</span>
          <span style={{ marginLeft: "10%" }}>80</span>
          <span>160</span>
          <span>240</span>
        </div>
      </div>

      {/* Client island: botão registrar + sheet */}
      <PaDashboardClient
        colaboradorId={colab.id}
        funcoes={colab.funcoes}
        atividades={atividades.map((a) => ({
          id: a.id,
          funcao: a.funcao,
          nome: a.nome,
          codigo: a.codigo,
          paValor: Number(a.paValor),
          ordem: a.ordem,
        }))}
      />

      {/* Λ assinatura */}
      <span
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          bottom: 110,
          right: 16,
          color: "rgba(201,149,58,0.60)",
          fontSize: 14,
          fontWeight: 300,
          lineHeight: 1,
        }}
      >
        Λ
      </span>
    </div>
  );
}
