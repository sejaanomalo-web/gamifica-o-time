// PATCH /api/admin/pa/loja/[id] — admin atualiza status do resgate.
// Body: { status: "APROVADO" | "ENTREGUE" | "REJEITADO", observacao? }

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  status: z.enum(["APROVADO", "ENTREGUE", "REJEITADO"]),
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

  try {
    await prisma.lojaResgate.update({
      where: { id },
      data: {
        status: parsed.data.status,
        observacao: parsed.data.observacao,
        resolvidoEm: new Date(),
        resolvidoPor: admin.id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/pa/loja PATCH]", err);
    return NextResponse.json({ error: "Falha ao atualizar" }, { status: 500 });
  }
}
