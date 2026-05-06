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
    <div className="relative min-h-screen flex items-center justify-center bg-[#070709] overflow-hidden px-6">
      <ConstellationBg density="low" opacity={0.3} />

      <div className="relative z-10 w-full max-w-md">
        <Reveal delay={120}>
          <div className="flex justify-center mb-12">
            <span className="text-[#c9b298] text-5xl font-light leading-none">Λ</span>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <h1 className="text-center display-serif mb-3" style={{ fontSize: "2.5rem" }}>
            <span className="display-serif-italic">recuperar</span> senha.
          </h1>
        </Reveal>

        {sent ? (
          <Reveal delay={320}>
            <div className="ano-card-flat p-8 text-center" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
              <p className="text-[#edebe6] mb-2">Link enviado.</p>
              <p className="text-mid text-sm">
                Confere o email <span className="text-[#c9b298]">{email}</span>.
              </p>
              <Link
                href="/login"
                className="inline-block mt-6 label-caps text-[#c9b298] hover:underline"
              >
                Voltar pro login
              </Link>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={320}>
            <p className="text-center text-mid mb-8 text-sm">
              Digite seu email. Mandamos um link pra resetar.
            </p>
            <form
              onSubmit={onSubmit}
              className="ano-card-flat p-8"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
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
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-pill btn-primary w-full disabled:opacity-50"
                >
                  {pending ? "Enviando…" : "Enviar link"}
                </button>
                <div className="text-center pt-1">
                  <Link
                    href="/login"
                    className="text-mid text-sm hover:text-[#c9b298] transition-colors"
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
