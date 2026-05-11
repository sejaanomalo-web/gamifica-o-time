"use client";

// Client island da /pa/registrar: botão "Nova atividade" abre sheet,
// tabela do histórico com filtro mês/ano (sincroniza com URL).

import { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { RegistrarAcaoSheet, type Atividade } from "./RegistrarAcaoSheet";
import { FUNCAO_LABEL, type FuncaoCodigo } from "@/lib/pa";

interface AcaoRow {
  id: string;
  data: string;
  nome: string;
  funcao: FuncaoCodigo;
  quantidade: number;
  paGerado: number;
  cliente: string | null;
  observacao: string | null;
  status: "PENDENTE" | "APROVADA" | "REJEITADA";
}

const STATUS_LABEL: Record<AcaoRow["status"], string> = {
  PENDENTE: "Aguardando",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
};

const STATUS_COR: Record<AcaoRow["status"], string> = {
  PENDENTE: "#8A7850",
  APROVADA: "#C9953A",
  REJEITADA: "#fb2c36",
};

interface Props {
  colaboradorId: string;
  funcoes: string[];
  atividades: Atividade[];
  acoes: AcaoRow[];
  mesParam: string;
  anoParam: string;
  nomeColab: string;
}

export function RegistrarPageClient({
  colaboradorId,
  funcoes,
  atividades,
  acoes,
  mesParam,
  anoParam,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Anos disponíveis (atual + 2 anteriores)
  const anos = useMemo(() => {
    const cur = new Date().getFullYear();
    return [String(cur - 2), String(cur - 1), String(cur)];
  }, []);

  const meses = [
    { v: "01", l: "Jan" },
    { v: "02", l: "Fev" },
    { v: "03", l: "Mar" },
    { v: "04", l: "Abr" },
    { v: "05", l: "Mai" },
    { v: "06", l: "Jun" },
    { v: "07", l: "Jul" },
    { v: "08", l: "Ago" },
    { v: "09", l: "Set" },
    { v: "10", l: "Out" },
    { v: "11", l: "Nov" },
    { v: "12", l: "Dez" },
  ];

  const setFilter = (key: "mes" | "ano", value: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set(key, value);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const remover = async (a: AcaoRow) => {
    if (!confirm(`Remover esta atividade? (-${a.paGerado.toFixed(1)} PA)`)) return;
    setBusy(a.id);
    try {
      const res = await fetch(`/api/pa/acoes/${a.id}`, { method: "DELETE" });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao remover");
        return;
      }
      toast.success("Atividade removida.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-6">
      {/* Bloco de ação + filtros — visível com background próprio */}
      <div
        className="mb-5 p-4 md:p-5 flex items-center gap-3 flex-wrap rounded-2xl"
        style={{
          background: "rgba(17,17,21,0.65)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={() => setOpen(true)}
          className="btn-pill btn-gold"
          style={{ height: 44, padding: "0 22px", fontSize: 13, fontWeight: 700 }}
        >
          <Plus size={16} />
          Nova atividade
        </button>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <span className="label-caps label-caps-muted hidden md:inline">Filtrar por</span>

          {/* Mês */}
          <div className="flex flex-col gap-1">
            <span className="label-caps label-caps-muted text-[9px]">Mês</span>
            <select
              value={mesParam}
              onChange={(e) => setFilter("mes", e.target.value)}
              aria-label="Mês"
              style={{
                height: 36,
                fontSize: 12,
                padding: "0 32px 0 12px",
                background: "rgba(255,255,255,0.06)",
                color: "#FFFFFF",
                borderRadius: 999,
                boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.30)",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C9953A' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                cursor: "pointer",
              }}
            >
              <option value="all">Todos</option>
              {meses.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
          </div>

          {/* Ano */}
          <div className="flex flex-col gap-1">
            <span className="label-caps label-caps-muted text-[9px]">Ano</span>
            <select
              value={anoParam}
              onChange={(e) => setFilter("ano", e.target.value)}
              aria-label="Ano"
              style={{
                height: 36,
                fontSize: 12,
                padding: "0 32px 0 12px",
                background: "rgba(255,255,255,0.06)",
                color: "#FFFFFF",
                borderRadius: 999,
                boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.30)",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C9953A' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                cursor: "pointer",
              }}
            >
              <option value="all">Todos</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela histórico */}
      <div className="ano-card-flat overflow-hidden">
        {acoes.length === 0 ? (
          <p className="text-faint text-sm py-12 text-center">
            Nenhuma atividade nesse período. Clica em{" "}
            <span className="text-[#C9953A]">Nova atividade</span> pra começar.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left px-4 py-3 label-caps label-caps-muted">Data</th>
                <th className="text-left px-4 py-3 label-caps label-caps-muted">Atividade</th>
                <th className="text-left px-4 py-3 label-caps label-caps-muted">Função</th>
                <th className="text-right px-4 py-3 label-caps label-caps-muted">Qtd</th>
                <th className="text-right px-4 py-3 label-caps label-caps-muted">PA</th>
                <th className="text-left px-4 py-3 label-caps label-caps-muted">Status</th>
                <th className="px-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {acoes.map((a, i) => (
                <tr
                  key={a.id}
                  style={{
                    borderBottom:
                      i < acoes.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    opacity: a.status === "REJEITADA" ? 0.5 : 1,
                  }}
                >
                  <td className="px-4 py-3 text-mid text-mono text-xs">{a.data}</td>
                  <td className="px-4 py-3 text-white">{a.nome}</td>
                  <td className="px-4 py-3 label-caps text-[10px]">
                    {FUNCAO_LABEL[a.funcao] ?? a.funcao}
                  </td>
                  <td className="px-4 py-3 text-right text-mono">{a.quantidade}</td>
                  <td
                    className="px-4 py-3 text-right text-mono font-bold"
                    style={{ color: a.paGerado < 0 ? "#fb2c36" : "#C9953A" }}
                  >
                    {a.paGerado < 0 ? "" : "+"}
                    {a.paGerado.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="label-caps text-[9px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: STATUS_COR[a.status],
                        boxShadow: `inset 0 0 0 1px ${STATUS_COR[a.status]}40`,
                      }}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => remover(a)}
                      disabled={busy === a.id}
                      aria-label="Remover"
                      className="w-7 h-7 flex items-center justify-center rounded-full text-[#fb2c36] hover:bg-white/[0.04] disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RegistrarAcaoSheet
        open={open}
        onOpenChange={setOpen}
        colaboradorId={colaboradorId}
        funcoes={funcoes}
        atividades={atividades}
      />
    </div>
  );
}
