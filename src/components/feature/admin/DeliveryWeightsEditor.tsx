"use client";

// CRUD de categorias e pesos. Linha por categoria com edição inline:
// - category (texto), group (chip High/Medium/Low), weight (número)
// - toggle active/inactive
// - remover (bloqueado se houver Delivery referenciando — backend retorna 409)
// - "Nova categoria" cria uma row em modo edição.
//
// Quando o admin sai do input (blur), salva via PATCH. Pra criação,
// botão explícito "Salvar".

import { useState } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Group = "HIGH" | "MEDIUM" | "LOW";

export interface WeightRow {
  id: string;
  category: string;
  group: Group;
  weight: number;
  active: boolean;
}

const GROUP_LABEL: Record<Group, string> = {
  HIGH: "Alto",
  MEDIUM: "Médio",
  LOW: "Padrão",
};

const GROUP_COLOR: Record<Group, string> = {
  HIGH: "#E0B25A",
  MEDIUM: "#C9953A",
  LOW: "#8A7850",
};

const GROUPS: Group[] = ["HIGH", "MEDIUM", "LOW"];

export function DeliveryWeightsEditor({ rows }: { rows: WeightRow[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Partial<WeightRow>>>({});
  const [creating, setCreating] = useState<{
    category: string;
    group: Group;
    weight: string;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setDraft = (id: string, patch: Partial<WeightRow>) =>
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...patch } }));

  const merged = (r: WeightRow): WeightRow => ({ ...r, ...(drafts[r.id] ?? {}) });

  const dirty = (r: WeightRow): boolean => {
    const d = drafts[r.id];
    if (!d) return false;
    return (
      (d.category !== undefined && d.category !== r.category) ||
      (d.group !== undefined && d.group !== r.group) ||
      (d.weight !== undefined && d.weight !== r.weight) ||
      (d.active !== undefined && d.active !== r.active)
    );
  };

  const saveRow = async (r: WeightRow) => {
    const m = merged(r);
    if (!dirty(r)) return;
    if (!m.category.trim() || !(m.weight > 0)) {
      toast.error("Categoria e peso são obrigatórios");
      return;
    }
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/delivery-weights/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: m.category.trim(),
          group: m.group,
          weight: Number(m.weight),
          active: m.active,
        }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao salvar");
        return;
      }
      toast.success("Categoria atualizada.");
      setDrafts((d) => {
        const { [r.id]: _omit, ...rest } = d;
        void _omit;
        return rest;
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const removeRow = async (r: WeightRow) => {
    if (!confirm(`Remover "${r.category}"? Não dá pra desfazer.`)) return;
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/delivery-weights/${r.id}`, { method: "DELETE" });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao remover");
        return;
      }
      toast.success("Categoria removida.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const createRow = async () => {
    if (!creating) return;
    if (!creating.category.trim() || !(Number(creating.weight) > 0)) {
      toast.error("Categoria e peso são obrigatórios");
      return;
    }
    setBusyId("__new__");
    try {
      const res = await fetch("/api/admin/delivery-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: creating.category.trim(),
          group: creating.group,
          weight: Number(creating.weight),
        }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao criar");
        return;
      }
      toast.success("Categoria criada.");
      setCreating(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="label-caps label-caps-muted">Pesos das categorias</h2>
        {!creating && (
          <button
            onClick={() =>
              setCreating({ category: "", group: "MEDIUM", weight: "1.5" })
            }
            className="btn-pill btn-gold"
            style={{ height: 36, padding: "0 16px", fontSize: 11 }}
          >
            <Plus size={12} />
            Nova categoria
          </button>
        )}
      </div>

      <div className="ano-card-flat overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Categoria</th>
              <th className="text-left px-5 py-3 label-caps label-caps-muted">Grupo</th>
              <th className="text-right px-5 py-3 label-caps label-caps-muted">Peso</th>
              <th className="text-center px-5 py-3 label-caps label-caps-muted">Ativa</th>
              <th className="px-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {creating && (
              <tr style={{ background: "rgba(201,149,58,0.05)" }}>
                <td className="px-5 py-3">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nome da categoria"
                    value={creating.category}
                    onChange={(e) =>
                      setCreating({ ...creating, category: e.target.value })
                    }
                    className="input-square w-full"
                  />
                </td>
                <td className="px-5 py-3">
                  <GroupChips
                    value={creating.group}
                    onChange={(g) => setCreating({ ...creating, group: g })}
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={creating.weight}
                    onChange={(e) =>
                      setCreating({ ...creating, weight: e.target.value })
                    }
                    className="input-square w-20 text-right"
                  />
                </td>
                <td className="px-5 py-3 text-center label-caps label-caps-muted text-[10px]">
                  Sim
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={createRow}
                      disabled={busyId === "__new__"}
                      aria-label="Salvar"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[#C9953A] hover:bg-white/[0.04] disabled:opacity-40"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setCreating(null)}
                      aria-label="Cancelar"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-mid hover:bg-white/[0.04]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((r, i) => {
              const m = merged(r);
              const isDirty = dirty(r);
              const isBusy = busyId === r.id;
              return (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    opacity: m.active ? 1 : 0.5,
                  }}
                >
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      value={m.category}
                      onChange={(e) => setDraft(r.id, { category: e.target.value })}
                      className="input-square w-full"
                      style={{ background: "transparent" }}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <GroupChips
                      value={m.group}
                      onChange={(g) => setDraft(r.id, { group: g })}
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={m.weight}
                      onChange={(e) => setDraft(r.id, { weight: Number(e.target.value) })}
                      className="input-square w-20 text-right"
                    />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <label className="inline-flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.active}
                        onChange={(e) => setDraft(r.id, { active: e.target.checked })}
                        className="accent-[#C9953A]"
                      />
                    </label>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isDirty && (
                        <button
                          onClick={() => saveRow(r)}
                          disabled={isBusy}
                          aria-label="Salvar"
                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#C9953A] hover:bg-white/[0.04] disabled:opacity-40"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => removeRow(r)}
                        disabled={isBusy}
                        aria-label="Remover"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-[#fb2c36] hover:bg-white/[0.04] disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-faint text-xs">
        <strong className="text-mid">Alto</strong> · 2.0× ·{" "}
        <strong className="text-mid">Médio</strong> · 1.5× ·{" "}
        <strong className="text-mid">Padrão</strong> · 1.0×. Categorias com entregas
        registradas só podem ser desativadas (não removidas) pra preservar histórico.
      </p>
    </div>
  );
}

function GroupChips({
  value,
  onChange,
}: {
  value: Group;
  onChange: (g: Group) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {GROUPS.map((g) => {
        const on = g === value;
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className="label-caps text-[10px] px-3 py-1 rounded-full transition-all"
            style={{
              background: on ? "rgba(201,149,58,0.10)" : "rgba(255,255,255,0.03)",
              color: on ? GROUP_COLOR[g] : "rgba(255,255,255,0.45)",
              boxShadow: on
                ? `inset 0 0 0 1px ${GROUP_COLOR[g]}66`
                : "inset 0 0 0 1px rgba(255,255,255,0.08)",
            }}
          >
            {GROUP_LABEL[g]}
          </button>
        );
      })}
    </div>
  );
}
