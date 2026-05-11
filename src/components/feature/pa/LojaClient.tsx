"use client";

// Cards de gift cards R$50, R$100, ..., R$500. Clicar resgata.
// Mostra histórico do colaborador.

import { useState } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Resgate {
  id: string;
  valorReais: number;
  paGasto: number;
  status: "PENDENTE" | "APROVADO" | "ENTREGUE" | "REJEITADO";
  createdAt: string;
}

const STATUS_LABEL: Record<Resgate["status"], string> = {
  PENDENTE: "Aguardando admin",
  APROVADO: "Aprovado",
  ENTREGUE: "Entregue",
  REJEITADO: "Rejeitado",
};

const STATUS_COR: Record<Resgate["status"], string> = {
  PENDENTE: "#8A7850",
  APROVADO: "#C9953A",
  ENTREGUE: "#E0B25A",
  REJEITADO: "#fb2c36",
};

const VALORES = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

interface Props {
  saldo: number;
  historico: Resgate[];
}

export function LojaClient({ saldo, historico }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);

  const resgatar = async (valor: number) => {
    if (saldo < valor) {
      toast.error(`Saldo insuficiente. Você tem ${saldo.toFixed(1)} PA, precisa de ${valor} PA.`);
      return;
    }
    if (!confirm(`Resgatar gift card de R$ ${valor},00 por ${valor} PA?`)) return;
    setBusy(valor);
    try {
      const res = await fetch("/api/pa/loja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorReais: valor }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao resgatar");
        return;
      }
      toast.success(`Gift card R$ ${valor} solicitado.`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <h2 className="label-caps label-caps-muted mb-3">Gift cards disponíveis</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {VALORES.map((v) => {
          const disabled = saldo < v || busy === v;
          return (
            <button
              key={v}
              onClick={() => resgatar(v)}
              disabled={disabled}
              className="ano-card-flat p-5 text-left transition-all relative"
              style={{
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
                boxShadow:
                  !disabled
                    ? "inset 0 0 0 1px rgba(201,149,58,0.25)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            >
              <Gift size={20} className="text-[#C9953A] mb-3" strokeWidth={1.4} />
              <span
                className="text-mono text-white block"
                style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                R$ {v}
              </span>
              <span className="label-caps label-caps-muted text-[10px] mt-1 block">
                {v} PA
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="label-caps label-caps-muted mt-10 mb-3">Meus resgates</h2>
      <div className="ano-card-flat overflow-hidden">
        {historico.length === 0 ? (
          <p className="text-faint text-sm py-10 text-center">
            Você ainda não resgatou nada. Quando tiver saldo, troca um gift card aqui.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left px-4 py-3 label-caps label-caps-muted">Data</th>
                <th className="text-right px-4 py-3 label-caps label-caps-muted">Valor</th>
                <th className="text-right px-4 py-3 label-caps label-caps-muted">PA</th>
                <th className="text-left px-4 py-3 label-caps label-caps-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom:
                      i < historico.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    opacity: r.status === "REJEITADO" ? 0.5 : 1,
                  }}
                >
                  <td className="px-4 py-3 text-mid text-mono text-xs">
                    {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right text-[#C9953A] text-mono font-bold">
                    R$ {r.valorReais}
                  </td>
                  <td className="px-4 py-3 text-right text-mono text-mid">
                    {r.paGasto.toFixed(0)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="label-caps text-[9px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: STATUS_COR[r.status],
                        boxShadow: `inset 0 0 0 1px ${STATUS_COR[r.status]}40`,
                      }}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
