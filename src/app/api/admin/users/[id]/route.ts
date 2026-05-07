// PATCH /api/admin/users/[id] — admin edita campos do usuário.
// DELETE /api/admin/users/[id] — admin remove usuário (auth + Prisma).
//
// Senha NUNCA é retornada/exibida (hash no auth.users). Pra trocar,
// admin manda nova senha → setamos no auth e devolvemos pro admin
// compartilhar manualmente. Não há "ver senha atual".

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

const PatchBody = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.email().optional(),
  area: z.string().max(80).nullable().optional(),
  role: z.enum(["COLABORADOR", "ADMIN"]).optional(),
  // se ausente: não troca senha. Se presente: troca.
  password: z.string().min(8).max(128).optional(),
});

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  // listUsers paginado — varre até achar (ok pra time pequeno)
  let page = 1;
  while (page < 50) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < 200) break;
    page++;
  }
  return null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await ctx.params;

  const json = await req.json();
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const { name, email, area, role, password } = parsed.data;

  // Se troca de email, valida duplicata
  if (email && email !== target.email) {
    const dupe = await prisma.user.findUnique({ where: { email } });
    if (dupe) {
      return NextResponse.json(
        { error: "Já existe outro usuário com esse email." },
        { status: 409 },
      );
    }
  }

  const admin = createAdminClient();

  // Resolve auth user id pelo email atual
  const authUserId = await findAuthUserIdByEmail(target.email);
  if (!authUserId) {
    return NextResponse.json(
      {
        error:
          "Não achei o login no Supabase Auth pra esse email. Talvez tenha sido removido do auth manualmente.",
      },
      { status: 404 },
    );
  }

  // Atualiza auth.users (email + senha) se mudou
  const authPatch: { email?: string; password?: string; user_metadata?: { name?: string } } = {};
  if (email && email !== target.email) authPatch.email = email;
  if (password) authPatch.password = password;
  if (name && name !== target.name) authPatch.user_metadata = { name };

  if (Object.keys(authPatch).length > 0) {
    const { error: authErr } = await admin.auth.admin.updateUserById(authUserId, authPatch);
    if (authErr) {
      return NextResponse.json(
        { error: `Falha no Supabase Auth: ${authErr.message}` },
        { status: 500 },
      );
    }
  }

  // Atualiza public.User
  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(area !== undefined ? { area } : {}),
      ...(role !== undefined ? { role } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      area: updated.area,
    },
    // Devolve a senha em claro APENAS quando admin acabou de definir uma nova.
    // Aparece uma vez na UI pra ele compartilhar com o colaborador.
    newPassword: password ?? null,
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const adminUser = await requireAdmin();
  const { id } = await ctx.params;

  if (id === adminUser.id) {
    return NextResponse.json(
      { error: "Você não pode remover sua própria conta." },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const admin = createAdminClient();
  const authUserId = await findAuthUserIdByEmail(target.email);
  if (authUserId) {
    await admin.auth.admin.deleteUser(authUserId).catch((err) => {
      console.error("Falha removendo do auth.users", err);
    });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
