// PATCH /api/admin/users/[id] — admin edita campos do colaborador.
// DELETE /api/admin/users/[id] — admin remove colaborador (auth + Prisma).
//
// Refatorado pra sistema PA: tabela colaboradores + funcoes[] + isAdmin.
// Senha NUNCA é retornada/exibida (hash no auth.users). Pra trocar,
// admin manda nova senha → setamos no auth e devolvemos pro admin
// compartilhar manualmente.

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

const PatchBody = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  funcoes: z.array(z.enum(FUNCOES_PERMITIDAS)).min(1).optional(),
  isAdmin: z.boolean().optional(),
  ativo: z.boolean().optional(),
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
  await requireAdminPA();
  const { id } = await ctx.params;

  const json = await req.json();
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 },
    );
  }

  const target = await prisma.colaborador.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
  }

  const { name, email, funcoes, isAdmin, ativo, password } = parsed.data;

  // Se troca de email, valida duplicata
  if (email && email !== target.email) {
    const dupe = await prisma.colaborador.findUnique({ where: { email } });
    if (dupe) {
      return NextResponse.json(
        { error: "Já existe outro colaborador com esse email." },
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

  // Atualiza auth.users (email + senha + name no metadata) se mudou
  const authPatch: { email?: string; password?: string; user_metadata?: { name?: string } } = {};
  if (email && email !== target.email) authPatch.email = email;
  if (password) authPatch.password = password;
  if (name && name !== target.nome) authPatch.user_metadata = { name };

  if (Object.keys(authPatch).length > 0) {
    const { error: authErr } = await admin.auth.admin.updateUserById(authUserId, authPatch);
    if (authErr) {
      return NextResponse.json(
        { error: `Falha no Supabase Auth: ${authErr.message}` },
        { status: 500 },
      );
    }
  }

  // Atualiza public.colaboradores
  const updated = await prisma.colaborador.update({
    where: { id },
    data: {
      ...(name !== undefined ? { nome: name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(funcoes !== undefined ? { funcoes } : {}),
      ...(isAdmin !== undefined ? { isAdmin } : {}),
      ...(ativo !== undefined ? { ativo } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      email: updated.email,
      nome: updated.nome,
      funcoes: updated.funcoes,
      isAdmin: updated.isAdmin,
      ativo: updated.ativo,
    },
    // Devolve a senha em claro APENAS quando admin acabou de definir uma nova.
    newPassword: password ?? null,
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const adminColab = await requireAdminPA();
  const { id } = await ctx.params;

  if (id === adminColab.id) {
    return NextResponse.json(
      { error: "Você não pode remover sua própria conta." },
      { status: 400 },
    );
  }

  const target = await prisma.colaborador.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
  }

  const admin = createAdminClient();
  const authUserId = await findAuthUserIdByEmail(target.email);
  if (authUserId) {
    await admin.auth.admin.deleteUser(authUserId).catch((err) => {
      console.error("Falha removendo do auth.users", err);
    });
  }

  try {
    await prisma.colaborador.delete({ where: { id } });
  } catch (err) {
    // FK constraint: tem ações registradas → desativa em vez de remover
    console.error("delete colaborador failed, deactivating instead:", err);
    await prisma.colaborador.update({
      where: { id },
      data: { ativo: false },
    });
    return NextResponse.json({
      ok: true,
      desativado: true,
      message:
        "Colaborador tem ações registradas. Conta foi desativada (não removida) pra preservar histórico.",
    });
  }
  return NextResponse.json({ ok: true });
}
