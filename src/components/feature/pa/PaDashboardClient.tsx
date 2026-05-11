"use client";

// Client island do dashboard PA: botão "+" pra abrir o sheet de registrar.

import { useState } from "react";
import { Plus } from "lucide-react";
import { RegistrarAcaoSheet, type Atividade } from "./RegistrarAcaoSheet";

interface Props {
  colaboradorId: string;
  funcoes: string[];
  atividades: Atividade[];
}

export function PaDashboardClient({ colaboradorId, funcoes, atividades }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-pill btn-gold w-full md:w-auto md:px-10"
        style={{ height: 56, fontSize: 14, fontWeight: 700 }}
      >
        <Plus size={18} />
        Registrar atividade
      </button>

      <RegistrarAcaoSheet
        open={open}
        onOpenChange={setOpen}
        colaboradorId={colaboradorId}
        funcoes={funcoes}
        atividades={atividades}
      />
    </>
  );
}
