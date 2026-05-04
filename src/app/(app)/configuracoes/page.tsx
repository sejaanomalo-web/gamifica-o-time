"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { isAudioMuted, setAudioMuted } from "@/lib/sound";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setMuted(isAudioMuted());
  }, []);

  const onSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Saiu.");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-2xl mx-auto w-full">
      <Reveal>
        <h1 className="text-h2 uppercase text-anomalo-white" style={{ letterSpacing: "-0.01em" }}>
          Configurações.
        </h1>
      </Reveal>

      <Reveal delay={150}>
        <section className="mt-8 border border-anomalo-gold-hair p-5">
          <h2 className="label-caps text-anomalo-gold mb-4">Sons</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-anomalo-white">Som no level up</span>
            <input
              type="checkbox"
              checked={!muted}
              onChange={(e) => {
                const v = !e.target.checked;
                setMuted(v);
                setAudioMuted(v);
                toast.success(v ? "Mute ligado." : "Mute desligado.");
              }}
              className="w-5 h-5 accent-anomalo-gold"
            />
          </label>
          <p className="mt-2 text-anomalo-muted text-xs">
            PLACEHOLDER: arquivo `levelup.mp3` ainda precisa ser produzido.
          </p>
        </section>
      </Reveal>

      <Reveal delay={300}>
        <section className="mt-6 border border-anomalo-gold-hair p-5">
          <h2 className="label-caps text-anomalo-gold mb-4">Sessão</h2>
          <button
            onClick={onSignOut}
            className="border border-anomalo-gold-hair px-4 py-2.5 label-caps text-anomalo-white hover:bg-anomalo-gold-ghost hover:text-anomalo-gold transition-colors"
          >
            Sair
          </button>
        </section>
      </Reveal>
    </div>
  );
}
