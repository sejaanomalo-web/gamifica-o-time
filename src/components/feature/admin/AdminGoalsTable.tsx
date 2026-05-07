"use client";

// Tabela de metas no admin: clicar abre o GoalEditorDialog em modo edit.
// Botão "Nova meta" no topo (recebe colaboradores do server).

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  GoalEditorDialog,
  type GoalEditorInitial,
  type GoalScopeOption,
} from "./GoalEditorDialog";
import { formatCents, type RewardConfig } from "@/lib/tiers";

interface CollaboratorOption {
  id: string;
  name: string;
  area: string | null;
}

export interface AdminGoalRow {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string | null;
  kpi: string;
  target: number;
  current: number;
  deadline: string;
  xpReward: number;
  needsEvidence: boolean;
  status: string;
  scope: GoalScopeOption;
  monthISO: string | null;
  yearISO: string | null;
  rewardConfig: RewardConfig | null;
}

const SCOPE_LABEL: Record<GoalScopeOption, string> = {
  PERMANENT: "Permanente",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

const SCOPE_COLOR: Record<GoalScopeOption, string> = {
  PERMANENT: "#E0B25A",
  MONTHLY: "#C9953A",
  YEARLY: "#8A7850",
};

interface Props {
  goals: AdminGoalRow[];
  collaborators: CollaboratorOption[];
}

export function AdminGoalsTable({ goals, collaborators }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GoalEditorInitial | null>(null);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (g: AdminGoalRow) => {
    setEditing({
      id: g.id,
      ownerId: g.ownerId,
      title: g.title,
      description: g.description,
      kpi: g.kpi,
      target: g.target,
      deadline: g.deadline,
      xpReward: g.xpReward,
      needsEvidence: g.needsEvidence,
      scope: g.scope,
      monthISO: g.monthISO,
      yearISO: g.yearISO,
      rewardConfig: g.rewardConfig,
    });
    setOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <button onClick={openNew} className="btn-pill btn-gold">
          <Plus size={14} />
          Nova meta
        </button>
      </div>

      <div className="ano-card-flat overflow-hidden">
        {goals.length === 0 ? (
          <p className="text-faint text-sm py-12 text-center">
            Nenhuma meta nesse período. Clica em <span className="text-[#C9953A]">Nova meta</span> pra criar.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Título</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Colaborador</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Escopo</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Período</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Progresso</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Recompensa</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g, i) => {
                const periodLabel =
                  g.scope === "MONTHLY"
                    ? g.monthISO ?? "—"
                    : g.scope === "YEARLY"
                      ? g.yearISO ?? "—"
                      : "—";
                return (
                  <tr
                    key={g.id}
                    onClick={() => openEdit(g)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                    style={{
                      borderBottom: i < goals.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <td className="px-5 py-3 text-white">{g.title}</td>
                    <td className="px-5 py-3 text-mid">{g.ownerName}</td>
                    <td className="px-5 py-3">
                      <span
                        className="label-caps text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          color: SCOPE_COLOR[g.scope],
                          background: "rgba(201,149,58,0.06)",
                          boxShadow: `inset 0 0 0 1px ${SCOPE_COLOR[g.scope]}40`,
                        }}
                      >
                        {SCOPE_LABEL[g.scope]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-mid text-mono text-xs">{periodLabel}</td>
                    <td className="px-5 py-3 text-right text-mono text-mid">
                      {g.current.toFixed(0)}/{g.target.toFixed(0)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {g.rewardConfig ? (
                        (() => {
                          const total =
                            g.rewardConfig.steps.reduce((s, st) => s + st.rewardCents, 0) +
                            (g.rewardConfig.finalBonusCents ?? 0);
                          return (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[#C9953A] text-mono font-bold">
                                {formatCents(total)}
                              </span>
                              <span className="label-caps label-caps-muted text-[9px]">
                                {g.rewardConfig.steps.length} marco
                                {g.rewardConfig.steps.length > 1 ? "s" : ""} · +{g.xpReward} XP
                              </span>
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-[#C9953A] text-mono font-bold">+{g.xpReward} XP</span>
                      )}
                    </td>
                    <td className="px-5 py-3 label-caps text-[10px]">{g.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <GoalEditorDialog
        open={open}
        onOpenChange={setOpen}
        collaborators={collaborators}
        initial={editing}
      />
    </>
  );
}
