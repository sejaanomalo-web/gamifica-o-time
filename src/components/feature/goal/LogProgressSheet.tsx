"use client";

// Daily delivery logger — bottom sheet with repeatable rows.
// Material list ported from the design prototype. XP estimate = qty * 40 (display only;
// real XP is computed server-side from delivery weight at registration).

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Plus, X, ChevronDown, Minus, Check } from "lucide-react";
import { toast } from "sonner";

const MATERIAL_OPTIONS = [
  "Carrosséis difíceis",
  "Estáticos",
  "Stories em vídeo",
  "Stories em foto",
  "Vídeo do Youtube",
  "Reels",
  "Carrosséis fáceis",
] as const;

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
          className="fixed inset-0 z-40 flex flex-col justify-end"
          initial={{ background: "rgba(0,0,0,0)" }}
          animate={{ background: "rgba(0,0,0,0.55)" }}
          exit={{ background: "rgba(0,0,0,0)" }}
          transition={{ duration: 0.3 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="bg-anomalo-surface border-t border-anomalo-gold-hair max-h-[90vh] flex flex-col"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="px-5 py-5 flex items-start justify-between border-b border-anomalo-gold-hair flex-shrink-0">
              <div>
                <span className="label-caps text-anomalo-gold mb-2 block">Diário · Hoje</span>
                <h2 className="text-h3 uppercase text-anomalo-white" style={{ letterSpacing: "-0.025em" }}>
                  O que você<br />entregou?
                </h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Fechar"
                className="border border-anomalo-gold-hair p-2 hover:border-anomalo-gold transition-colors"
              >
                <X size={16} className="text-anomalo-white/80" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
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
              <button
                onClick={addRow}
                className="mt-3 w-full border border-anomalo-gold-hair text-anomalo-gold py-3.5 label-caps flex items-center justify-center gap-2 hover:bg-anomalo-gold-ghost transition-colors"
              >
                <Plus size={14} />
                Adicionar mais uma entrega
              </button>
            </div>

            <div className="px-5 py-4 border-t border-anomalo-gold-hair bg-anomalo-black flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="label-caps text-anomalo-sand">Total do dia</span>
                <span className="font-black text-anomalo-gold text-2xl tabular-nums">
                  {totalQty}
                  <span className="label-caps text-anomalo-sand ml-2">+{totalQty * 40} XP</span>
                </span>
              </div>
              <button
                disabled={!valid || submitting}
                onClick={onSubmit}
                className="w-full py-4 label-caps disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                style={{ background: "#C9953A", color: "#000" }}
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
  return (
    <div
      className="border p-3.5 transition-colors"
      style={{
        borderColor: row.material ? "#C9953A" : "rgba(201,149,58,0.32)",
        background: row.material ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="label-caps text-anomalo-gold">
          Entrega {String(index).padStart(2, "0")}
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="label-caps text-anomalo-muted hover:text-anomalo-sand transition-colors"
          >
            Remover
          </button>
        )}
      </div>
      <div className="flex gap-2.5 items-stretch">
        <div className="flex-1 relative min-w-0">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full h-11 px-3.5 text-sm text-left flex items-center justify-between border outline-none transition-colors"
            style={{
              borderColor: open ? "#C9953A" : "rgba(255,255,255,0.10)",
              color: row.material ? "#FFF" : "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <span className="truncate">{row.material || "Tipo de material"}</span>
            <ChevronDown
              size={12}
              className="ml-2 text-anomalo-gold transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
            />
          </button>
          {open && (
            <div
              className="absolute top-[calc(100%+4px)] left-0 right-0 z-10 max-h-60 overflow-y-auto border border-anomalo-gold-hair bg-anomalo-surface shadow-xl"
            >
              {MATERIAL_OPTIONS.map((opt) => {
                const sel = opt === row.material;
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      onChange({ material: opt });
                      setOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-3 text-sm flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                    style={{
                      color: sel ? "#E0B25A" : "#FFF",
                      fontWeight: sel ? 700 : 500,
                      background: sel ? "rgba(201,149,58,0.10)" : "transparent",
                    }}
                  >
                    {opt}
                    {sel && <Check size={14} className="text-anomalo-gold" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div
          className="w-24 h-11 flex items-center border overflow-hidden flex-shrink-0"
          style={{
            borderColor: Number(row.qty) > 0 ? "#C9953A" : "rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <button
            type="button"
            onClick={() => onChange({ qty: String(Math.max(0, (Number(row.qty) || 0) - 1)) })}
            className="w-8 h-full text-anomalo-sand hover:text-anomalo-white transition-colors"
            aria-label="Diminuir"
          >
            <Minus size={14} className="mx-auto" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={row.qty}
            onChange={(e) => onChange({ qty: e.target.value.replace(/[^0-9]/g, "") })}
            placeholder="0"
            className="flex-1 min-w-0 bg-transparent text-center text-base font-bold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            style={{ MozAppearance: "textfield" }}
          />
          <button
            type="button"
            onClick={() => onChange({ qty: String((Number(row.qty) || 0) + 1) })}
            className="w-8 h-full text-anomalo-gold hover:text-anomalo-gold-bright transition-colors"
            aria-label="Aumentar"
          >
            <Plus size={14} className="mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
