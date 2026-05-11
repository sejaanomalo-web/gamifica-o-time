// PATCH /api/admin/pa/acoes/[id]/validar — admin valida ação.
// Body: { acao: "aprovar" | "rejeitar" | "ajustar", quantidade?, observacao? }
//
// - aprovar: status = APROVADA (mantém PA atual)
// - rejeitar: status = REJEITADA (some do total — não conta no dashboard)
// - ajustar: aceita nova quantidade, recalcula pa_gerado, status = APROVADA

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  acao: z.enum(["aprovar", "rejeitar", "ajustar"]),
  quantidade: z.number().int().positive().optional(),
  observacao: z.string().optional().nullable(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPA();
  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const acao = await prisma.acaoPontuada.findUnique({
    where: { id },
    include: { atividade: true },
  });
  if (!acao) {
    return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 });
  }

  const data: Record<string, unknown> = {
    validadoEm: new Date(),
    validadoPor: admin.id,
  };
  if (parsed.data.observacao !== undefined) data.observacao = parsed.data.observacao;

  if (parsed.data.acao === "aprovar") {
    data.status = "APROVADA";
  } else if (parsed.data.acao === "rejeitar") {
    data.status = "REJEITADA";
  } else if (parsed.data.acao === "ajustar") {
    if (!parsed.data.quantidade) {
      return NextResponse.json(
        { error: "quantidade obrigatória pra ação 'ajustar'" },
        { status: 400 },
      );
    }
    data.quantidade = parsed.data.quantidade;
    data.paGerado = parsed.data.quantidade * Number(acao.atividade.paValor);
    data.status = "APROVADA";
  }

  try {
    await prisma.acaoPontuada.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/pa/acoes/validar]", err);
    return NextResponse.json({ error: "Falha ao validar" }, { status: 500 });
  }
}
