// /admin/relatorios — visão geral do mês com desempenho do time.
// Lê dados em tempo real do sistema PA, oferece export PDF (window.print)
// e CSV. Removidos campos legados (Taxa de batimento, DAU, MAU, Tempo médio).

import { prisma } from "@/lib/prisma";
import { requireAdminPA } from "@/lib/pa-auth";
import {
  currentMesAno,
  mesAnoLabel,
  calcularComissao,
  FUNCAO_LABEL,
  NIVEL_LABEL,
  NIVEL_COR,
  type FuncaoCodigo,
} from "@/lib/pa";
import { RelatoriosClient } from "@/components/feature/admin/RelatoriosClient";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/relatorios] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function RelatoriosPage({ searchParams }: PageProps) {
  await requireAdminPA();
  const params = await searchParams;
  const mesAno = /^\d{4}-\d{2}$/.test(params.mes ?? "") ? params.mes! : currentMesAno();
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  const colabs = await safe(
    "colab.findMany",
    () =>
      prisma.colaborador.findMany({
        where: { ativo: true },
        select: { id: true, nome: true, funcoes: true },
        orderBy: { nome: "asc" },
      }),
    [] as Array<{ id: string; nome: string; funcoes: FuncaoCodigo[] }>,
  );

  // PA do mês por colaborador (não rejeitada) + contagem de ações
  const totalsMes = await safe(
    "groupBy mes",
    async () => {
      const rows = await prisma.acaoPontuada.groupBy({
        by: ["colaboradorId"],
        where: { data: { gte: inicio, lt: fim }, status: { not: "REJEITADA" } },
        _sum: { paGerado: true },
        _count: { _all: true },
      });
      return new Map(
        rows.map((r) => [
          r.colaboradorId,
          { pa: Number(r._sum.paGerado ?? 0), acoes: r._count._all },
        ]),
      );
    },
    new Map<string, { pa: number; acoes: number }>(),
  );

  // PA lifetime acumulado por colaborador
  const lifetimes = await safe(
    "groupBy lifetime",
    async () => {
      const rows = await prisma.acaoPontuada.groupBy({
        by: ["colaboradorId"],
        where: { status: { not: "REJEITADA" } },
        _sum: { paGerado: true },
      });
      return new Map(rows.map((r) => [r.colaboradorId, Number(r._sum.paGerado ?? 0)]));
    },
    new Map<string, number>(),
  );

  // Ações por status no mês (pra stat global)
  const statusCounts = await safe(
    "status groupBy",
    async () => {
      const rows = await prisma.acaoPontuada.groupBy({
        by: ["status"],
        where: { data: { gte: inicio, lt: fim } },
        _count: { _all: true },
      });
      return Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<
        string,
        number
      >;
    },
    {} as Record<string, number>,
  );

  // Resgates da loja do mês (valor + contagem)
  const resgatesMes = await safe(
    "resgates mes",
    async () => {
      const [agg, count] = await Promise.all([
        prisma.lojaResgate.aggregate({
          where: { createdAt: { gte: inicio, lt: fim } },
          _sum: { valorReais: true, paGasto: true },
        }),
        prisma.lojaResgate.count({ where: { createdAt: { gte: inicio, lt: fim } } }),
      ]);
      return {
        valor: agg._sum.valorReais ?? 0,
        paGasto: Number(agg._sum.paGasto ?? 0),
        count,
      };
    },
    { valor: 0, paGasto: 0, count: 0 },
  );

  const rows = colabs
    .map((c) => {
      const m = totalsMes.get(c.id) ?? { pa: 0, acoes: 0 };
      const lifetime = lifetimes.get(c.id) ?? 0;
      const comissao = calcularComissao(m.pa);
      return {
        id: c.id,
        nome: c.nome,
        funcoes: c.funcoes,
        paMes: m.pa,
        acoesMes: m.acoes,
        paLifetime: lifetime,
        nivel: comissao.nivel,
        comissao: comissao.totalComissao,
      };
    })
    .sort((a, b) => b.paMes - a.paMes);

  const totalTimeMes = rows.reduce((s, r) => s + r.paMes, 0);
  const totalAcoesMes = rows.reduce((s, r) => s + r.acoesMes, 0);
  const totalLifetime = rows.reduce((s, r) => s + r.paLifetime, 0);

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-6xl mx-auto w-full">
      <span className="label-caps mb-3 block">Admin · Visão geral</span>
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
        Relatórios<br />
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
        {mesAnoLabel(mesAno)} · Atualizado em tempo real conforme as ações são registradas.
      </p>

      <RelatoriosClient
        mesAno={mesAno}
        mesAnoLabel={mesAnoLabel(mesAno)}
        rows={rows}
        funcaoLabel={FUNCAO_LABEL}
        nivelLabel={NIVEL_LABEL}
        nivelCor={NIVEL_COR}
        stats={{
          totalTimeMes,
          totalAcoesMes,
          totalLifetime,
          colabsAtivos: rows.length,
          pendentes: statusCounts.PENDENTE ?? 0,
          aprovadas: statusCounts.APROVADA ?? 0,
          rejeitadas: statusCounts.REJEITADA ?? 0,
          resgatesCount: resgatesMes.count,
          resgatesValor: resgatesMes.valor,
        }}
      />

      <span
        aria-hidden
        className="fixed pointer-events-none print:hidden"
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
