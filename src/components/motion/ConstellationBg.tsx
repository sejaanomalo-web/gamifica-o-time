"use client";

// Λ constellation background — used in Login and Season closing screens.
// Deterministic seeded layout so repaints don't reshuffle.

import { useMemo } from "react";
import { motion } from "framer-motion";

interface ConstellationBgProps {
  density?: "low" | "medium" | "high";
  opacity?: number;
}

export function ConstellationBg({ density = "medium", opacity = 0.5 }: ConstellationBgProps) {
  const points = useMemo(() => {
    let s = 7;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const n = density === "high" ? 40 : density === "medium" ? 24 : 12;
    return Array.from({ length: n }).map(() => ({
      x: rnd() * 100,
      y: rnd() * 100,
      size: 8 + rnd() * 22,
      delay: rnd() * 4,
      dur: 3.5 + rnd() * 3,
      opa: 0.25 + rnd() * 0.6,
      rot: (rnd() - 0.5) * 12,
    }));
  }, [density]);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity,
      }}
    >
      {points.map((p, i) => (
        <motion.span
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
            fontSize: p.size,
            color: "#C9953A",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontWeight: 300,
            lineHeight: 1,
            userSelect: "none",
            opacity: p.opa,
          }}
          animate={{ opacity: [p.opa * 0.5, p.opa, p.opa * 0.5], scale: [1, 1.06, 1] }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Λ
        </motion.span>
      ))}
    </div>
  );
}
