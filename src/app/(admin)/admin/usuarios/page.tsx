import { prisma } from "@/lib/prisma";
import { UsuariosHeader } from "@/components/feature/admin/UsuariosHeader";
import { UsuariosTable } from "@/components/feature/admin/UsuariosTable";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/usuarios] ${label} failed:`, err);
    return fallback;
  }
}

export default async function UsuariosPage() {
  const users = await safe(
    "user.findMany",
    () =>
      prisma.user.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          area: true,
          role: true,
        },
      }),
    [] as Array<{
      id: string;
      name: string;
      email: string;
      area: string | null;
      role: "COLABORADOR" | "ADMIN";
    }>,
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
      <UsuariosHeader />
      <UsuariosTable users={users} />
    </div>
  );
}
