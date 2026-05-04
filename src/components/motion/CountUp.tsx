"use client";

import { animate, useInView, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  format?: (n: number) => string;
}

export function CountUp({
  value,
  duration = 1.6,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  format,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (n) => {
    if (format) return format(n);
    const f = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString("pt-BR");
    return `${prefix}${f}${suffix}`;
  });

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, value, {
        duration,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [inView, value, motionValue, duration]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
