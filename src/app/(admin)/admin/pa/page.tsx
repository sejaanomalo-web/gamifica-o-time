// /admin/pa — admin lista todas as ações do mês, edita/exclui, fecha mês.

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
  searchParams: Promise<{ mes?: string }>;
}

export default async function AdminPaPage({ searchParams }: PageProps) {
  await requireAdminPA();
  const params = await searchParams;
  const mesAno = /^\d{4}-\d{2}$/.test(params.mes ?? "") ? params.mes! : currentMesAno();
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  type AcaoComRelations = Awaited<
    ReturnType<
      typeof prisma.acaoPontuada.findMany<{
        include: {
          colaborador: { select: { id: true; nome: true } };
          atividade: { select: { nome: true; funcao: true; codigo: true } };
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
          atividade: { select: { nome: true, funcao: true, codigo: true } },
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

  const rows = acoes.map((a) => ({
    id: a.id,
    colaboradorId: a.colaboradorId,
    colaboradorNome: a.colaborador.nome,
    atividadeNome: a.atividade.nome,
    atividadeFuncao: a.atividade.funcao as FuncaoCodigo,
    data: a.data.toISOString().slice(0, 10),
    quantidade: a.quantidade,
    paGerado: Number(a.paGerado),
    cliente: a.cliente,
    observacao: a.observacao,
    ehPenalidade: a.ehPenalidade,
    createdAt: a.createdAt.toISOString(),
  }));

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
        Ações<br />
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
      <p className="text-mid text-sm mb-8">{mesAnoLabel(mesAno)} — {rows.length} ações registradas.</p>

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
        mesAno={mesAno}
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
