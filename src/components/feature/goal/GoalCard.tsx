"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GoalProgress } from "./GoalProgress";

export interface GoalCardData {
  id: string;
  title: string;
  area: string | null;
  progress: number;
  target: number;
  daysLeft: number;
  xpReward: number;
  status: "ATIVA" | "CONCLUIDA" | "NAO_BATIDA" | "AGUARDANDO_VALIDACAO" | "REJEITADA";
}

export function GoalCard({ goal, primary }: { goal: GoalCardData; primary?: boolean }) {
  const pct = Math.min(100, (goal.progress / Math.max(1, goal.target)) * 100);
  const isLate = goal.status === "ATIVA" && goal.daysLeft <= 3;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="block w-full"
    >
      <Link
        href={`/metas/${goal.id}`}
        className="block ano-card-flat border border-anomalo-gold-hair hover:border-anomalo-gold p-6 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span
              className="label-caps mb-2 inline-block"
              style={{ color: isLate ? "#E26B4A" : "#8A7850" }}
            >
              {goal.area ?? "Geral"}
              {isLate ? " · atenção" : ""}
            </span>
            <h3
              className="font-semibold text-anomalo-white leading-tight"
              style={{ fontSize: primary ? 18 : 15 }}
            >
              {goal.title}
            </h3>
            <div className="mt-4 h-1 bg-anomalo-surface relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-anomalo-gold"
                style={{ boxShadow: "0 0 8px rgba(201,149,58,0.5)" }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-anomalo-sand tabular-nums">
              <span>
                {goal.progress}/{goal.target}
              </span>
              <span>
                {goal.daysLeft} dias · +{goal.xpReward} XP
              </span>
            </div>
          </div>
          {primary && <GoalProgress percentage={pct} size="md" />}
        </div>
      </Link>
    </motion.div>
  );
}
