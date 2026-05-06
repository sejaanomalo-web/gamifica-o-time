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
    <div className="min-h-screen flex flex-col bg-[#070709] px-6 py-10">
      <header className="flex items-center justify-between">
        <PulsingLambda size={28} />
        <button
          onClick={() => router.push("/dashboard")}
          className="label-caps text-mid hover:text-[#c9b298]"
        >
          Pular
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full py-10">
        <Reveal>
          <span className="label-caps mb-6 inline-block">
            Anônimo. Admin não vê seu nome.
          </span>
        </Reveal>

        <Reveal delay={150}>
          <h1
            className="display-serif text-[#edebe6]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)", lineHeight: 1 }}
          >
            Como foi<br />
            <span className="display-serif-italic text-[#c9b298]">a semana?</span>
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
                  className="flex-1 aspect-square flex flex-col items-center justify-center transition-all rounded-full"
                  style={{
                    background: sel ? "#c9b298" : "rgba(255,255,255,0.04)",
                    boxShadow: sel
                      ? "0 0 24px rgba(201,178,152,0.45), inset 0 0 0 1px rgba(255,255,255,0.18)"
                      : "inset 0 0 0 1px rgba(255,255,255,0.10)",
                    color: sel ? "#1a1712" : "#edebe6",
                  }}
                  aria-label={`Nota ${s.n}: ${s.label}`}
                >
                  <span
                    className="text-mono"
                    style={{ fontSize: "clamp(1.75rem, 6vw, 2.5rem)", lineHeight: 1, fontWeight: 500 }}
                  >
                    {s.n}
                  </span>
                  <span className="label-caps mt-2 text-[9px] opacity-80" style={{ color: "inherit" }}>
                    {s.label}
                  </span>
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
              className="w-full input-square py-3 resize-none"
              style={{ height: "auto", minHeight: 90 }}
            />
          </Reveal>

          <Reveal delay={850}>
            <button
              type="submit"
              disabled={rating === null || pending}
              className="btn-pill btn-gold mt-6 w-full disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {pending ? "Enviando…" : "Enviar"}
            </button>
          </Reveal>

          <Reveal delay={950}>
            <p className="mt-6 text-center text-faint text-xs">
              Sua resposta é anônima. Admin vê só a média e os comentários sem nome.
            </p>
          </Reveal>
        </form>
      </main>
    </div>
  );
}
