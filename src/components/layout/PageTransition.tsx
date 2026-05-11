"use client";

// Transição entre páginas — propositalmente mínima.
// Antes usava AnimatePresence mode="wait" + scale, o que travava o feedback
// no mobile (o exit precisava terminar antes do enter — ~800ms percebido).
// Agora é só um fade rápido de opacity que não bloqueia o render.

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex-1 flex flex-col min-h-0"
    >
      {children}
    </motion.div>
  );
}
