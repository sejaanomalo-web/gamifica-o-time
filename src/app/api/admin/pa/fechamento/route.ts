// POST /api/admin/pa/fechamento — admin fecha mês.
// Body: { mesAno } (YYYY-MM). Default: mês atual.
//
// Calcula pa_total por colaborador no mês, aplica fórmula PA × 1.50 + bônus
// milestone, salva em fechamentos_mensais. Idempotente por unique
// (colaborador_id, mes_ano) — refazer o fechamento sobrescreve.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";
import { calcularComissao, currentMesAno } from "@/lib/pa";

const Body = z.object({
  mesAno: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export async function POST(req: Request) {
  const admin = await requireAdminPA();

  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    // body vazio ok
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const mesAno = parsed.data.mesAno ?? currentMesAno();
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  // Agrega pa_gerado por colaborador no mês
  const totals = await prisma.acaoPontuada.groupBy({
    by: ["colaboradorId"],
    where: { data: { gte: inicio, lt: fim } },
    _sum: { paGerado: true },
  });

  const result = [];
  for (const t of totals) {
    const paTotal = Number(t._sum.paGerado ?? 0);
    const comissao = calcularComissao(paTotal);

    const upserted = await prisma.fechamentoMensal.upsert({
      where: {
        colaboradorId_mesAno: {
          colaboradorId: t.colaboradorId,
          mesAno,
        },
      },
      update: {
        paTotal,
        nivelAtingido: comissao.nivel,
        valorPorPontos: comissao.valorPorPontos,
        bonusMilestone: comissao.bonusMilestone,
        totalComissao: comissao.totalComissao,
        fechadoPor: admin.id,
        fechadoEm: new Date(),
      },
      create: {
        colaboradorId: t.colaboradorId,
        mesAno,
        paTotal,
        nivelAtingido: comissao.nivel,
        valorPorPontos: comissao.valorPorPontos,
        bonusMilestone: comissao.bonusMilestone,
        totalComissao: comissao.totalComissao,
        fechadoPor: admin.id,
      },
    });
    result.push({ id: upserted.id, colaboradorId: t.colaboradorId, paTotal });
  }

  return NextResponse.json({ ok: true, mesAno, fechados: result.length, result });
}
