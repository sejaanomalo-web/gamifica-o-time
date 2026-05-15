// PATCH /api/profile — colaborador atualiza próprio nome/email.
// Refatorado pra sistema PA: salva em Colaborador (não User legado).
// Se trocar email, atualiza no auth.users também — o link entre
// auth.user e colaborador é via email.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireColaboradorPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
});

export async function PATCH(req: Request) {
  const colab = await requireColaboradorPA();
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { name, email } = parsed.data;

  // Se trocou email, atualiza no auth.users também
  if (email !== colab.email) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  await prisma.colaborador.update({
    where: { id: colab.id },
    data: { nome: name, email },
  });

  return NextResponse.json({ ok: true });
}
