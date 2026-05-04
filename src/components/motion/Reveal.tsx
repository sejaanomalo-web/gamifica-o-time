"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
}

export function Reveal({ children, delay = 0, y = 28, once = true }: RevealProps) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration: prefersReduced ? 0.25 : 0.8,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealStagger({
  children,
  delay = 0,
  stagger = 0.1,
}: {
  children: ReactNode;
  delay?: number;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay / 1000 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
