"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { fireGoldConfetti } from "@/lib/confetti";
import { playLevelUp } from "@/lib/sound";

interface LevelUpOverlayProps {
  level: number;
  isOpen: boolean;
  onClose: () => void;
}

export function LevelUpOverlay({ level, isOpen, onClose }: LevelUpOverlayProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    if (!reduced) fireGoldConfetti("mid");
    playLevelUp();
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [isOpen, onClose, reduced]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: "rgba(0,0,0,0.94)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: reduced ? 1 : 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 80 }}
            className="text-center px-8"
          >
            <div
              className="label-caps text-anomalo-gold mb-6"
              style={{ fontSize: "0.7rem" }}
            >
              Subida de nível
            </div>
            <div
              className="font-black text-anomalo-white tabular-nums"
              style={{
                fontSize: "8rem",
                lineHeight: 0.9,
                letterSpacing: "-0.05em",
              }}
            >
              {String(level).padStart(2, "0")}
            </div>
            <div
              className="mt-2 text-anomalo-gold text-respiro"
              style={{ fontSize: "1.125rem" }}
            >
              Continua.
            </div>
            <div className="mt-12 label-caps text-anomalo-sand">
              Toque para fechar
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
