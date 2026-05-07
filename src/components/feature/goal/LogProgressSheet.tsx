"use client";

// Daily delivery logger — bottom sheet with repeatable rows.
// Categorias e pesos batem com a tabela oficial do plano de comissionamento
// e com o seed do banco (DeliveryWeight).
// XP = qty × peso (somatório direto, sem multiplicar por nada extra).
// Ex: 2 Reels (peso 1.5) = 1.5 + 1.5 = 3 XP.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Plus, X, ChevronDown, Minus } from "lucide-react";
import { toast } from "sonner";

interface MaterialGroup {
  label: "Alto" | "Médio" | "Padrão";
  weight: number;
  rationale: string;
  items: string[];
}

const MATERIAL_GROUPS: MaterialGroup[] = [
  {
    label: "Alto",
    weight: 2.0,
    rationale: "Maior tempo de edição e maior impacto.",
    items: ["Aulas", "YouTube", "VSL"],
  },
  {
    label: "Médio",
    weight: 1.5,
    rationale: "Esforço intermediário de criação e formatação.",
    items: ["Reel", "Criativo", "Carrossel"],
  },
  {
    label: "Padrão",
    weight: 1.0,
    rationale: "Edição mais simples ou em série, maior volume.",
    items: ["Estáticos", "Carrossel fácil", "Story"],
  },
];

const WEIGHT_BY_MATERIAL: Record<string, number> = MATERIAL_GROUPS.reduce(
  (acc, g) => {
    g.items.forEach((it) => {
      acc[it] = g.weight;
    });
    return acc;
  },
  {} as Record<string, number>,
);

interface LogRow {
  id: string;
  material: string;
  qty: string;
}

interface LogProgressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogProgressSheet({ open, onOpenChange }: LogProgressSheetProps) {
  const [rows, setRows] = useState<LogRow[]>([{ id: "1", material: "", qty: "" }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setRows([{ id: String(Date.now()), material: "", qty: "" }]);
  }, [open]);

  const updateRow = (id: string, patch: Partial<LogRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((rs) => [...rs, { id: String(Date.now() + Math.random()), material: "", qty: "" }]);
  const removeRow = (id: string) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));

  const valid = rows.every((r) => r.material && Number(r.qty) > 0);
  const totalQty = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
  // XP = qty × peso (somatório direto). Bate com /api/deliveries.
  const totalXp = rows.reduce((s, r) => {
    const w = WEIGHT_BY_MATERIAL[r.material] ?? 0;
    return s + (Number(r.qty) || 0) * w;
  }, 0);

  const onSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: rows.map((r) => ({ material: r.material, count: Number(r.qty) })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`+${totalQty} entregas registradas.`);
      onOpenChange(false);
    } catch {
      toast.error("Falha ao registrar. Tenta de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          initial={{ background: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
          animate={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          exit={{ background: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.35 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="flex flex-col w-full"
            style={{
              background: "#111115",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.10), 0 -20px 60px rgba(0,0,0,0.6), 0 -8px 32px rgba(201,149,58,0.18)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              // Quase fullscreen: 12px de respiro no topo pra revelar o cantinho arredondado
              height: "calc(100dvh - 12px)",
              maxHeight: "calc(100dvh - 12px)",
              marginTop: "12px",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <span
                className="rounded-full"
                style={{ width: 40, height: 4, background: "rgba(255,255,255,0.18)" }}
              />
            </div>

            <div
              className="px-6 py-5 flex items-start justify-between flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div>
                <span className="label-caps mb-2 block">Diário · Hoje</span>
                <h2
                  className="text-white"
                  style={{
                    fontSize: "1.625rem",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.025em",
                    textTransform: "uppercase",
                  }}
                >
                  O que você<br />
                  <span
                    className="text-[#C9953A]"
                    style={{
                      fontWeight: 300,
                      fontStyle: "italic",
                      textTransform: "lowercase",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    entregou?
                  </span>
                </h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Fechar"
                className="rounded-full p-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-3">
                {rows.map((r, i) => (
                  <LogRowInput
                    key={r.id}
                    index={i + 1}
                    row={r}
                    onChange={(patch) => updateRow(r.id, patch)}
                    onRemove={rows.length > 1 ? () => removeRow(r.id) : null}
                  />
                ))}
              </div>
              <button onClick={addRow} className="btn-pill btn-ghost mt-4 w-full">
                <Plus size={14} />
                Adicionar mais uma entrega
              </button>
            </div>

            <div
              className="px-6 py-5 flex-shrink-0"
              style={{
                background: "rgba(0,0,0,0.4)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="label-caps label-caps-muted">
                  Total do dia
                </span>
                <div className="text-right">
                  <span
                    className="text-mono text-white"
                    style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}
                  >
                    {totalQty}
                  </span>
                  <span className="label-caps label-caps-muted ml-3">entregas</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="label-caps label-caps-muted">
                  XP estimado
                </span>
                <span
                  className="text-mono text-[#C9953A]"
                  style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}
                >
                  +{totalXp % 1 === 0 ? totalXp.toLocaleString("pt-BR") : totalXp.toFixed(1)}
                  <span className="label-caps label-caps-muted ml-2">XP</span>
                </span>
              </div>
              <button
                disabled={!valid || submitting}
                onClick={onSubmit}
                className="btn-pill btn-gold w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Registrando…" : "Registrar entrega"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LogRowInput({
  index,
  row,
  onChange,
  onRemove,
}: {
  index: number;
  row: LogRow;
  onChange: (patch: Partial<LogRow>) => void;
  onRemove: (() => void) | null;
}) {
  const [open, setOpen] = useState(false);
  const filled = !!row.material;
  return (
    <div
      className="p-4 transition-all"
      style={{
        background: filled ? "rgba(201,149,58,0.06)" : "rgba(255,255,255,0.02)",
        borderRadius: 16,
        boxShadow: filled
          ? "inset 0 0 0 1px rgba(201,149,58,0.40)"
          : "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="label-caps">Entrega {String(index).padStart(2, "0")}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="label-caps label-caps-muted hover:text-[#fb2c36] transition-colors"
          >
            Remover
          </button>
        )}
      </div>
      <div className="flex gap-2 items-stretch">
        <div className="flex-1 relative min-w-0">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full h-11 px-4 text-sm text-left flex items-center justify-between transition-all rounded-full"
            style={{
              background: open ? "rgba(201,149,58,0.10)" : "rgba(255,255,255,0.04)",
              boxShadow: open
                ? "inset 0 0 0 1px #C9953A, 0 0 16px rgba(201,149,58,0.25)"
                : "inset 0 0 0 1px rgba(255,255,255,0.10)",
              color: row.material ? "#FFFFFF" : "rgba(255,255,255,0.40)",
            }}
          >
            <span
              className="truncate flex items-center gap-2"
              style={{ fontWeight: row.material ? 600 : 400 }}
            >
              {row.material || "Tipo de material"}
              {row.material && (
                <span
                  className="text-mono text-[#C9953A] flex-shrink-0"
                  style={{ fontSize: 11, fontWeight: 700 }}
                >
                  +{WEIGHT_BY_MATERIAL[row.material]?.toFixed(1)} XP
                </span>
              )}
            </span>
            <ChevronDown
              size={14}
              className="ml-2 transition-transform"
              style={{
                transform: open ? "rotate(180deg)" : "rotate(0)",
                color: "#C9953A",
              }}
            />
          </button>
          {open && (
            <div
              className="absolute top-[calc(100%+6px)] left-0 right-0 z-10 max-h-72 overflow-y-auto"
              style={{
                background: "#111115",
                borderRadius: 16,
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.10), 0 24px 60px rgba(0,0,0,0.6), 0 0 32px rgba(201,149,58,0.12)",
              }}
            >
              {MATERIAL_GROUPS.map((g, gi) => (
                <div key={g.label}>
                  <div
                    className="px-4 py-2 flex items-center justify-between sticky top-0 z-10"
                    style={{
                      background: "rgba(17,17,21,0.95)",
                      backdropFilter: "blur(10px)",
                      borderBottom: "1px solid rgba(201,149,58,0.20)",
                    }}
                  >
                    <span className="label-caps">{g.label}</span>
                    <span
                      className="text-mono text-[#C9953A]"
                      style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.01em" }}
                    >
                      +{g.weight.toFixed(1)} XP/un
                    </span>
                  </div>
                  {g.items.map((opt, idx) => {
                    const sel = opt === row.material;
                    const isLastInGroup = idx === g.items.length - 1;
                    const isLastGroup = gi === MATERIAL_GROUPS.length - 1;
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          onChange({ material: opt });
                          setOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-white/[0.04] transition-colors"
                        style={{
                          color: sel ? "#E0B25A" : "#FFFFFF",
                          fontWeight: sel ? 700 : 500,
                          background: sel ? "rgba(201,149,58,0.08)" : "transparent",
                          borderBottom:
                            isLastInGroup && isLastGroup
                              ? "none"
                              : "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <span>{opt}</span>
                        <span
                          className="text-mono"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: sel ? "#E0B25A" : "rgba(255,255,255,0.40)",
                          }}
                        >
                          +{g.weight.toFixed(1)} XP
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          className="w-28 h-11 flex items-center overflow-hidden flex-shrink-0 rounded-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            boxShadow:
              Number(row.qty) > 0
                ? "inset 0 0 0 1px rgba(201,149,58,0.45)"
                : "inset 0 0 0 1px rgba(255,255,255,0.10)",
          }}
        >
          <button
            type="button"
            onClick={() => onChange({ qty: String(Math.max(0, (Number(row.qty) || 0) - 1)) })}
            className="w-9 h-full text-mid hover:text-white transition-colors flex items-center justify-center"
            aria-label="Diminuir"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={row.qty}
            onChange={(e) => onChange({ qty: e.target.value.replace(/[^0-9]/g, "") })}
            placeholder="0"
            className="text-mono flex-1 min-w-0 bg-transparent text-center text-base outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            style={{ MozAppearance: "textfield", color: "#FFFFFF", fontWeight: 700 }}
          />
          <button
            type="button"
            onClick={() => onChange({ qty: String((Number(row.qty) || 0) + 1) })}
            className="w-9 h-full text-[#C9953A] hover:text-[#E0B25A] transition-colors flex items-center justify-center"
            aria-label="Aumentar"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
