"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { GoalCard, type GoalCardData } from "@/components/feature/goal/GoalCard";
import { LogProgressSheet } from "@/components/feature/goal/LogProgressSheet";

type Tab = "ativas" | "historico" | "naoBatidas";

export default function MetasPage() {
  const [tab, setTab] = useState<Tab>("ativas");
  const [logOpen, setLogOpen] = useState(false);
  const [goals, setGoals] = useState<{ ativas: GoalCardData[]; historico: GoalCardData[]; naoBatidas: GoalCardData[] }>({
    ativas: [],
    historico: [],
    naoBatidas: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => (r.ok ? r.json() : { ativas: [], historico: [], naoBatidas: [] }))
      .then((d) => setGoals(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const list =
    tab === "ativas" ? goals.ativas : tab === "historico" ? goals.historico : goals.naoBatidas;

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-5xl mx-auto w-full">
      <Reveal>
        <span className="label-caps text-anomalo-gold mb-3 block">Anômalo · Metas</span>
        <h1
          className="text-anomalo-white"
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          }}
        >
          Suas<br />metas.
        </h1>
        <p className="mt-4 text-anomalo-sand text-sm max-w-md">
          {goals.ativas.length} ativas. {goals.historico.length} batidas no ano. Constância em
          construção.
        </p>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-8 flex gap-px border border-anomalo-gold-hair">
          {(
            [
              ["ativas", `Ativas · ${goals.ativas.length}`],
              ["historico", `Concluídas · ${goals.historico.length}`],
              ["naoBatidas", `Não batidas · ${goals.naoBatidas.length}`],
            ] as [Tab, string][]
          ).map(([id, label]) => {
            const on = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex-1 py-3 label-caps transition-colors"
                style={{
                  background: on ? "#C9953A" : "transparent",
                  color: on ? "#000" : "#8A7850",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Reveal>

      {tab === "ativas" && (
        <Reveal delay={320}>
          <button
            onClick={() => setLogOpen(true)}
            className="mt-6 w-full border border-anomalo-gold flex items-center justify-between px-5 py-4 label-caps text-anomalo-gold hover:bg-anomalo-gold-ghost transition-colors"
          >
            <span className="flex items-center gap-3">
              <Plus size={16} />
              Adicionar progresso de hoje
            </span>
            <span>→</span>
          </button>
        </Reveal>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {loading && (
          <p className="text-anomalo-muted text-sm py-8 text-center">Carregando…</p>
        )}
        {!loading && list.length === 0 && (
          <p className="text-anomalo-muted text-sm py-8 text-center border border-anomalo-gold-hair">
            {tab === "ativas"
              ? "Você ainda não tem metas ativas."
              : tab === "historico"
                ? "Nenhuma meta concluída ainda. Continua."
                : "Nada perdido até agora."}
          </p>
        )}
        {list.map((g, i) => (
          <Reveal key={g.id} delay={400 + i * 80}>
            <GoalCard goal={g} />
          </Reveal>
        ))}
      </div>

      <LogProgressSheet open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}
