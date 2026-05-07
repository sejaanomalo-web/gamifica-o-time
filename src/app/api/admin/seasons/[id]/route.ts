// PATCH /api/admin/seasons/[id] — edita endsAt ou ativa/desativa temporada.
// DELETE /api/admin/seasons/[id] — remove temporada (bloqueado se tiver
//   XpEvent/Goal referenciando — preserva histórico).

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PatchBody = z.object({
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;

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
  if (parsed.data.startsAt) data.startsAt = new Date(parsed.data.startsAt);
  if (parsed.data.endsAt) data.endsAt = new Date(parsed.data.endsAt);
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  try {
    await prisma.$transaction(async (tx) => {
      // Se está ativando essa, desativa as outras
      if (parsed.data.isActive === true) {
        await tx.season.updateMany({
          where: { isActive: true, NOT: { id } },
          data: { isActive: false },
        });
      }
      await tx.season.update({ where: { id }, data });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/seasons PATCH]", err);
    return NextResponse.json({ error: "Falha ao atualizar temporada" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;

  // Bloqueia se houver XpEvent ou Goal referenciando — preserva histórico.
  const [xpCount, goalCount] = await Promise.all([
    prisma.xpEvent.count({ where: { seasonId: id } }),
    prisma.goal.count({ where: { seasonId: id } }),
  ]);
  if (xpCount > 0 || goalCount > 0) {
    return NextResponse.json(
      {
        error: `Temporada com ${xpCount} XP e ${goalCount} metas. Não dá pra remover, só encerrar (desativar).`,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.season.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/seasons DELETE]", err);
    return NextResponse.json({ error: "Falha ao remover temporada" }, { status: 500 });
  }
}
