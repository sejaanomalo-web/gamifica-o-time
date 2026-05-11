// /equipe — TV dashboard admin. Agora puxa dados do sistema PA:
// - Ranking dos 5 colaboradores (incluindo Bruno e Alisson)
// - PA do mês atual (calendário, não temporada)
// - Entregas hoje, da semana, e fechamentos do mês
// - Atividade ao vivo via MuralEvent foi substituída por AcaoPontuada

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireColaboradorPA } from "@/lib/pa-auth";
import { currentMesAno, calcularComissao, type FuncaoCodigo } from "@/lib/pa";
import {
  TeamDashboard,
  type TeamMember,
  type ActivityEvent,
} from "@/components/feature/teamtv/TeamDashboard";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[equipe] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EquipePage() {
  const me = await requireColaboradorPA();
  if (!me.isAdmin) redirect("/pa");

  const mesAno = currentMesAno();
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje.getTime() + 86400000);
  const inicioSemana = new Date(hoje.getTime() - 6 * 86400000);

  // Todos os colaboradores ativos (Bruno e Alisson incluídos)
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

  // PA acumulado do mês
  const totalMes = await safe(
    "groupBy totalMes",
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

  // PA da semana (últimos 7 dias)
  const totalSemana = await safe(
    "groupBy totalSemana",
    async () => {
      const rows = await prisma.acaoPontuada.groupBy({
        by: ["colaboradorId"],
        where: { data: { gte: inicioSemana } },
        _sum: { paGerado: true },
      });
      return new Map(rows.map((r) => [r.colaboradorId, Number(r._sum.paGerado ?? 0)]));
    },
    new Map<string, number>(),
  );

  // Quantidade de ações hoje
  const acoesHoje = await safe(
    "groupBy acoesHoje",
    async () => {
      const rows = await prisma.acaoPontuada.groupBy({
        by: ["colaboradorId"],
        where: { data: { gte: hoje, lt: amanha } },
        _count: { _all: true },
      });
      return new Map(rows.map((r) => [r.colaboradorId, r._count._all]));
    },
    new Map<string, number>(),
  );

  // Total de ações na semana (pra stat global)
  const totalAcoesSemana = await safe(
    "count semanaCount",
    () =>
      prisma.acaoPontuada.count({
        where: { data: { gte: inicioSemana } },
      }),
    0,
  );

  // Total de ações hoje (stat global)
  const totalAcoesHoje = await safe(
    "count hojeCount",
    () =>
      prisma.acaoPontuada.count({
        where: { data: { gte: hoje, lt: amanha } },
      }),
    0,
  );

  // Fechamentos do mês (= "metas batidas" equivalente)
  const fechamentosMes = await safe(
    "fechamentos count",
    () => prisma.fechamentoMensal.count({ where: { mesAno } }),
    0,
  );

  // Ranking calculado: nível = floor(pa / 80) + 1, com cap em 4 (excelência)
  const members: TeamMember[] = colabs
    .map((c) => {
      const pa = totalMes.get(c.id) ?? 0;
      const semana = totalSemana.get(c.id) ?? 0;
      const comissao = calcularComissao(pa);
      // Nível visual: cada faixa de 80 PA sobe 1 nível (base=1, m1=2, m2=3, excel=4+)
      const level =
        comissao.nivel === "excelencia"
          ? 4
          : comissao.nivel === "meta_2"
            ? 3
            : comissao.nivel === "meta_1"
              ? 2
              : 1;
      return {
        userId: c.id,
        name: c.nome,
        area: c.funcoes.join(" · "),
        avatarUrl: c.avatarUrl,
        xp: Math.round(pa),
        weekXp: Math.round(semana),
        todayCount: acoesHoje.get(c.id) ?? 0,
        weekCount: 0, // não usamos aqui
        goalsBeaten: 0, // não aplicável no PA puro
        level,
      };
    })
    .sort((a, b) => b.xp - a.xp);

  const totalPaTime = members.reduce((s, m) => s + m.xp, 0);
  const avgLevel = members.length
    ? Math.round(
        (members.reduce((s, m) => s + m.level, 0) / members.length) * 10,
      ) / 10
    : 0;

  // Atividade ao vivo: últimas 30 ações
  type AcaoFeed = Awaited<
    ReturnType<
      typeof prisma.acaoPontuada.findMany<{
        include: {
          colaborador: { select: { nome: true; avatarUrl: true } };
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
        take: 30,
        include: {
          colaborador: { select: { nome: true, avatarUrl: true } },
          atividade: { select: { nome: true } },
        },
      }),
    [],
  );

  const activity: ActivityEvent[] = acoes.map((a) => {
    const pa = Number(a.paGerado);
    return {
      id: a.id,
      type: pa < 0 ? "shop_redeem" : "delivery", // mapeia pra cores do ticker
      userName: a.colaborador.nome,
      avatarUrl: a.colaborador.avatarUrl,
      text: `${a.atividade.nome} (${pa < 0 ? "" : "+"}${pa.toFixed(1)} PA)`,
      emoji: "",
      createdAt: a.createdAt.toISOString(),
    };
  });

  // Calendário civil — dias restantes no mês
  const fimMes = new Date(year, month, 0); // último dia do mês
  const daysLeftInMonth = Math.max(
    0,
    Math.ceil((fimMes.getTime() - Date.now()) / 86400000),
  );

  return (
    <TeamDashboard
      members={members}
      activity={activity}
      totalSeasonXp={Math.round(totalPaTime)}
      totalDeliveriesToday={totalAcoesHoje}
      totalDeliveriesWeek={totalAcoesSemana}
      totalGoalsBeaten={fechamentosMes}
      avgLevel={avgLevel}
      seasonNumber={month}
      daysLeftInSeason={daysLeftInMonth}
    />
  );
}
