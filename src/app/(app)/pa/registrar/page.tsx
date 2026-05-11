// /pa/registrar — colaborador registra atividade + vê histórico próprio
// com filtro por mês/ano. Botão "Nova atividade" abre o sheet.

import { prisma } from "@/lib/prisma";
import { requireColaboradorPA } from "@/lib/pa-auth";
import { FUNCAO_LABEL, currentMesAno, mesAnoLabel, type FuncaoCodigo } from "@/lib/pa";
import { RegistrarPageClient } from "@/components/feature/pa/RegistrarPageClient";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[pa/registrar] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ mes?: string; ano?: string }>;
}

export default async function PaRegistrarPage({ searchParams }: PageProps) {
  const colab = await requireColaboradorPA();
  const params = await searchParams;

  // Filtro mês/ano: default = mês atual
  const hoje = new Date();
  const mesParam = params.mes ?? String(hoje.getMonth() + 1).padStart(2, "0");
  const anoParam = params.ano ?? String(hoje.getFullYear());

  // "all" = sem filtro temporal
  let inicio: Date | null = null;
  let fim: Date | null = null;
  let labelPeriodo = "Todos os períodos";
  if (mesParam !== "all" && anoParam !== "all") {
    const y = Number(anoParam);
    const m = Number(mesParam);
    inicio = new Date(y, m - 1, 1);
    fim = new Date(y, m, 1);
    labelPeriodo = mesAnoLabel(`${y}-${String(m).padStart(2, "0")}`);
  } else if (anoParam !== "all" && mesParam === "all") {
    const y = Number(anoParam);
    inicio = new Date(y, 0, 1);
    fim = new Date(y + 1, 0, 1);
    labelPeriodo = `Ano ${y}`;
  }

  type AcaoFull = Awaited<
    ReturnType<
      typeof prisma.acaoPontuada.findMany<{
        include: { atividade: { select: { nome: true; funcao: true } } };
      }>
    >
  >;
  const acoes = await safe<AcaoFull>(
    "acao.findMany",
    () =>
      prisma.acaoPontuada.findMany({
        where: {
          colaboradorId: colab.id,
          ...(inicio && fim ? { data: { gte: inicio, lt: fim } } : {}),
        },
        orderBy: { data: "desc" },
        take: 200,
        include: { atividade: { select: { nome: true, funcao: true } } },
      }),
    [],
  );

  const atividades = await safe(
    "atividades.findMany",
    () =>
      prisma.atividadeCatalogo.findMany({
        where: { ativo: true, funcao: { in: colab.funcoes } },
        orderBy: [{ funcao: "asc" }, { ordem: "asc" }],
      }),
    [] as Awaited<ReturnType<typeof prisma.atividadeCatalogo.findMany>>,
  );

  const rows = acoes.map((a) => ({
    id: a.id,
    data: a.data.toISOString().slice(0, 10),
    nome: a.atividade.nome,
    funcao: a.atividade.funcao as FuncaoCodigo,
    quantidade: a.quantidade,
    paGerado: Number(a.paGerado),
    cliente: a.cliente,
    observacao: a.observacao,
    status: a.status,
  }));

  const totalPa = rows
    .filter((r) => r.status !== "REJEITADA")
    .reduce((s, r) => s + r.paGerado, 0);

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-4xl mx-auto w-full">
      <span className="label-caps label-caps-muted block mb-3">Atividades</span>
      <h1
        className="text-white"
        style={{
          fontWeight: 900,
          fontSize: "clamp(2rem, 6vw, 2.5rem)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        Registrar<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          e histórico.
        </span>
      </h1>
      <p className="text-mid text-sm mt-3">
        {labelPeriodo} · {rows.length} ações · {totalPa.toFixed(1)} PA acumulados
      </p>

      <RegistrarPageClient
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
        acoes={rows}
        mesParam={mesParam}
        anoParam={anoParam}
        nomeColab={colab.nome}
      />

      <p className="mt-6 text-faint text-xs">
        Funções disponíveis pra registrar:{" "}
        <strong className="text-mid">
          {colab.funcoes
            .map((f) => FUNCAO_LABEL[f as FuncaoCodigo] ?? f)
            .join(" · ")}
        </strong>
      </p>

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
