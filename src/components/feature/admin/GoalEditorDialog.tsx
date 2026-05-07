"use client";

// Dialog admin pra criar (ou editar) meta de um colaborador.
// Campos:
// - Colaborador (dropdown — só COLABORADORes da lista passada por prop)
// - Escopo: Permanente | Mensal | Anual
//   - Mensal: input month (YYYY-MM)
//   - Anual: input year (YYYY)
//   - Permanente: vale pra todo o período do colaborador
// - Título, KPI, target, prazo, XP, precisa evidência
//
// POST → /api/admin/goals  (criar)
// PATCH → /api/admin/goals/[id]  (editar)

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CollaboratorOption {
  id: string;
  name: string;
  area: string | null;
}

export type GoalScopeOption = "PERMANENT" | "MONTHLY" | "YEARLY";

export interface GoalEditorInitial {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  kpi: string;
  target: number;
  deadline: string; // ISO date
  xpReward: number;
  needsEvidence: boolean;
  scope: GoalScopeOption;
  monthISO: string | null;
  yearISO: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborators: CollaboratorOption[];
  initial?: GoalEditorInitial | null;
}

function defaultMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function defaultYear(): string {
  return String(new Date().getFullYear());
}

function defaultDeadline(): string {
  // 30 dias a partir de hoje
  const d = new Date(Date.now() + 30 * 86400000);
  return d.toISOString().slice(0, 10);
}

export function GoalEditorDialog({ open, onOpenChange, collaborators, initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [ownerId, setOwnerId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kpi, setKpi] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [xpReward, setXpReward] = useState("100");
  const [needsEvidence, setNeedsEvidence] = useState(false);
  const [scope, setScope] = useState<GoalScopeOption>("MONTHLY");
  const [monthISO, setMonthISO] = useState(defaultMonth());
  const [yearISO, setYearISO] = useState(defaultYear());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setOwnerId(initial.ownerId);
      setTitle(initial.title);
      setDescription(initial.description ?? "");
      setKpi(initial.kpi);
      setTarget(String(initial.target));
      setDeadline(initial.deadline.slice(0, 10));
      setXpReward(String(initial.xpReward));
      setNeedsEvidence(initial.needsEvidence);
      setScope(initial.scope);
      setMonthISO(initial.monthISO ?? defaultMonth());
      setYearISO(initial.yearISO ?? defaultYear());
    } else {
      setOwnerId(collaborators[0]?.id ?? "");
      setTitle("");
      setDescription("");
      setKpi("");
      setTarget("");
      setDeadline(defaultDeadline());
      setXpReward("100");
      setNeedsEvidence(false);
      setScope("MONTHLY");
      setMonthISO(defaultMonth());
      setYearISO(defaultYear());
    }
  }, [open, initial, collaborators]);

  const valid =
    !!ownerId &&
    title.trim().length > 0 &&
    kpi.trim().length > 0 &&
    Number(target) > 0 &&
    !!deadline &&
    (scope !== "MONTHLY" || /^\d{4}-\d{2}$/.test(monthISO)) &&
    (scope !== "YEARLY" || /^\d{4}$/.test(yearISO));

  const onSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);

    const body: Record<string, unknown> = {
      ownerId,
      title: title.trim(),
      description: description.trim() || null,
      kpi: kpi.trim(),
      target: Number(target),
      deadline: new Date(deadline).toISOString(),
      xpReward: Number(xpReward) || 0,
      needsEvidence,
      scope,
      monthISO: scope === "MONTHLY" ? monthISO : null,
      yearISO: scope === "YEARLY" ? yearISO : null,
    };

    try {
      const url = isEdit ? `/api/admin/goals/${initial!.id}` : "/api/admin/goals";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao salvar meta");
        return;
      }
      toast.success(isEdit ? "Meta atualizada." : "Meta criada.");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Falha ao salvar meta. Tenta de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!isEdit || submitting) return;
    if (!confirm("Remover essa meta? Não dá pra desfazer.")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/goals/${initial!.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Falha ao remover");
        return;
      }
      toast.success("Meta removida.");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Falha ao remover. Tenta de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
          initial={{ background: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
          animate={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          exit={{ background: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.3 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="w-full md:max-w-2xl flex flex-col max-h-[90dvh]"
            style={{
              background: "#111115",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.10), 0 -20px 60px rgba(0,0,0,0.6)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div
              className="px-6 py-5 flex items-start justify-between flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div>
                <span className="label-caps mb-1 block">Admin · Meta</span>
                <h2
                  className="text-white"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  {isEdit ? "Editar meta" : "Nova meta"}
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

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              <Field label="Colaborador">
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="input-square w-full"
                  disabled={isEdit}
                >
                  {collaborators.length === 0 && <option value="">Nenhum colaborador</option>}
                  {collaborators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.area ? ` · ${c.area}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Escopo">
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      ["PERMANENT", "Permanente"],
                      ["MONTHLY", "Mensal"],
                      ["YEARLY", "Anual"],
                    ] as [GoalScopeOption, string][]
                  ).map(([k, label]) => {
                    const on = scope === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setScope(k)}
                        className="label-caps px-4 py-2 rounded-full transition-all"
                        style={{
                          background: on ? "#C9953A" : "rgba(255,255,255,0.04)",
                          color: on ? "#1a1410" : "rgba(255,255,255,0.65)",
                          boxShadow: on
                            ? "0 0 12px rgba(201,149,58,0.30)"
                            : "inset 0 0 0 1px rgba(255,255,255,0.10)",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-mid">
                  {scope === "PERMANENT" && "Vale como padrão pra todo o período do colaborador."}
                  {scope === "MONTHLY" && "Substitui a permanente apenas no mês selecionado."}
                  {scope === "YEARLY" && "Substitui a permanente apenas no ano selecionado."}
                </p>
              </Field>

              {scope === "MONTHLY" && (
                <Field label="Mês de competência">
                  <input
                    type="month"
                    value={monthISO}
                    onChange={(e) => setMonthISO(e.target.value)}
                    className="input-square w-full"
                  />
                </Field>
              )}

              {scope === "YEARLY" && (
                <Field label="Ano de competência">
                  <input
                    type="number"
                    min={2024}
                    max={2099}
                    value={yearISO}
                    onChange={(e) => setYearISO(e.target.value.replace(/[^0-9]/g, ""))}
                    className="input-square w-full"
                  />
                </Field>
              )}

              <Field label="Título">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Bater 80 Reels esse mês"
                  className="input-square w-full"
                />
              </Field>

              <Field label="Descrição (opcional)">
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes pra contextualizar a meta"
                  className="input-square w-full resize-none py-2"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="KPI">
                  <input
                    type="text"
                    value={kpi}
                    onChange={(e) => setKpi(e.target.value)}
                    placeholder="Reels, Aulas, Pontos…"
                    className="input-square w-full"
                  />
                </Field>
                <Field label="Meta (target)">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="input-square w-full"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Prazo">
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="input-square w-full"
                  />
                </Field>
                <Field label="XP de recompensa">
                  <input
                    type="number"
                    min={0}
                    value={xpReward}
                    onChange={(e) => setXpReward(e.target.value.replace(/[^0-9]/g, ""))}
                    className="input-square w-full"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-mid">
                <input
                  type="checkbox"
                  checked={needsEvidence}
                  onChange={(e) => setNeedsEvidence(e.target.checked)}
                  className="accent-[#C9953A]"
                />
                Exigir evidência pra concluir
              </label>
            </div>

            <div
              className="px-6 py-4 flex-shrink-0 flex items-center gap-3 flex-wrap"
              style={{
                background: "rgba(0,0,0,0.4)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {isEdit && (
                <button
                  onClick={onDelete}
                  disabled={submitting}
                  className="btn-pill btn-ghost text-[#fb2c36] disabled:opacity-40"
                >
                  Remover
                </button>
              )}
              <button
                disabled={!valid || submitting}
                onClick={onSubmit}
                className="btn-pill btn-gold ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Salvando…" : isEdit ? "Salvar" : "Criar meta"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-caps label-caps-muted block mb-2">{label}</label>
      {children}
    </div>
  );
}
