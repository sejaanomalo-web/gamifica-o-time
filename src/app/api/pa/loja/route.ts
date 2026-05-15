// POST /api/pa/loja — colaborador resgata gift card.
// Body: { valorReais } — 50, 100, 150, ..., 500
// Custo: 1 PA = R$1 (simples).
// Saldo ACUMULÁVEL (lifetime): PA total (não REJEITADA) − resgates lifetime
// (não REJEITADO). Não reseta entre meses.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireColaboradorPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";
import { VALORES_GIFT_CARD, isValorGiftCard } from "@/lib/loja";

const Body = z.object({
  valorReais: z
    .number()
    .int()
    .refine(isValorGiftCard, {
      message: `valor inválido. Permitidos: ${VALORES_GIFT_CARD.join(", ")}`,
    }),
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

  // Saldo lifetime: PA total acumulado (não REJEITADA) − resgates não rejeitados
  const [paAgg, resgatesAgg] = await Promise.all([
    prisma.acaoPontuada.aggregate({
      where: { colaboradorId: colab.id, status: { not: "REJEITADA" } },
      _sum: { paGerado: true },
    }),
    prisma.lojaResgate.aggregate({
      where: { colaboradorId: colab.id, status: { not: "REJEITADO" } },
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
