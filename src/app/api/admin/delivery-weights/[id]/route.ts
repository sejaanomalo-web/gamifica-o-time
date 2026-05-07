// PATCH /api/admin/delivery-weights/[id] — edita categoria/peso/grupo/active.
// DELETE /api/admin/delivery-weights/[id] — remove categoria.
//   Se houver Delivery referenciando, retorna 409 (FK constraint).

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PatchBody = z.object({
  category: z.string().min(1).optional(),
  group: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  weight: z.number().positive().optional(),
  active: z.boolean().optional(),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) data[k] = v;
  }
  if (typeof data.category === "string") data.category = (data.category as string).trim();

  try {
    await prisma.deliveryWeight.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome" },
        { status: 409 },
      );
    }
    console.error("[api/admin/delivery-weights PATCH]", err);
    return NextResponse.json({ error: "Falha ao atualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;

  // Bloqueia exclusão se houver entregas registradas — a alternativa
  // segura é desativar (active=false), preservando histórico.
  const inUse = await prisma.delivery.count({ where: { weightId: id } });
  if (inUse > 0) {
    return NextResponse.json(
      {
        error: `Categoria com ${inUse} entrega${inUse > 1 ? "s" : ""} registrada${inUse > 1 ? "s" : ""}. Desative em vez de remover (preserva histórico).`,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.deliveryWeight.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/delivery-weights DELETE]", err);
    return NextResponse.json({ error: "Falha ao remover categoria" }, { status: 500 });
  }
}
