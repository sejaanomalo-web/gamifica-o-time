import { prisma } from "@/lib/prisma";
import { UsuariosHeader } from "@/components/feature/admin/UsuariosHeader";

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
    () => prisma.user.findMany({ orderBy: { name: "asc" } }),
    [] as Awaited<ReturnType<typeof prisma.user.findMany>>,
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
      <UsuariosHeader />

      <div className="ano-card-flat overflow-hidden">
        {users.length === 0 ? (
          <p className="text-faint text-sm py-12 text-center">
            Sem usuários ainda. Use <span className="text-[#C9953A]">Adicionar usuário</span> pra
            criar a primeira conta.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Nome</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Email</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Área</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: i < users.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <td className="px-5 py-3 text-white">{u.name}</td>
                  <td className="px-5 py-3 text-mid">{u.email}</td>
                  <td className="px-5 py-3 text-mid">{u.area ?? "—"}</td>
                  <td className="px-5 py-3 label-caps text-[10px]">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
