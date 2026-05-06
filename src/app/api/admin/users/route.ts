// POST /api/admin/users — admin cria conta + login pra novo colaborador.
// 1. Cria entrada em auth.users via Supabase Admin API (service role)
//    com email + senha já confirmados (auto_confirm = true)
// 2. Cria registro em public.User com mesmo email pra Prisma associar
// 3. Devolve as credenciais pro admin compartilhar manualmente

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(128),
  area: z.string().max(80).nullable().optional(),
  role: z.enum(["COLABORADOR", "ADMIN"]).optional(),
});

export async function POST(req: Request) {
  await requireAdmin();
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 },
    );
  }
  const { name, email, password, area, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe um usuário com esse email." },
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
    const dbUser = await prisma.user.create({
      data: {
        email,
        name,
        area: area ?? null,
        role: role ?? "COLABORADOR",
      },
    });
    return NextResponse.json({
      ok: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        area: dbUser.area,
      },
    });
  } catch (err) {
    // rollback do auth se a inserção em public.User falhou
    await supabase.auth.admin.deleteUser(created.user.id).catch(() => {});
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Falha criando User no Prisma.",
      },
      { status: 500 },
    );
  }
}
