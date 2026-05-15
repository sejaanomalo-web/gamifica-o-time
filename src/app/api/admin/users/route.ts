// POST /api/admin/users — admin cria conta + login pra novo colaborador.
// 1. Cria entrada em auth.users via Supabase Admin API (service role).
// 2. Cria registro em public.colaboradores com o mesmo email — é assim
//    que o sistema PA associa auth.user → colaborador (via email).
// 3. Devolve as credenciais pro admin compartilhar manualmente.
//
// Refatorado pra sistema PA: usa Colaborador + funcoes[] + isAdmin em
// vez de User + area + role.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

const FUNCOES_PERMITIDAS = [
  "sdr",
  "design",
  "trafego",
  "social_midia",
  "video_maker",
  "closer",
] as const;

const Body = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  funcoes: z.array(z.enum(FUNCOES_PERMITIDAS)).min(1, "Selecione ao menos uma função"),
  isAdmin: z.boolean().default(false),
});

export async function POST(req: Request) {
  await requireAdminPA();
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 },
    );
  }
  const { name, email, password, funcoes, isAdmin } = parsed.data;

  const existing = await prisma.colaborador.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe um colaborador com esse email." },
      { status: 409 },
    );
  }

  const supabase = createAdminClient();
  const { data: created, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authErr || !created.user) {
    return NextResponse.json(
      { error: authErr?.message ?? "Falha criando login no Supabase Auth." },
      { status: 500 },
    );
  }

  try {
    const colab = await prisma.colaborador.create({
      data: {
        email,
        nome: name,
        funcoes,
        isAdmin,
      },
    });
    return NextResponse.json({
      ok: true,
      user: {
        id: colab.id,
        email: colab.email,
        nome: colab.nome,
        funcoes: colab.funcoes,
        isAdmin: colab.isAdmin,
      },
    });
  } catch (err) {
    // rollback do auth se a inserção em colaboradores falhou
    await supabase.auth.admin.deleteUser(created.user.id).catch(() => {});
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Falha criando Colaborador.",
      },
      { status: 500 },
    );
  }
}
