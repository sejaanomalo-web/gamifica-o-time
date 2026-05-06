"use client";

import { motion } from "framer-motion";

interface PulsingLambdaProps {
  size?: number;
  className?: string;
  opacityRange?: [number, number];
  duration?: number;
}

export function PulsingLambda({
  size = 24,
  className,
  opacityRange = [0.3, 0.6],
  duration = 4,
}: PulsingLambdaProps) {
  return (
    <motion.span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        fontSize: size,
        fontWeight: 300,
        color: "#c9b298",
        lineHeight: 1,
        userSelect: "none",
      }}
      animate={{ opacity: opacityRange, scale: [1, 1.04, 1] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      Λ
    </motion.span>
  );
}
