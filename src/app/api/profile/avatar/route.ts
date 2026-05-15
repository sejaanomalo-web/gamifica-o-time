// PATCH /api/profile/avatar — atualiza avatarUrl do colaborador logado.
// O upload em si vai pro Supabase Storage direto do client (RLS controla),
// aqui apenas persistimos a URL pública na tabela colaboradores.
//
// Refatorado pra sistema PA: salva em Colaborador.avatarUrl (não no
// User.avatarUrl legado). Assim Time/Equipe/Relatórios/TopBar mostram
// a foto nova na hora — todas as telas leem de colaboradores.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireColaboradorPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  avatarUrl: z.string().url().max(2048).nullable(),
});

export async function PATCH(req: Request) {
  const colab = await requireColaboradorPA();
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }
  await prisma.colaborador.update({
    where: { id: colab.id },
    data: { avatarUrl: parsed.data.avatarUrl },
  });
  return NextResponse.json({ ok: true, avatarUrl: parsed.data.avatarUrl });
}
