"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { CountUp } from "@/components/motion/CountUp";
import { PulsingLambda } from "@/components/motion/PulsingLambda";

export interface WrappedSnapshotData {
  goalsBeaten: number;
  totalXp: number;
  peakDay: Date | null;
  peakDayXp: number;
  rareBadgeName: string | null;
  rareBadgePercent: number | null;
  comparisonXpDelta: number | null;
  finalRank: number | null;
  closingPhrase: string | null;
  monthLabel: string;
  userFirstName: string;
}

export function WrappedCarousel({ snapshot }: { snapshot: WrappedSnapshotData }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const slides = [Cover, Volume, Peak, RareBadge, Comparison, Position, Closing];
  const Slide = slides[i];

  return (
    <div className="fixed inset-0 z-50 bg-anomalo-black flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-anomalo-gold-hair">
        <span className="label-caps text-anomalo-gold">Wrapped · {snapshot.monthLabel}</span>
        <button
          aria-label="Fechar"
          onClick={() => router.push("/perfil")}
          className="p-2 hover:text-anomalo-gold transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center px-6 text-center"
          >
            <Slide snapshot={snapshot} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-5 py-4 flex items-center justify-between border-t border-anomalo-gold-hair">
        <button
          aria-label="Anterior"
          disabled={i === 0}
          onClick={() => setI((n) => Math.max(0, n - 1))}
          className="p-2 disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className="w-2 h-2"
              style={{ background: idx === i ? "#c9b298" : "rgba(255,255,255,0.18)" }}
            />
          ))}
        </div>
        <button
          aria-label="Próximo"
          disabled={i === slides.length - 1}
          onClick={() => setI((n) => Math.min(slides.length - 1, n + 1))}
          className="p-2 disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

function Cover({ snapshot }: { snapshot: WrappedSnapshotData }) {
  return (
    <div>
      <PulsingLambda size={64} />
      <h2
        className="mt-6 text-anomalo-white"
        style={{
          fontSize: "clamp(2.25rem, 8vw, 4rem)",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        {snapshot.monthLabel}<br />
        <span className="text-respiro" style={{ textTransform: "lowercase" }}>
          em revisão.
        </span>
      </h2>
      <p className="mt-6 text-anomalo-sand">{snapshot.userFirstName}.</p>
    </div>
  );
}

function Volume({ snapshot }: { snapshot: WrappedSnapshotData }) {
  return (
    <div>
      <p className="label-caps text-anomalo-sand mb-4">Você bateu</p>
      <div
        className="font-black text-anomalo-white tabular-nums"
        style={{ fontSize: "clamp(5rem, 20vw, 10rem)", lineHeight: 0.9, letterSpacing: "-0.05em" }}
      >
        <CountUp value={snapshot.goalsBeaten} duration={1.6} />
      </div>
      <p className="mt-4 text-anomalo-gold">metas esse mês.</p>
    </div>
  );
}

function Peak({ snapshot }: { snapshot: WrappedSnapshotData }) {
  if (!snapshot.peakDay) {
    return (
      <p className="text-anomalo-sand">Sem dia de pico registrado nesta temporada.</p>
    );
  }
  return (
    <div>
      <p className="label-caps text-anomalo-sand mb-4">Seu dia mais produtivo</p>
      <p
        className="text-anomalo-white"
        style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.01em" }}
      >
        {snapshot.peakDay.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>
      <p className="mt-6 text-anomalo-gold tabular-nums" style={{ fontSize: "clamp(2rem, 7vw, 3rem)" }}>
        <CountUp value={snapshot.peakDayXp} /> XP
      </p>
      <p className="text-anomalo-sand text-sm mt-2">em um único dia.</p>
    </div>
  );
}

function RareBadge({ snapshot }: { snapshot: WrappedSnapshotData }) {
  if (!snapshot.rareBadgeName) {
    return <p className="text-anomalo-sand">Sem badges raros desta temporada.</p>;
  }
  return (
    <div>
      <p className="label-caps text-anomalo-sand mb-4">Badge mais raro</p>
      <span className="text-anomalo-gold text-7xl font-light leading-none">Λ</span>
      <h3 className="mt-4 text-anomalo-white text-h3">{snapshot.rareBadgeName}</h3>
      {snapshot.rareBadgePercent != null && (
        <p className="mt-3 text-anomalo-sand text-sm">
          Só {snapshot.rareBadgePercent.toFixed(0)}% do time tem.
        </p>
      )}
    </div>
  );
}

function Comparison({ snapshot }: { snapshot: WrappedSnapshotData }) {
  if (snapshot.comparisonXpDelta == null) {
    return <p className="text-anomalo-sand">Primeira temporada — sem comparação ainda.</p>;
  }
  const up = snapshot.comparisonXpDelta >= 0;
  return (
    <div>
      <p className="label-caps text-anomalo-sand mb-4">Comparado ao mês anterior</p>
      <p
        className="font-black tabular-nums"
        style={{
          fontSize: "clamp(3rem, 10vw, 6rem)",
          color: up ? "#c9b298" : "#E26B4A",
          letterSpacing: "-0.04em",
        }}
      >
        {up ? "+" : ""}
        {snapshot.comparisonXpDelta.toFixed(0)}%
      </p>
      <p className="mt-3 text-anomalo-sand text-sm">{up ? "subiu." : "caiu."}</p>
    </div>
  );
}

function Position({ snapshot }: { snapshot: WrappedSnapshotData }) {
  if (!snapshot.finalRank) {
    return <p className="text-anomalo-sand">Sem posição final desta temporada.</p>;
  }
  return (
    <div>
      <p className="label-caps text-anomalo-sand mb-4">Você terminou em</p>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 80 }}
        className="font-black text-anomalo-gold tabular-nums"
        style={{ fontSize: "clamp(5rem, 20vw, 10rem)", lineHeight: 0.9 }}
      >
        {snapshot.finalRank}º
      </motion.div>
      <p className="mt-4 text-anomalo-sand">no ranking.</p>
    </div>
  );
}

function Closing({ snapshot }: { snapshot: WrappedSnapshotData }) {
  return (
    <div>
      <p
        className="text-anomalo-white max-w-md mx-auto"
        style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.4 }}
      >
        {snapshot.closingPhrase ?? "Construção. Constância."}
      </p>
      <div className="mt-12 flex flex-col gap-3 max-w-xs mx-auto">
        <button
          className="py-3.5 label-caps"
          style={{ background: "#c9b298", color: "#000" }}
          onClick={() => alert("Em breve: gerar card 1080x1920 e disparar Web Share API.")}
        >
          Compartilhar story
        </button>
        <a
          href="/dashboard"
          className="py-3.5 label-caps border border-anomalo-gold-hair text-anomalo-gold text-center"
        >
          Voltar ao dashboard
        </a>
      </div>
    </div>
  );
}
