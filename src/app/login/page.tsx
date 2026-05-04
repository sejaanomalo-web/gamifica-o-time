"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ConstellationBg } from "@/components/motion/ConstellationBg";
import { Reveal } from "@/components/motion/Reveal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Email ou senha inválidos." : error.message);
      return;
    }
    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
    toast.success("Entrando.");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-anomalo-black overflow-hidden px-6">
      <ConstellationBg density="medium" opacity={0.4} />

      <div className="relative z-10 w-full max-w-md">
        <Reveal delay={120}>
          <div className="flex justify-center mb-12">
            <span className="text-anomalo-gold text-5xl font-light">Λ</span>
          </div>
        </Reveal>

        <Reveal delay={220} y={28}>
          <h1
            className="text-center mb-3"
            style={{
              fontWeight: 900,
              fontSize: "3.5rem",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            Anômalo<br />
            <span className="text-respiro" style={{ textTransform: "lowercase" }}>
              meta.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={420}>
          <p className="text-center text-anomalo-sand text-sm leading-relaxed mb-10">
            Construção em formato de jogo.
          </p>
        </Reveal>

        <Reveal delay={620}>
          <form onSubmit={onSubmit} className="ano-card-flat p-8 border border-anomalo-gold-hair">
            <div className="space-y-5">
              <div>
                <label className="label-caps text-anomalo-sand block mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border border-anomalo-gold-hair text-white px-4 py-3 outline-none focus:border-anomalo-gold transition-colors"
                />
              </div>
              <div>
                <label className="label-caps text-anomalo-sand block mb-2">Senha</label>
                <input
                  type="password"
                  required
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="w-full bg-transparent border border-anomalo-gold-hair text-white px-4 py-3 outline-none focus:border-anomalo-gold transition-colors"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  transition={{ duration: 0.4 }}
                  className="text-sm text-red-400 border-l-2 border-red-400 pl-3 py-1"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={pending}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-anomalo-gold text-anomalo-black py-4 label-caps disabled:opacity-50 transition-opacity"
              >
                {pending ? "Entrando…" : "Entrar"}
              </motion.button>

              <div className="text-center pt-2">
                <Link
                  href="/recuperar-senha"
                  className="text-anomalo-sand text-sm hover:text-anomalo-gold transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>
          </form>
        </Reveal>

        <Reveal delay={820}>
          <p className="text-center text-anomalo-muted label-caps mt-10">
            Anômalo Hub · Uso interno
          </p>
        </Reveal>
      </div>
    </div>
  );
}
