"use client";

// Dialog do admin pra editar dados de um colaborador existente.
// Refatorado pra PA: funcoes[] (multi-select) + isAdmin (toggle) + ativo.
// Senha antiga NUNCA é exibida; admin pode definir nova senha que aparece
// uma vez depois de salvar.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { FUNCAO_LABEL, type FuncaoCodigo } from "@/lib/pa";

interface UserShape {
  id: string;
  nome: string;
  email: string;
  funcoes: FuncaoCodigo[];
  isAdmin: boolean;
  ativo: boolean;
}

interface EditUserDialogProps {
  open: boolean;
  user: UserShape | null;
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

export function EditUserDialog({ open, user, onClose }: EditUserDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(user?.nome ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [funcoes, setFuncoes] = useState<FuncaoCodigo[]>(user?.funcoes ?? []);
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin ?? false);
  const [ativo, setAtivo] = useState(user?.ativo ?? true);
  const [pwMode, setPwMode] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);

  // Sync state quando muda o user prop
  useEffect(() => {
    if (user) {
      setName(user.nome);
      setEmail(user.email);
      setFuncoes(user.funcoes);
      setIsAdmin(user.isAdmin);
      setAtivo(user.ativo);
      setPwMode(false);
      setPassword("");
      setShowPw(false);
      setConfirmDelete(false);
      setSavedPassword(null);
    }
  }, [user]);

  if (!open || !user) return null;

  const close = () => {
    setName("");
    setEmail("");
    setFuncoes([]);
    setIsAdmin(false);
    setAtivo(true);
    setPwMode(false);
    setPassword("");
    setShowPw(false);
    setConfirmDelete(false);
    setSavedPassword(null);
    onClose();
  };

  const toggleFuncao = (f: FuncaoCodigo) => {
    setFuncoes((curr) =>
      curr.includes(f) ? curr.filter((x) => x !== f) : [...curr, f],
    );
  };

  const startPwReset = () => {
    setPwMode(true);
    setPassword(genPassword());
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (funcoes.length === 0) {
      toast.error("Selecione ao menos uma função");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name,
        email,
        funcoes,
        isAdmin,
        ativo,
      };
      if (pwMode && password) body.password = password;
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou.");
      toast.success("Colaborador atualizado.");
      if (pwMode && password) {
        setSavedPassword(password);
      } else {
        close();
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falhou.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou.");
      toast.success(
        data.desativado
          ? "Colaborador desativado (tinha ações registradas)."
          : "Colaborador removido.",
      );
      close();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falhou.");
    } finally {
      setSubmitting(false);
    }
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
      onClick={close}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ano-card-flat p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto my-8"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.10), 0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(201,149,58,0.10)",
        }}
      >
        {savedPassword ? (
          <div>
            <span className="label-caps mb-3 block">Senha definida</span>
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
              Compartilha com {user.nome}. Essa janela é a única vez que a senha
              aparece em claro.
            </p>
            <CredentialRow label="Email" value={email} onCopy={() => copy(email, "Email")} />
            <CredentialRow
              label="Senha"
              value={savedPassword}
              onCopy={() => copy(savedPassword, "Senha")}
            />
            <button
              type="button"
              onClick={close}
              className="btn-pill btn-gold w-full mt-6"
              style={{ height: 44, fontSize: 13 }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={onSave}>
            <span className="label-caps mb-3 block">Editar colaborador</span>
            <h3
              className="text-white mb-1"
              style={{
                fontWeight: 900,
                fontSize: "1.5rem",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {user.nome}
            </h3>
            <span
              className="label-caps text-mono mb-6 inline-block"
              style={{ color: "#C9953A", fontSize: 11, fontWeight: 700 }}
            >
              {user.isAdmin ? "ADMIN" : "COLABORADOR"}
              {user.funcoes.length > 0
                ? ` · ${user.funcoes.map((f) => FUNCAO_LABEL[f] ?? f).join(" · ")}`
                : ""}
            </span>

            <div className="space-y-5">
              <div>
                <label className="label-caps label-caps-muted block mb-2">Nome</label>
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-square"
                />
              </div>

              <div>
                <label className="label-caps label-caps-muted block mb-2">Email atual</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-square"
                />
                {email !== user.email && (
                  <p className="text-[10px] text-[#C9953A] mt-1.5 label-caps">
                    Será atualizado no auth.users e na tabela colaboradores
                  </p>
                )}
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
                    Acesso ao painel admin (validações, atividades, fechamento,
                    loja). Pontua normalmente junto com o time.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="accent-[#C9953A]"
                />
                <div>
                  <span className="text-white text-sm font-semibold block">Ativo</span>
                  <span className="text-mid text-xs">
                    Desmarcar oculta o colaborador das listas (Time, Equipe,
                    Ranking) sem apagar o histórico.
                  </span>
                </div>
              </label>

              {/* SENHA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-caps label-caps-muted">Senha</label>
                  {!pwMode && (
                    <button
                      type="button"
                      onClick={startPwReset}
                      className="label-caps text-[#C9953A] hover:text-[#E0B25A] transition-colors"
                    >
                      Definir nova senha →
                    </button>
                  )}
                </div>
                {!pwMode ? (
                  <p className="text-faint text-xs leading-relaxed">
                    Senha atual fica criptografada no Supabase Auth — não dá pra ver.
                    Use o botão acima pra resetar.
                  </p>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showPw ? "text" : "password"}
                          required
                          minLength={8}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input-square pr-10"
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
                      >
                        <RefreshCw size={12} />
                        Gerar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPwMode(false);
                          setPassword("");
                        }}
                        className="label-caps text-mid hover:text-[#fb2c36] transition-colors flex-shrink-0"
                      >
                        Cancelar
                      </button>
                    </div>
                    <p className="text-faint text-xs mt-1.5">
                      Mínimo 8 caracteres. Aparece uma vez depois de salvar.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-7">
              <button
                type="button"
                onClick={close}
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
                {submitting ? "Salvando…" : "Salvar"}
              </button>
            </div>

            <div
              className="mt-6 pt-5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="label-caps text-[#fb2c36] hover:underline transition-colors flex items-center gap-2"
                >
                  <Trash2 size={12} />
                  Remover colaborador do sistema
                </button>
              ) : (
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: "rgba(251,44,54,0.06)",
                    boxShadow: "inset 0 0 0 1px rgba(251,44,54,0.30)",
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle
                      size={16}
                      className="text-[#fb2c36] flex-shrink-0 mt-0.5"
                    />
                    <p className="text-white text-sm leading-relaxed">
                      Remove o login no Auth e o registro de colaborador.
                      Se o colaborador tiver ações registradas, é{" "}
                      <strong>desativado</strong> em vez de removido (preserva
                      histórico).
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="btn-pill btn-ghost flex-1"
                      style={{ height: 38, fontSize: 11 }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={onDelete}
                      disabled={submitting}
                      className="btn-pill flex-1 disabled:opacity-50"
                      style={{
                        height: 38,
                        fontSize: 11,
                        background: "#fb2c36",
                        color: "#fff",
                        boxShadow: "0 0 16px rgba(251,44,54,0.40)",
                      }}
                    >
                      {submitting ? "Removendo…" : "Remover mesmo"}
                    </button>
                  </div>
                </div>
              )}
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
}: {
  label: string;
  value: string;
  onCopy: () => void;
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
          style={{ fontWeight: 600, fontSize: 14, letterSpacing: "0.02em" }}
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
