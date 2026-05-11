// PATCH /api/pa/acoes/[id] — edita ação (próprio dono ou admin).
// DELETE /api/pa/acoes/[id] — remove ação (próprio dono ou admin).

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireColaboradorPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";

const PatchBody = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  quantidade: z.number().int().positive().optional(),
  cliente: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const colaborador = await requireColaboradorPA();
  const { id } = await ctx.params;

  const acao = await prisma.acaoPontuada.findUnique({
    where: { id },
    include: { atividade: true },
  });
  if (!acao) {
    return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 });
  }

  // Permissão: dono ou admin
  if (acao.colaboradorId !== colaborador.id && !colaborador.isAdmin) {
    return NextResponse.json(
      { error: "Você só pode editar suas próprias ações" },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.cliente !== undefined) data.cliente = parsed.data.cliente;
  if (parsed.data.observacao !== undefined) data.observacao = parsed.data.observacao;

  // Se mudou quantidade ou data, recalcula pa_gerado
  if (parsed.data.quantidade !== undefined) {
    data.quantidade = parsed.data.quantidade;
    const paValor = Number(acao.atividade.paValor);
    data.paGerado = parsed.data.quantidade * paValor;
  }
  if (parsed.data.data !== undefined) {
    data.data = new Date(`${parsed.data.data}T12:00:00`);
  }

  try {
    await prisma.acaoPontuada.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/pa/acoes PATCH]", err);
    return NextResponse.json({ error: "Falha ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const colaborador = await requireColaboradorPA();
  const { id } = await ctx.params;

  const acao = await prisma.acaoPontuada.findUnique({ where: { id } });
  if (!acao) {
    return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 });
  }

  if (acao.colaboradorId !== colaborador.id && !colaborador.isAdmin) {
    return NextResponse.json(
      { error: "Você só pode remover suas próprias ações" },
      { status: 403 },
    );
  }

  try {
    await prisma.acaoPontuada.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/pa/acoes DELETE]", err);
    return NextResponse.json({ error: "Falha ao remover" }, { status: 500 });
  }
}
