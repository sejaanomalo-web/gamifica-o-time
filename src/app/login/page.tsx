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
      setError(
        error.message === "Invalid login credentials"
          ? "Email ou senha inválidos."
          : error.message,
      );
      return;
    }
    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
    toast.success("Entrando.");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#070709] overflow-hidden px-6">
      <ConstellationBg density="medium" opacity={0.35} />

      <div className="relative z-10 w-full max-w-md">
        <Reveal delay={120}>
          <div className="flex justify-center mb-12">
            <span className="text-[#C9953A] text-5xl font-light leading-none">Λ</span>
          </div>
        </Reveal>

        <Reveal delay={220} y={28}>
          <h1 className="text-center mb-3 display-bold text-white" style={{ fontSize: "3.25rem" }}>
            Anômalo<br />
            <span className="display-italic text-[#C9953A]">meta.</span>
          </h1>
        </Reveal>

        <Reveal delay={420}>
          <p className="text-center text-mid text-sm leading-relaxed mb-10 max-w-sm mx-auto">
            Construção em formato de jogo. Entre pra continuar.
          </p>
        </Reveal>

        <Reveal delay={620}>
          <form
            onSubmit={onSubmit}
            className="ano-card-flat p-8"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px -16px rgba(0,0,0,0.6)" }}
          >
            <div className="space-y-6">
              <div>
                <label className="label-caps label-caps-muted block mb-3">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-square"
                />
              </div>
              <div>
                <label className="label-caps label-caps-muted block mb-3">Senha</label>
                <input
                  type="password"
                  required
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="input-square"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  transition={{ duration: 0.4 }}
                  className="text-sm text-[#fb2c36] border-l-2 border-[#fb2c36] pl-3 py-1"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={pending}
                whileTap={{ scale: 0.99 }}
                className="btn-pill btn-primary w-full disabled:opacity-50"
              >
                {pending ? "Entrando…" : "Entrar"}
              </motion.button>

              <div className="text-center pt-1">
                <Link
                  href="/recuperar-senha"
                  className="text-mid text-sm hover:text-[#C9953A] transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>
          </form>
        </Reveal>

        <Reveal delay={820}>
          <p className="text-center label-caps label-caps-muted mt-10">
            Anômalo Hub · Uso interno
          </p>
        </Reveal>
      </div>
    </div>
  );
}
