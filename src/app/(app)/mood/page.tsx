"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { PulsingLambda } from "@/components/motion/PulsingLambda";
import { toast } from "sonner";

const SCALE: Array<{ n: number; label: string }> = [
  { n: 1, label: "péssima" },
  { n: 2, label: "ruim" },
  { n: 3, label: "ok" },
  { n: 4, label: "boa" },
  { n: 5, label: "ótima" },
];

export default function MoodPage() {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) return;
    setPending(true);
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Recebido. Bom fim de semana.");
      router.push("/dashboard");
    } catch {
      toast.error("Falha ao enviar. Tenta de novo.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-anomalo-black px-6 py-10">
      <header className="flex items-center justify-between">
        <PulsingLambda size={28} />
        <button
          onClick={() => router.push("/dashboard")}
          className="label-caps text-anomalo-sand hover:text-anomalo-gold"
        >
          Pular
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full py-10">
        <Reveal>
          <span className="label-caps text-anomalo-gold mb-6 inline-block">
            Anônimo. Admin não vê seu nome.
          </span>
        </Reveal>

        <Reveal delay={150}>
          <h1
            className="text-anomalo-white"
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.25rem, 7vw, 3.5rem)",
              lineHeight: 1,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            Como foi<br />
            <span className="text-respiro" style={{ textTransform: "lowercase" }}>
              a semana?
            </span>
          </h1>
        </Reveal>

        <form onSubmit={onSubmit} className="mt-12">
          <div className="flex justify-between items-center gap-3 mb-8">
            {SCALE.map((s, i) => {
              const sel = rating === s.n;
              return (
                <motion.button
                  key={s.n}
                  type="button"
                  onClick={() => setRating(s.n)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 1.08 }}
                  className="flex-1 aspect-square flex flex-col items-center justify-center border transition-colors"
                  style={{
                    borderColor: sel ? "#C9953A" : "rgba(255,255,255,0.18)",
                    background: sel ? "#C9953A" : "transparent",
                    color: sel ? "#000" : "#FFF",
                  }}
                  aria-label={`Nota ${s.n}: ${s.label}`}
                >
                  <span
                    className="font-black"
                    style={{ fontSize: "clamp(1.75rem, 6vw, 2.5rem)", lineHeight: 1 }}
                  >
                    {s.n}
                  </span>
                  <span className="label-caps mt-2 text-[9px] opacity-80">{s.label}</span>
                </motion.button>
              );
            })}
          </div>

          <Reveal delay={700}>
            <textarea
              placeholder="Quer comentar? (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full bg-transparent border border-anomalo-gold-hair text-white px-4 py-3 outline-none focus:border-anomalo-gold transition-colors resize-none"
            />
          </Reveal>

          <Reveal delay={850}>
            <button
              type="submit"
              disabled={rating === null || pending}
              className="mt-6 w-full py-4 label-caps disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "#C9953A", color: "#000" }}
            >
              {pending ? "Enviando…" : "Enviar"}
            </button>
          </Reveal>

          <Reveal delay={950}>
            <p className="mt-6 text-center text-anomalo-muted text-xs">
              Sua resposta é anônima. Admin vê só a média e os comentários sem nome.
            </p>
          </Reveal>
        </form>
      </main>
    </div>
  );
}
