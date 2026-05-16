// Auth do sistema PA — separado do auth atual (que usa tabela User).
// Carrega o Colaborador correspondente pelo email do auth.user.
// Coexiste com lib/auth.ts até o sistema antigo ser desativado.

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Dedupe por request: layout + page + outros server components que chamarem
// getCachedAuthUser() durante o mesmo render compartilham 1 round-trip ao
// Supabase Auth em vez de 2-3.
export const getCachedAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Mesma dedup pro lookup do colaborador no Postgres.
export const getCachedColaborador = cache(async (email: string) => {
  return prisma.colaborador.findUnique({ where: { email } });
});

// Saldo PA lifetime (acumulável) = PA ganho − PA gasto em resgates.
// Calculado uma vez por request — layout (TopBar) e /pa/loja compartilham.
export const getCachedPaSaldo = cache(async (colaboradorId: string) => {
  const [paAgg, resgatesAgg] = await Promise.all([
    prisma.acaoPontuada.aggregate({
      where: { colaboradorId, status: { not: "REJEITADA" } },
      _sum: { paGerado: true },
    }),
    prisma.lojaResgate.aggregate({
      where: { colaboradorId, status: { not: "REJEITADO" } },
      _sum: { paGasto: true },
    }),
  ]);
  const acumulado = Number(paAgg._sum.paGerado ?? 0);
  const gasto = Number(resgatesAgg._sum.paGasto ?? 0);
  return { acumulado, gasto, saldo: Math.max(0, acumulado - gasto) };
});

export async function requireColaboradorPA() {
  const authUser = await getCachedAuthUser();

  if (!authUser?.email) redirect("/login");

  const colaborador = await getCachedColaborador(authUser.email);

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
