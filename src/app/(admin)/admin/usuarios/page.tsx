import { prisma } from "@/lib/prisma";
import { UsuariosHeader } from "@/components/feature/admin/UsuariosHeader";
import { UsuariosTable } from "@/components/feature/admin/UsuariosTable";
import type { FuncaoCodigo } from "@/lib/pa";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/usuarios] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsuariosPage() {
  const users = await safe(
    "colaborador.findMany",
    () =>
      prisma.colaborador.findMany({
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          email: true,
          funcoes: true,
          isAdmin: true,
          ativo: true,
        },
      }),
    [] as Array<{
      id: string;
      nome: string;
      email: string;
      funcoes: FuncaoCodigo[];
      isAdmin: boolean;
      ativo: boolean;
    }>,
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
      <UsuariosHeader />
      <UsuariosTable users={users} />
    </div>
  );
}
