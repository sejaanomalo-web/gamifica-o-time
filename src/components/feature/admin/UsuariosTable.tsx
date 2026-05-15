"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";
import { FUNCAO_LABEL, type FuncaoCodigo } from "@/lib/pa";

export interface UserRow {
  id: string;
  nome: string;
  email: string;
  funcoes: FuncaoCodigo[];
  isAdmin: boolean;
  ativo: boolean;
}

export function UsuariosTable({ users }: { users: UserRow[] }) {
  const [selected, setSelected] = useState<UserRow | null>(null);

  if (users.length === 0) {
    return (
      <p className="text-faint text-sm py-12 text-center ano-card-flat">
        Sem colaboradores ainda. Use{" "}
        <span className="text-[#C9953A]">Adicionar usuário</span> pra criar a
        primeira conta.
      </p>
    );
  }

  return (
    <>
      <div className="ano-card-flat overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: 720 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Nome</th>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Email</th>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Funções</th>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Papel</th>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Status</th>
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
                  opacity: u.ativo ? 1 : 0.5,
                }}
              >
                <td className="px-5 py-3 text-white">{u.nome}</td>
                <td className="px-5 py-3 text-mid">{u.email}</td>
                <td className="px-5 py-3 text-mid text-xs">
                  {u.funcoes.map((f) => FUNCAO_LABEL[f] ?? f).join(" · ") || "—"}
                </td>
                <td className="px-5 py-3 label-caps text-[10px]">
                  {u.isAdmin ? "ADMIN" : "COLABORADOR"}
                </td>
                <td className="px-5 py-3 label-caps text-[10px]">
                  {u.ativo ? "Ativo" : "Inativo"}
                </td>
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
        Clica em um colaborador pra editar email, senha, funções, papel admin ou
        desativar.
      </p>

      <EditUserDialog
        open={!!selected}
        user={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
