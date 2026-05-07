"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { GoalCard, type GoalCardData } from "@/components/feature/goal/GoalCard";
import { LogProgressSheet } from "@/components/feature/goal/LogProgressSheet";
import { PeriodPicker } from "@/components/layout/PeriodPicker";

type Tab = "ativas" | "historico" | "naoBatidas";

export default function MetasPage() {
  const searchParams = useSearchParams();
  const periodParam = searchParams.get("p") ?? "";
  const [tab, setTab] = useState<Tab>("ativas");
  const [logOpen, setLogOpen] = useState(false);
  const [goals, setGoals] = useState<{ ativas: GoalCardData[]; historico: GoalCardData[]; naoBatidas: GoalCardData[] }>({
    ativas: [],
    historico: [],
    naoBatidas: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = periodParam ? `/api/goals?p=${encodeURIComponent(periodParam)}` : "/api/goals";
    fetch(url)
      .then((r) => (r.ok ? r.json() : { ativas: [], historico: [], naoBatidas: [] }))
      .then((d) => setGoals(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [periodParam]);

  const list =
    tab === "ativas" ? goals.ativas : tab === "historico" ? goals.historico : goals.naoBatidas;

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
      <Reveal>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <span className="label-caps mb-3 block">Game Anômalo · Metas</span>
            <h1
              className="display-bold text-white"
              style={{ fontSize: "clamp(2.75rem, 9vw, 4.5rem)", lineHeight: 0.96 }}
            >
              Suas<br />
              <span className="display-italic text-[#C9953A]">metas.</span>
            </h1>
            <p className="mt-4 text-mid text-sm max-w-md">
              {goals.ativas.length} ativas. {goals.historico.length} batidas.{" "}
              <span className="display-italic text-[#C9953A]">Constância</span> em construção.
            </p>
          </div>
          <PeriodPicker param={periodParam} />
        </div>
      </Reveal>

      <Reveal delay={200}>
        <div
          className="mt-10 inline-flex p-1 gap-1"
          style={{
            borderRadius: 9999,
            background: "rgba(17,17,21,0.6)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
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
                className="px-5 py-2 label-caps rounded-full transition-all"
                style={{
                  background: on ? "#C9953A" : "transparent",
                  color: on ? "#1a1410" : "rgba(237,235,230,0.65)",
                  boxShadow: on ? "0 0 16px rgba(201,149,58,0.30)" : "none",
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
            className="btn-pill btn-primary mt-8 w-full md:w-auto md:px-10"
          >
            <Plus size={16} />
            Adicionar progresso de hoje
          </button>
        </Reveal>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {loading && (
          <p className="text-faint text-sm py-8 text-center">Carregando…</p>
        )}
        {!loading && list.length === 0 && (
          <p className="text-faint text-sm py-10 text-center ano-card-flat">
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
