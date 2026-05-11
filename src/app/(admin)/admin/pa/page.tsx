// /admin/pa — admin gerencia ações (validar/editar/remover), resgates da loja e fechamento.

import { prisma } from "@/lib/prisma";
import { requireAdminPA } from "@/lib/pa-auth";
import { currentMesAno, mesAnoLabel, FUNCAO_LABEL, type FuncaoCodigo } from "@/lib/pa";
import { AdminPaClient } from "@/components/feature/pa/AdminPaClient";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/pa] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ mes?: string; tab?: string }>;
}

export default async function AdminPaPage({ searchParams }: PageProps) {
  await requireAdminPA();
  const params = await searchParams;
  const mesAno = /^\d{4}-\d{2}$/.test(params.mes ?? "") ? params.mes! : currentMesAno();
  const tab = (params.tab as "validacoes" | "acoes" | "loja" | "fechamentos") ?? "validacoes";
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  // Ações do mês (todas) — filtradas por status no client
  type AcaoComRelations = Awaited<
    ReturnType<
      typeof prisma.acaoPontuada.findMany<{
        include: {
          colaborador: { select: { id: true; nome: true } };
          atividade: { select: { nome: true; funcao: true; codigo: true; paValor: true } };
        };
      }>
    >
  >;
  const acoes = await safe<AcaoComRelations>(
    "acoes.findMany",
    () =>
      prisma.acaoPontuada.findMany({
        where: { data: { gte: inicio, lt: fim } },
        orderBy: { createdAt: "desc" },
        include: {
          colaborador: { select: { id: true, nome: true } },
          atividade: { select: { nome: true, funcao: true, codigo: true, paValor: true } },
        },
      }),
    [],
  );

  type FechamentoComColab = Awaited<
    ReturnType<
      typeof prisma.fechamentoMensal.findMany<{
        include: { colaborador: { select: { nome: true } } };
      }>
    >
  >;
  const fechamentos = await safe<FechamentoComColab>(
    "fechamento.findMany mes",
    () =>
      prisma.fechamentoMensal.findMany({
        where: { mesAno },
        include: { colaborador: { select: { nome: true } } },
      }),
    [],
  );

  // Resgates da loja (todos status, ordenados por status pendente primeiro)
  type ResgateComColab = Awaited<
    ReturnType<
      typeof prisma.lojaResgate.findMany<{
        include: { colaborador: { select: { nome: true } } };
      }>
    >
  >;
  const resgates = await safe<ResgateComColab>(
    "resgates.findMany",
    () =>
      prisma.lojaResgate.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 100,
        include: { colaborador: { select: { nome: true } } },
      }),
    [],
  );

  const rows = acoes.map((a) => ({
    id: a.id,
    colaboradorId: a.colaboradorId,
    colaboradorNome: a.colaborador.nome,
    atividadeNome: a.atividade.nome,
    atividadeFuncao: a.atividade.funcao as FuncaoCodigo,
    atividadePaValor: Number(a.atividade.paValor),
    data: a.data.toISOString().slice(0, 10),
    quantidade: a.quantidade,
    paGerado: Number(a.paGerado),
    cliente: a.cliente,
    observacao: a.observacao,
    ehPenalidade: a.ehPenalidade,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  const pendentes = rows.filter((r) => r.status === "PENDENTE").length;

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-6xl mx-auto w-full">
      <span className="label-caps mb-3 block">Admin · PA</span>
      <h1
        className="text-white mb-2"
        style={{
          fontWeight: 900,
          fontSize: "clamp(2.25rem, 6vw, 2.75rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        Gestão<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          do mês.
        </span>
      </h1>
      <p className="text-mid text-sm mb-8">
        {mesAnoLabel(mesAno)} — {rows.length} ações · {pendentes} pendentes · {resgates.length} resgates
      </p>

      <AdminPaClient
        acoes={rows}
        fechamentos={fechamentos.map((f) => ({
          id: f.id,
          colaboradorNome: f.colaborador.nome,
          paTotal: Number(f.paTotal),
          nivelAtingido: f.nivelAtingido,
          totalComissao: Number(f.totalComissao),
          fechadoEm: f.fechadoEm.toISOString(),
        }))}
        resgates={resgates.map((r) => ({
          id: r.id,
          colaboradorNome: r.colaborador.nome,
          valorReais: r.valorReais,
          paGasto: Number(r.paGasto),
          status: r.status,
          observacao: r.observacao,
          createdAt: r.createdAt.toISOString(),
          resolvidoEm: r.resolvidoEm?.toISOString() ?? null,
        }))}
        mesAno={mesAno}
        tabInicial={tab}
      />

      <p className="mt-8 text-faint text-xs">
        Funções disponíveis no catálogo:{" "}
        {(Object.entries(FUNCAO_LABEL) as [string, string][])
          .map(([, l]) => l)
          .join(" · ")}
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
