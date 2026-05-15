"use client";

// Dialog do admin pra criar novo colaborador (login + Colaborador no PA).
// Gera senha forte automática mas permite override. Mostra a senha em
// claro depois de criado pra o admin compartilhar com o usuário.
//
// Refatorado pra PA: funcoes[] (multi-select) + isAdmin (toggle).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { FUNCAO_LABEL, type FuncaoCodigo } from "@/lib/pa";

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
}

const FUNCOES: FuncaoCodigo[] = [
  "sdr",
  "design",
  "trafego",
  "social_midia",
  "video_maker",
  "closer",
];

function genPassword(len = 14): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const num = "23456789";
  const sym = "!@#$%&*";
  const all = upper + lower + num + sym;
  const arr = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    num[Math.floor(Math.random() * num.length)],
    sym[Math.floor(Math.random() * sym.length)],
  ];
  for (let i = arr.length; i < len; i++) {
    arr.push(all[Math.floor(Math.random() * all.length)]);
  }
  return arr.sort(() => Math.random() - 0.5).join("");
}

export function AddUserDialog({ open, onClose }: AddUserDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [funcoes, setFuncoes] = useState<FuncaoCodigo[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState(() => genPassword());
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  if (!open) return null;

  const reset = () => {
    setName("");
    setEmail("");
    setFuncoes([]);
    setIsAdmin(false);
    setPassword(genPassword());
    setShowPw(false);
    setCreated(null);
  };

  const toggleFuncao = (f: FuncaoCodigo) => {
    setFuncoes((curr) =>
      curr.includes(f) ? curr.filter((x) => x !== f) : [...curr, f],
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (funcoes.length === 0) {
      toast.error("Selecione ao menos uma função");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          funcoes,
          isAdmin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou.");
      setCreated({ email, password });
      toast.success("Colaborador criado.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falhou.");
    } finally {
      setSubmitting(false);
    }
  };

  const onClosed = () => {
    reset();
    onClose();
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error("Não consegui copiar.");
    }
  };

  return (
    <div
      onClick={onClosed}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ano-card-flat p-7 max-w-lg w-full my-8"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.10), 0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(201,149,58,0.10)",
        }}
      >
        {created ? (
          <div>
            <span className="label-caps mb-3 block">Conta criada</span>
            <h3
              className="text-white mb-2"
              style={{
                fontWeight: 900,
                fontSize: "1.75rem",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              Pronto.<br />
              <span
                className="text-[#C9953A]"
                style={{
                  fontWeight: 300,
                  fontStyle: "italic",
                  textTransform: "lowercase",
                  letterSpacing: "-0.02em",
                }}
              >
                copia e manda.
              </span>
            </h3>
            <p className="text-mid text-sm mb-6">
              Compartilha email e senha com o colaborador. Ele já consegue logar agora
              e aparece nas abas Time, Ranking e Equipe.
            </p>
            <CredentialRow label="Email" value={created.email} onCopy={() => copy(created.email, "Email")} />
            <CredentialRow
              label="Senha"
              value={created.password}
              onCopy={() => copy(created.password, "Senha")}
              mono
            />
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClosed}
                className="btn-pill btn-ghost flex-1"
                style={{ height: 44, fontSize: 13 }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                }}
                className="btn-pill btn-gold flex-1"
                style={{ height: 44, fontSize: 13 }}
              >
                Adicionar outro
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <span className="label-caps mb-3 block">Novo colaborador</span>
            <h3
              className="text-white mb-6"
              style={{
                fontWeight: 900,
                fontSize: "1.75rem",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              Adicionar<br />
              <span
                className="text-[#C9953A]"
                style={{
                  fontWeight: 300,
                  fontStyle: "italic",
                  textTransform: "lowercase",
                  letterSpacing: "-0.02em",
                }}
              >
                ao time.
              </span>
            </h3>

            <div className="space-y-5">
              <div>
                <label className="label-caps label-caps-muted block mb-2">Nome</label>
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Bruno Faria"
                  className="input-square"
                />
              </div>

              <div>
                <label className="label-caps label-caps-muted block mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bruno@anomalo.com.br"
                  className="input-square"
                />
                <p className="text-faint text-xs mt-1.5">
                  Email exato do login. É como o sistema PA associa o user ao colaborador.
                </p>
              </div>

              <div>
                <label className="label-caps label-caps-muted block mb-2">
                  Funções <span className="text-[#fb2c36]">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {FUNCOES.map((f) => {
                    const on = funcoes.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFuncao(f)}
                        className="label-caps px-3 py-2 rounded-full transition-all"
                        style={{
                          background: on ? "#C9953A" : "rgba(255,255,255,0.04)",
                          color: on ? "#1a1410" : "rgba(255,255,255,0.65)",
                          boxShadow: on
                            ? "0 0 12px rgba(201,149,58,0.30)"
                            : "inset 0 0 0 1px rgba(255,255,255,0.10)",
                          fontSize: 11,
                        }}
                      >
                        {FUNCAO_LABEL[f]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-faint text-xs mt-2">
                  Selecione todas as funções que o colaborador exerce (multi).
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="accent-[#C9953A]"
                />
                <div>
                  <span className="text-white text-sm font-semibold block">
                    Conta admin
                  </span>
                  <span className="text-mid text-xs">
                    Pode validar ações, gerenciar atividades, fechar mês e
                    processar resgates. Pontua normalmente igual qualquer um.
                  </span>
                </div>
              </label>

              <div>
                <label className="label-caps label-caps-muted block mb-2">Senha inicial</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-square pr-10 text-mono"
                      style={{ fontFamily: "var(--font-inter)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-mid hover:text-white"
                      tabIndex={-1}
                      aria-label={showPw ? "Esconder" : "Mostrar"}
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPassword(genPassword())}
                    className="btn-pill btn-ghost flex-shrink-0"
                    style={{ height: 44, padding: "0 14px", fontSize: 11 }}
                    aria-label="Gerar nova senha"
                  >
                    <RefreshCw size={12} />
                    Gerar
                  </button>
                </div>
                <p className="text-faint text-xs mt-1.5">
                  Mínimo 8 caracteres. O usuário pode trocar depois em /perfil/editar.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-7">
              <button
                type="button"
                onClick={onClosed}
                className="btn-pill btn-ghost flex-1"
                style={{ height: 44, fontSize: 13 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-pill btn-gold flex-1 disabled:opacity-50"
                style={{ height: 44, fontSize: 13 }}
              >
                {submitting ? "Criando…" : "Criar colaborador"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 mb-3 px-4 py-3 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.30)",
      }}
    >
      <div className="flex-1 min-w-0">
        <span className="label-caps label-caps-muted block mb-0.5">{label}</span>
        <span
          className="text-white block truncate"
          style={{
            fontFamily: "var(--font-inter)",
            fontWeight: mono ? 600 : 500,
            fontSize: 14,
            letterSpacing: mono ? "0.02em" : 0,
          }}
        >
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="btn-pill btn-ghost flex-shrink-0"
        style={{ height: 36, padding: "0 14px", fontSize: 11 }}
      >
        <Copy size={12} />
        Copiar
      </button>
    </div>
  );
}
