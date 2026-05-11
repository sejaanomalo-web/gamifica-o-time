// Auth do sistema PA — separado do auth atual (que usa tabela User).
// Carrega o Colaborador correspondente pelo email do auth.user.
// Coexiste com lib/auth.ts até o sistema antigo ser desativado.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function requireColaboradorPA() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) redirect("/login");

  const colaborador = await prisma.colaborador.findUnique({
    where: { email: authUser.email },
  });

  if (!colaborador || !colaborador.ativo) {
    // Auth válido mas não tem row em colaboradores (ou foi desativado).
    // Manda pro dashboard antigo se for usuário do sistema legado;
    // senão pra login.
    redirect("/dashboard");
  }

  return colaborador;
}

export async function requireAdminPA() {
  const colaborador = await requireColaboradorPA();
  if (!colaborador.isAdmin) redirect("/pa");
  return colaborador;
}
