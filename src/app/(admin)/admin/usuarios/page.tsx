import { prisma } from "@/lib/prisma";

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
      <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
        <div>
          <span className="label-caps mb-3 block">Admin · Time</span>
          <h1
            className="text-white"
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.25rem, 6vw, 2.75rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            Quem<br />
            <span
              className="text-[#C9953A]"
              style={{
                fontWeight: 300,
                fontStyle: "italic",
                textTransform: "lowercase",
                letterSpacing: "-0.02em",
              }}
            >
              entrega.
            </span>
          </h1>
        </div>
        <button className="btn-pill btn-gold">Convidar usuário</button>
      </div>

      <div className="ano-card-flat overflow-hidden">
        {users.length === 0 ? (
          <p className="text-faint text-sm py-12 text-center">
            Sem usuários ainda. Rode <span className="text-mono text-[#C9953A]">npx prisma db seed</span> pra criar Vinicius e Emanuel.
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
