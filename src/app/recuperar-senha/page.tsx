"use client";

import Link from "next/link";
import { useState } from "react";
import { ConstellationBg } from "@/components/motion/ConstellationBg";
import { Reveal } from "@/components/motion/Reveal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-anomalo-black overflow-hidden px-6">
      <ConstellationBg density="low" opacity={0.3} />

      <div className="relative z-10 w-full max-w-md">
        <Reveal delay={120}>
          <div className="flex justify-center mb-12">
            <span className="text-anomalo-gold text-5xl font-light">Λ</span>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <h1 className="text-center text-h2 mb-3 uppercase tracking-tight">
            Recuperar senha.
          </h1>
        </Reveal>

        {sent ? (
          <Reveal delay={320}>
            <div className="ano-card-flat p-8 border border-anomalo-gold-hair text-center">
              <p className="text-anomalo-white mb-2">Link enviado.</p>
              <p className="text-anomalo-sand text-sm">
                Confere o email <span className="text-anomalo-gold">{email}</span>.
              </p>
              <Link
                href="/login"
                className="inline-block mt-6 label-caps text-anomalo-gold hover:underline"
              >
                Voltar pro login
              </Link>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={320}>
            <p className="text-center text-anomalo-sand mb-8">
              Digite seu email. Mandamos um link pra resetar.
            </p>
            <form
              onSubmit={onSubmit}
              className="ano-card-flat p-8 border border-anomalo-gold-hair"
            >
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
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-anomalo-gold text-anomalo-black py-4 label-caps disabled:opacity-50"
                >
                  {pending ? "Enviando…" : "Enviar link"}
                </button>
                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-anomalo-sand text-sm hover:text-anomalo-gold"
                  >
                    Voltar pro login
                  </Link>
                </div>
              </div>
            </form>
          </Reveal>
        )}
      </div>
    </div>
  );
}
