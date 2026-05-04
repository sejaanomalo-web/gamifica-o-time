import { prisma } from "@/lib/prisma";

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h2 uppercase text-anomalo-white">Usuários.</h1>
        <button className="label-caps px-4 py-2.5" style={{ background: "#C9953A", color: "#000" }}>
          Convidar usuário
        </button>
      </div>

      <div className="border border-anomalo-gold-hair">
        {users.length === 0 ? (
          <p className="text-anomalo-muted text-sm py-12 text-center">
            Sem usuários ainda. Rode `npx prisma db seed` pra criar Vinicius e Emanuel.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-anomalo-gold-hair">
                <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Nome</th>
                <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Email</th>
                <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Área</th>
                <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-anomalo-white">{u.name}</td>
                  <td className="px-4 py-3 text-anomalo-sand">{u.email}</td>
                  <td className="px-4 py-3 text-anomalo-sand">{u.area ?? "—"}</td>
                  <td className="px-4 py-3 label-caps text-anomalo-gold text-[10px]">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
