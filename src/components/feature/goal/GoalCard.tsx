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
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="block w-full"
    >
      <Link href={`/metas/${goal.id}`} className="block ano-card p-7">
        <div className="flex items-start justify-between gap-5">
          <div className="flex-1 min-w-0">
            <span
              className="label-caps mb-3 inline-block"
              style={{ color: isLate ? "#fb2c36" : "#8d7556" }}
            >
              {goal.area ?? "Geral"}
              {isLate ? " · atenção" : ""}
            </span>
            <h3
              className="text-[#edebe6] leading-tight"
              style={{
                fontSize: primary ? 22 : 17,
                fontWeight: primary ? 500 : 600,
                fontFamily: primary
                  ? "var(--font-instrument-serif)"
                  : "var(--font-inter-tight)",
                fontStyle: primary ? "italic" : "normal",
                letterSpacing: primary ? "-0.01em" : 0,
              }}
            >
              {goal.title}
            </h3>
            <div
              className="mt-5 h-1 relative overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #c9b298 0%, #e4d8ca 100%)",
                  boxShadow: "0 0 10px rgba(201,178,152,0.55)",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-mid text-mono tabular-nums">
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
