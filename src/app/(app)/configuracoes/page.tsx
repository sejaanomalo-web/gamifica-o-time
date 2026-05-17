"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
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
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-2xl mx-auto w-full">
      <Reveal>
        <span className="label-caps mb-3 block">GΛME Anômalo · Conta</span>
        <h1
          className="text-white"
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.25rem, 7vw, 3rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          }}
        >
          Suas<br />
          <span
            className="text-[#C9953A]"
            style={{
              fontWeight: 300,
              fontStyle: "italic",
              textTransform: "lowercase",
              letterSpacing: "-0.02em",
            }}
          >
            configurações.
          </span>
        </h1>
      </Reveal>

      <Reveal delay={150}>
        <section className="mt-10 ano-card-flat p-6">
          <h2 className="label-caps mb-4">Sons</h2>
          <ToggleRow
            label="Som no level up"
            description="Toque sutil quando você sobe de nível ou bate uma meta."
            checked={!muted}
            onChange={(v) => {
              const newMuted = !v;
              setMuted(newMuted);
              setAudioMuted(newMuted);
              toast.success(newMuted ? "Som desativado." : "Som ativado.");
            }}
          />
          <p className="mt-4 text-faint text-xs">
            PLACEHOLDER: arquivo `levelup.mp3` ainda precisa ser produzido.
          </p>
        </section>
      </Reveal>

      <Reveal delay={300}>
        <section className="mt-6 ano-card-flat p-6">
          <h2 className="label-caps mb-4">Sessão</h2>
          <button
            onClick={onSignOut}
            className="btn-pill btn-ghost"
            style={{ height: 42, padding: "0 22px", fontSize: 13 }}
          >
            <LogOut size={14} className="mr-1" />
            Sair
          </button>
        </section>
      </Reveal>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer select-none">
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm font-semibold block">{label}</span>
        {description && (
          <span className="text-mid text-xs mt-0.5 block leading-relaxed">{description}</span>
        )}
      </div>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-all"
        style={{
          width: 44,
          height: 24,
          background: checked ? "#C9953A" : "rgba(255,255,255,0.10)",
          boxShadow: checked
            ? "inset 0 0 0 1px rgba(255,255,255,0.20), 0 0 16px rgba(201,149,58,0.40)"
            : "inset 0 0 0 1px rgba(255,255,255,0.10)",
        }}
      >
        <span
          className="absolute rounded-full transition-transform"
          style={{
            width: 18,
            height: 18,
            top: 3,
            left: checked ? 23 : 3,
            background: checked ? "#1a1410" : "#FFFFFF",
            transitionDuration: "350ms",
            transitionTimingFunction: "var(--ease-academia)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        />
      </span>
    </label>
  );
}
