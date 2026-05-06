"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { AddUserDialog } from "./AddUserDialog";

export function UsuariosHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
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
        <button onClick={() => setOpen(true)} className="btn-pill btn-gold">
          <UserPlus size={14} />
          Adicionar usuário
        </button>
      </div>
      <AddUserDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
