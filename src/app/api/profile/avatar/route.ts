// PATCH /api/profile/avatar — atualiza só o avatarUrl do User logado.
// O upload em si vai pro Supabase Storage direto do client (RLS controla),
// aqui apenas persistimos a URL pública na tabela.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  avatarUrl: z.url().max(2048).nullable(),
});

export async function PATCH(req: Request) {
  const user = await requireAppUser();
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: parsed.data.avatarUrl },
  });
  return NextResponse.json({ ok: true, avatarUrl: parsed.data.avatarUrl });
}
