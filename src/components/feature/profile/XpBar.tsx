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
        <span className="label-caps label-caps-muted">Nível {level}</span>
        <span className="label-caps label-caps-muted text-mono tabular-nums">
          {currentXp.toLocaleString("pt-BR")} / {nextLevelXp.toLocaleString("pt-BR")} XP
        </span>
      </div>
      <div
        className="relative h-1 overflow-hidden rounded-full"
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
    </div>
  );
}
