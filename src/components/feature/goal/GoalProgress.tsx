"use client";

import { motion } from "framer-motion";

interface GoalProgressProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
}

const dims = { sm: 56, md: 96, lg: 144 };
const strokes = { sm: 3, md: 5, lg: 7 };

export function GoalProgress({ percentage, size = "md" }: GoalProgressProps) {
  const px = dims[size];
  const sw = strokes[size];
  const r = (px - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percentage));
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={px} height={px} className="-rotate-90">
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={sw}
          fill="none"
        />
        <motion.circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke="#c9b298"
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 8px rgba(201,178,152,0.5))" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-mono tabular-nums text-[#edebe6]"
          style={{
            fontSize: size === "lg" ? 32 : size === "md" ? 22 : 13,
            letterSpacing: "-0.02em",
            fontWeight: 500,
          }}
        >
          {Math.round(pct)}
          <span className="text-mid text-[0.5em] ml-0.5">%</span>
        </span>
      </div>
    </div>
  );
}
