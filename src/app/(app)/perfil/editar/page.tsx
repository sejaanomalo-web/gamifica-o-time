"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function EditarPerfilPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName(data.user?.user_metadata?.name ?? "");
      setLoading(false);
    });
  }, []);

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
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-2xl mx-auto w-full">
      <Reveal>
        <Link href="/perfil" className="label-caps text-anomalo-sand hover:text-anomalo-gold">
          ← Perfil
        </Link>
        <h1 className="mt-4 text-h2 uppercase text-anomalo-white" style={{ letterSpacing: "-0.01em" }}>
          Editar perfil.
        </h1>
      </Reveal>

      <form onSubmit={onSave} className="mt-8 space-y-6">
        <Reveal delay={150}>
          <section className="border border-anomalo-gold-hair p-5">
            <h2 className="label-caps text-anomalo-gold mb-4">Foto</h2>
            <p className="text-anomalo-muted text-sm">
              Em breve: upload com crop. Por ora, iniciais douradas servem de fallback.
            </p>
          </section>
        </Reveal>

        <Reveal delay={250}>
          <section className="border border-anomalo-gold-hair p-5">
            <h2 className="label-caps text-anomalo-gold mb-4">Dados pessoais</h2>
            <div className="space-y-5">
              <div>
                <label className="label-caps text-anomalo-sand block mb-2">Nome</label>
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-transparent border border-anomalo-gold-hair text-white px-4 py-3 outline-none focus:border-anomalo-gold transition-colors"
                />
              </div>
              <div>
                <label className="label-caps text-anomalo-sand block mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-transparent border border-anomalo-gold-hair text-white px-4 py-3 outline-none focus:border-anomalo-gold transition-colors"
                />
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={350}>
          <section className="border border-anomalo-gold-hair p-5">
            <h2 className="label-caps text-anomalo-gold mb-4">Senha</h2>
            <button
              type="button"
              onClick={() => setPwOpen(true)}
              className="border border-anomalo-gold-hair px-4 py-2.5 label-caps text-anomalo-gold hover:bg-anomalo-gold-ghost transition-colors"
            >
              Trocar senha
            </button>
          </section>
        </Reveal>

        <Reveal delay={450}>
          <button
            type="submit"
            disabled={saving || loading}
            className="w-full py-4 label-caps disabled:opacity-50"
            style={{ background: "#C9953A", color: "#000" }}
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </Reveal>
      </form>

      {pwOpen && <PasswordChangeDialog onClose={() => setPwOpen(false)} />}
    </div>
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
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="bg-anomalo-surface border border-anomalo-gold-hair p-6 max-w-md w-full"
      >
        <h3 className="label-caps text-anomalo-gold mb-5">Trocar senha</h3>
        <div className="space-y-4">
          <div>
            <label className="label-caps text-anomalo-sand block mb-2">Nova senha</label>
            <input
              type="password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-transparent border border-anomalo-gold-hair text-white px-4 py-3 outline-none focus:border-anomalo-gold"
            />
          </div>
          <div>
            <label className="label-caps text-anomalo-sand block mb-2">Confirmar nova senha</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-transparent border border-anomalo-gold-hair text-white px-4 py-3 outline-none focus:border-anomalo-gold"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 label-caps border border-anomalo-gold-hair text-anomalo-sand hover:text-anomalo-gold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-3 label-caps disabled:opacity-50"
              style={{ background: "#C9953A", color: "#000" }}
            >
              {pending ? "…" : "Trocar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
