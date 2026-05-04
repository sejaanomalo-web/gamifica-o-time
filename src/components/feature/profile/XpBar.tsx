"use client";

import { motion } from "framer-motion";

interface XpBarProps {
  currentXp: number;
  nextLevelXp: number;
  level: number;
  levelFloor?: number;
}

export function XpBar({ currentXp, nextLevelXp, level, levelFloor = 0 }: XpBarProps) {
  const span = Math.max(1, nextLevelXp - levelFloor);
  const filled = Math.max(0, currentXp - levelFloor);
  const pct = Math.min(100, (filled / span) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="label-caps text-anomalo-sand">Nível {level}</span>
        <span className="label-caps text-anomalo-sand tabular-nums">
          {currentXp.toLocaleString("pt-BR")} / {nextLevelXp.toLocaleString("pt-BR")} XP
        </span>
      </div>
      <div
        className="relative h-1 bg-anomalo-surface overflow-hidden"
        style={{ boxShadow: "inset 0 1px 1px rgba(0,0,0,0.4)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full"
          style={{
            background: "linear-gradient(90deg, #C9953A 0%, #E0B25A 100%)",
            boxShadow: "0 0 8px rgba(201,149,58,0.5)",
          }}
        />
      </div>
    </div>
  );
}
