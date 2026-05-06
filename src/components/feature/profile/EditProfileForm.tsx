"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { AvatarUpload } from "@/components/feature/profile/AvatarUpload";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface EditProfileFormProps {
  initialName: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
  authUserId: string;
}

export function EditProfileForm({
  initialName,
  initialEmail,
  authUserId,
  initialAvatarUrl,
}: EditProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const initials = (name || initialEmail || "Λ")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falhou.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSave} className="mt-10 space-y-5">
      <Reveal delay={150}>
        <section className="ano-card-flat p-6">
          <h2 className="label-caps mb-5">Foto</h2>
          <AvatarUpload
            initialUrl={initialAvatarUrl}
            initials={initials}
            authUserId={authUserId}
          />
        </section>
      </Reveal>

      <Reveal delay={250}>
        <section className="ano-card-flat p-6">
          <h2 className="label-caps mb-5">Dados pessoais</h2>
          <div className="space-y-5">
            <div>
              <label className="label-caps label-caps-muted block mb-3">Nome</label>
              <input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-square"
              />
            </div>
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
          </div>
        </section>
      </Reveal>

      <Reveal delay={350}>
        <section className="ano-card-flat p-6">
          <h2 className="label-caps mb-4">Senha</h2>
          <button
            type="button"
            onClick={() => setPwOpen(true)}
            className="btn-pill btn-ghost"
            style={{ height: 42, padding: "0 22px", fontSize: 13 }}
          >
            Trocar senha
          </button>
        </section>
      </Reveal>

      <Reveal delay={450}>
        <button
          type="submit"
          disabled={saving}
          className="btn-pill btn-primary w-full disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </Reveal>

      {pwOpen && <PasswordChangeDialog onClose={() => setPwOpen(false)} />}
    </form>
  );
}

function PasswordChangeDialog({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== confirm) {
      toast.error("Senhas não conferem.");
      return;
    }
    if (pw.length < 8) {
      toast.error("Mínimo 8 caracteres.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha trocada.");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="ano-card-flat p-7 max-w-md w-full"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.10), 0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(201,149,58,0.10)",
        }}
      >
        <h3 className="label-caps mb-5">Trocar senha</h3>
        <div className="space-y-5">
          <div>
            <label className="label-caps label-caps-muted block mb-3">Nova senha</label>
            <input
              type="password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="input-square"
            />
          </div>
          <div>
            <label className="label-caps label-caps-muted block mb-3">
              Confirmar nova senha
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-square"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-pill btn-ghost flex-1"
              style={{ height: 44, fontSize: 13 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="btn-pill btn-primary flex-1 disabled:opacity-50"
              style={{ height: 44, fontSize: 13 }}
            >
              {pending ? "…" : "Trocar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
