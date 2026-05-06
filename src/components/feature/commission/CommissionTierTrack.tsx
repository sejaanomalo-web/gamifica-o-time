"use client";

import { motion } from "framer-motion";
import { PulsingLambda } from "@/components/motion/PulsingLambda";
import type { CommissionTier } from "@/generated/prisma/client";

export function CommissionTierTrack({
  tier,
  netPoints,
}: {
  tier: CommissionTier;
  netPoints: number;
}) {
  const max = Math.max(tier.excellenceMin + 40, tier.m2Max + 20);
  const pct = (n: number) => Math.min(100, Math.max(0, (n / max) * 100));
  const cur = pct(netPoints);

  const segments = [
    { from: 0, to: tier.baseMax, label: "Base", color: "#5A4A2A" },
    { from: tier.m1Min, to: tier.m1Max, label: "Meta 1", color: "#8A7850" },
    { from: tier.m2Min, to: tier.m2Max, label: "Meta 2", color: "#C9953A" },
    { from: tier.excellenceMin, to: max, label: "Excelência", color: "#E0B25A" },
  ];

  return (
    <div className="w-full">
      <div className="relative h-2 bg-anomalo-surface overflow-hidden border border-anomalo-gold-hair">
        {segments.map((s) => (
          <div
            key={s.label}
            className="absolute top-0 bottom-0"
            style={{
              left: `${pct(s.from)}%`,
              width: `${pct(s.to) - pct(s.from)}%`,
              background: s.color,
              opacity: 0.35,
            }}
          />
        ))}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${cur}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 bottom-0 left-0"
          style={{
            background: "linear-gradient(90deg, #C9953A 0%, #E0B25A 100%)",
            boxShadow: "0 0 12px rgba(201,149,58,0.6)",
          }}
        />
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: `${cur}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
        >
          <PulsingLambda size={20} duration={3.5} />
        </motion.div>
      </div>

      <div className="grid grid-cols-4 mt-3 gap-2 text-center">
        {segments.map((s) => (
          <div key={s.label}>
            <span
              className="label-caps block text-[10px]"
              style={{ color: netPoints >= s.from ? s.color : "#5A4A2A" }}
            >
              {s.label}
            </span>
            <span className="text-anomalo-muted text-[10px] tabular-nums">
              {s.from}+
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
