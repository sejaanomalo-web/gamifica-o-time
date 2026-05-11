// POST /api/pa/loja — colaborador resgata gift card.
// Body: { valorReais } — 50, 100, 150, ..., 500
// Custo: 1 PA = R$1 (simples). Desconta do "saldo PA do mês" do colaborador.
// Saldo = sum(paGerado em ações APROVADAS ou PENDENTES no mês) - sum(paGasto em resgates ativos no mês)

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireColaboradorPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";
import { currentMesAno } from "@/lib/pa";

const Body = z.object({
  valorReais: z
    .number()
    .int()
    .min(50)
    .max(500)
    .refine((v) => v % 50 === 0, "valor deve ser múltiplo de 50"),
});

export async function POST(req: Request) {
  const colab = await requireColaboradorPA();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload inválido" }, { status: 400 });
  }

  const valorReais = parsed.data.valorReais;
  const paGasto = valorReais; // 1 PA = R$1

  // Saldo do mês: PA acumulado (não REJEITADA) − resgates não rejeitados do mês
  const mesAno = currentMesAno();
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  const [paAgg, resgatesAgg] = await Promise.all([
    prisma.acaoPontuada.aggregate({
      where: {
        colaboradorId: colab.id,
        data: { gte: inicio, lt: fim },
        status: { not: "REJEITADA" },
      },
      _sum: { paGerado: true },
    }),
    prisma.lojaResgate.aggregate({
      where: {
        colaboradorId: colab.id,
        createdAt: { gte: inicio, lt: fim },
        status: { not: "REJEITADO" },
      },
      _sum: { paGasto: true },
    }),
  ]);

  const acumulado = Number(paAgg._sum.paGerado ?? 0);
  const jaGasto = Number(resgatesAgg._sum.paGasto ?? 0);
  const saldo = acumulado - jaGasto;

  if (saldo < paGasto) {
    return NextResponse.json(
      {
        error: `Saldo insuficiente. Você tem ${saldo.toFixed(1)} PA disponível, e o gift card custa ${paGasto} PA.`,
      },
      { status: 400 },
    );
  }

  try {
    const resgate = await prisma.lojaResgate.create({
      data: {
        colaboradorId: colab.id,
        valorReais,
        paGasto,
      },
    });
    return NextResponse.json({ ok: true, id: resgate.id });
  } catch (err) {
    console.error("[api/pa/loja POST]", err);
    return NextResponse.json({ error: "Falha ao resgatar" }, { status: 500 });
  }
}
