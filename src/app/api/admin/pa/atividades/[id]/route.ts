// PATCH /api/admin/pa/atividades/[id] — admin edita nome/codigo/paValor/funcao/ativo/ordem.
// DELETE /api/admin/pa/atividades/[id] — remove se não houver ação registrada (senão sugere desativar).

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";

const PatchBody = z.object({
  funcao: z.enum(["sdr", "design", "trafego", "social_midia", "video_maker", "closer"]).optional(),
  nome: z.string().min(1).optional(),
  codigo: z.string().min(1).regex(/^[a-z0-9_]+$/).optional(),
  paValor: z.number().optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdminPA();
  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) data[k] = v;
  }
  if (typeof data.nome === "string") data.nome = (data.nome as string).trim();
  if (typeof data.codigo === "string") data.codigo = (data.codigo as string).trim();

  try {
    await prisma.atividadeCatalogo.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Já existe uma atividade com esse código" },
        { status: 409 },
      );
    }
    console.error("[api/admin/pa/atividades PATCH]", err);
    return NextResponse.json({ error: "Falha ao atualizar atividade" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdminPA();
  const { id } = await ctx.params;

  // Bloqueia exclusão se houver ações registradas — alternativa segura
  // é desativar (ativo=false), preservando histórico.
  const inUse = await prisma.acaoPontuada.count({ where: { atividadeId: id } });
  if (inUse > 0) {
    return NextResponse.json(
      {
        error: `Atividade com ${inUse} ${inUse > 1 ? "ações registradas" : "ação registrada"}. Desative em vez de remover (preserva histórico).`,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.atividadeCatalogo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/pa/atividades DELETE]", err);
    return NextResponse.json({ error: "Falha ao remover atividade" }, { status: 500 });
  }
}
