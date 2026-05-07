"use client";

// Gestão de temporadas:
// - Lista todas com isActive flag, datas, contagem de XP e metas.
// - Botão "Nova temporada" — modal com duração (7/15/30/60/90 dias custom).
// - Inline: editar endsAt (estender prazo), ativar/desativar, remover (só se vazia).

import { useState } from "react";
import { Plus, Check, X, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface SeasonRow {
  id: string;
  number: number;
  startsAt: string; // ISO
  endsAt: string; // ISO
  isActive: boolean;
  xpCount: number;
  goalsCount: number;
}

const DURATION_OPTIONS = [
  { days: 7, label: "1 semana" },
  { days: 15, label: "15 dias" },
  { days: 30, label: "30 dias" },
  { days: 60, label: "2 meses" },
  { days: 90, label: "3 meses" },
];

export function SeasonManager({ seasons }: { seasons: SeasonRow[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [duration, setDuration] = useState(30);
  const [endDrafts, setEndDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const setEndDraft = (id: string, value: string) =>
    setEndDrafts((d) => ({ ...d, [id]: value }));

  const create = async () => {
    setBusy("__new__");
    try {
      const res = await fetch("/api/admin/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays: duration }),
      });
      const data: { ok?: boolean; error?: string; number?: number } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha ao criar temporada");
        return;
      }
      toast.success(`Temporada ${String(data.number).padStart(2, "0")} criada.`);
      setCreating(false);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const setActive = async (s: SeasonRow, active: boolean) => {
    setBusy(s.id);
    try {
      const res = await fetch(`/api/admin/seasons/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success(active ? "Temporada ativada." : "Temporada encerrada.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const saveEndDate = async (s: SeasonRow) => {
    const draft = endDrafts[s.id];
    if (!draft) return;
    setBusy(s.id);
    try {
      const res = await fetch(`/api/admin/seasons/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endsAt: new Date(draft + "T23:59:59").toISOString() }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success("Prazo atualizado.");
      setEndDrafts((d) => {
        const { [s.id]: _omit, ...rest } = d;
        void _omit;
        return rest;
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (s: SeasonRow) => {
    if (!confirm(`Remover Temporada ${String(s.number).padStart(2, "0")}?`)) return;
    setBusy(s.id);
    try {
      const res = await fetch(`/api/admin/seasons/${s.id}`, { method: "DELETE" });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success("Temporada removida.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="label-caps label-caps-muted">Temporadas</h2>
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="btn-pill btn-gold"
            style={{ height: 36, padding: "0 16px", fontSize: 11 }}
          >
            <Plus size={12} />
            Nova temporada
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="label-caps label-caps-muted">Duração</span>
            <div className="flex gap-1 flex-wrap">
              {DURATION_OPTIONS.map((d) => {
                const on = duration === d.days;
                return (
                  <button
                    key={d.days}
                    onClick={() => setDuration(d.days)}
                    className="label-caps text-[10px] px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: on ? "#C9953A" : "rgba(255,255,255,0.04)",
                      color: on ? "#1a1410" : "rgba(255,255,255,0.65)",
                      boxShadow: on
                        ? "0 0 12px rgba(201,149,58,0.30)"
                        : "inset 0 0 0 1px rgba(255,255,255,0.10)",
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={create}
              disabled={busy === "__new__"}
              className="btn-pill btn-gold disabled:opacity-40"
              style={{ height: 36, padding: "0 16px", fontSize: 11 }}
            >
              {busy === "__new__" ? "Criando…" : "Criar"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="btn-pill btn-ghost"
              style={{ height: 36, padding: "0 16px", fontSize: 11 }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="ano-card-flat overflow-hidden">
        {seasons.length === 0 ? (
          <p className="text-faint text-sm py-12 text-center">
            Nenhuma temporada cadastrada. Clica em{" "}
            <span className="text-[#C9953A]">Nova temporada</span> pra começar.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">#</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Início</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Fim</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">XP</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Metas</th>
                <th className="text-center px-5 py-3 label-caps label-caps-muted">Status</th>
                <th className="px-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {seasons.map((s, i) => {
                const draft = endDrafts[s.id];
                const isBusy = busy === s.id;
                const endLocal = s.endsAt.slice(0, 10);
                const daysLeft =
                  s.isActive && new Date(s.endsAt) > new Date()
                    ? Math.ceil((new Date(s.endsAt).getTime() - Date.now()) / 86400000)
                    : null;
                const ended = !s.isActive && new Date(s.endsAt) < new Date();
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom:
                        i < seasons.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      background: s.isActive ? "rgba(201,149,58,0.04)" : undefined,
                    }}
                  >
                    <td className="px-5 py-3 text-mono font-bold text-white">
                      {String(s.number).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-3 text-mid text-mono text-xs">
                      {new Date(s.startsAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-mid">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-mid" />
                        <input
                          type="date"
                          value={draft ?? endLocal}
                          onChange={(e) => setEndDraft(s.id, e.target.value)}
                          className="input-square text-xs"
                          style={{ background: "transparent", padding: "4px 8px" }}
                        />
                        {draft && draft !== endLocal && (
                          <button
                            onClick={() => saveEndDate(s)}
                            disabled={isBusy}
                            aria-label="Salvar prazo"
                            className="text-[#C9953A] hover:opacity-80 disabled:opacity-40"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {daysLeft !== null && (
                          <span className="label-caps text-[#C9953A] text-[9px]">
                            {daysLeft}d
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-mono text-mid">{s.xpCount}</td>
                    <td className="px-5 py-3 text-right text-mono text-mid">{s.goalsCount}</td>
                    <td className="px-5 py-3 text-center">
                      {s.isActive ? (
                        <span
                          className="label-caps text-[10px] px-2 py-1 rounded-full"
                          style={{
                            background: "rgba(201,149,58,0.10)",
                            color: "#C9953A",
                            boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.40)",
                          }}
                        >
                          Ativa
                        </span>
                      ) : (
                        <span className="label-caps label-caps-muted text-[10px]">
                          {ended ? "Encerrada" : "Inativa"}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!s.isActive && (
                          <button
                            onClick={() => setActive(s, true)}
                            disabled={isBusy}
                            aria-label="Ativar"
                            className="label-caps text-[10px] px-2 py-1 rounded-full text-[#C9953A] hover:bg-white/[0.04] disabled:opacity-40"
                          >
                            Ativar
                          </button>
                        )}
                        {s.isActive && (
                          <button
                            onClick={() => setActive(s, false)}
                            disabled={isBusy}
                            aria-label="Encerrar"
                            className="label-caps text-[10px] px-2 py-1 rounded-full text-mid hover:bg-white/[0.04] disabled:opacity-40"
                          >
                            Encerrar
                          </button>
                        )}
                        <button
                          onClick={() => remove(s)}
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
        )}
      </div>

      <p className="mt-4 text-faint text-xs">
        Só pode haver <strong className="text-mid">uma temporada ativa</strong> por vez.
        Ao criar nova, a anterior é encerrada automaticamente. Cron diário
        rola pra próxima quando a ativa expira.
      </p>
    </div>
  );
}
