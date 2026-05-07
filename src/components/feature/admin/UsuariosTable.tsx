"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";

interface UserRow {
  id: string;
  name: string;
  email: string;
  area: string | null;
  role: "COLABORADOR" | "ADMIN";
}

export function UsuariosTable({ users }: { users: UserRow[] }) {
  const [selected, setSelected] = useState<UserRow | null>(null);

  if (users.length === 0) {
    return (
      <p className="text-faint text-sm py-12 text-center ano-card-flat">
        Sem usuários ainda. Use{" "}
        <span className="text-[#C9953A]">Adicionar usuário</span> pra criar a
        primeira conta.
      </p>
    );
  }

  return (
    <>
      <div className="ano-card-flat overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Nome</th>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Email</th>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Área</th>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Role</th>
              <th className="px-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr
                key={u.id}
                onClick={() => setSelected(u)}
                className="cursor-pointer transition-colors hover:bg-white/[0.03] group"
                style={{
                  borderBottom:
                    i < users.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <td className="px-5 py-3 text-white">{u.name}</td>
                <td className="px-5 py-3 text-mid">{u.email}</td>
                <td className="px-5 py-3 text-mid">{u.area ?? "—"}</td>
                <td className="px-5 py-3 label-caps text-[10px]">{u.role}</td>
                <td className="pr-3 text-right">
                  <ChevronRight
                    size={16}
                    className="text-mid transition-all group-hover:text-[#C9953A] group-hover:translate-x-0.5"
                    style={{ transitionTimingFunction: "var(--ease-academia)" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-faint text-xs">
        Clica em um usuário pra editar email, senha, área, role ou remover do sistema.
      </p>

      <EditUserDialog
        open={!!selected}
        user={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
