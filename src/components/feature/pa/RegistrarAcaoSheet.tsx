"use client";

// Bottom sheet pra registrar atividade. 3 steps:
// - Step 1: escolher função (skip se só tem 1)
// - Step 2: escolher atividade do catálogo daquela função
// - Step 3: detalhes (quantidade, data, cliente, observação)

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, Minus, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FUNCAO_LABEL, type FuncaoCodigo } from "@/lib/pa";

export interface Atividade {
  id: string;
  funcao: string;
  nome: string;
  codigo: string;
  paValor: number;
  ordem: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaboradorId: string;
  funcoes: string[];
  atividades: Atividade[];
}

type Step = "funcao" | "atividade" | "detalhes" | "sucesso";

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RegistrarAcaoSheet({ open, onOpenChange, funcoes, atividades }: Props) {
  const router = useRouter();
  const onlyOneFuncao = funcoes.length === 1;

  const [step, setStep] = useState<Step>(onlyOneFuncao ? "atividade" : "funcao");
  const [funcao, setFuncao] = useState<string>(funcoes[0] ?? "");
  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [data, setData] = useState(hojeISO());
  const [cliente, setCliente] = useState("");
  const [observacao, setObservacao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paSalvo, setPaSalvo] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(onlyOneFuncao ? "atividade" : "funcao");
    setFuncao(funcoes[0] ?? "");
    setAtividade(null);
    setQuantidade(1);
    setData(hojeISO());
    setCliente("");
    setObservacao("");
    setPaSalvo(0);
  }, [open, onlyOneFuncao, funcoes]);

  const atividadesDaFuncao = useMemo(
    () => atividades.filter((a) => a.funcao === funcao).sort((a, b) => a.ordem - b.ordem),
    [atividades, funcao],
  );

  const paPreview = atividade ? quantidade * atividade.paValor : 0;

  const onSubmit = async () => {
    if (!atividade) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/pa/acoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atividadeId: atividade.id,
          data,
          quantidade,
          cliente: cliente.trim() || null,
          observacao: observacao.trim() || null,
        }),
      });
      const json: { ok?: boolean; error?: string; paGerado?: number } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Falha ao registrar");
        return;
      }
      setPaSalvo(json.paGerado ?? paPreview);
      setStep("sucesso");
      router.refresh();
      // Fecha após mostrar a tela de sucesso por 1.5s
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch {
      toast.error("Falha ao registrar. Tenta de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          initial={{ background: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
          animate={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          exit={{ background: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.3 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="flex flex-col w-full"
            style={{
              background: "#111115",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 -20px 60px rgba(0,0,0,0.6)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              maxHeight: "calc(100dvh - 12px)",
              marginTop: 12,
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <span className="rounded-full" style={{ width: 40, height: 4, background: "rgba(255,255,255,0.18)" }} />
            </div>

            <div
              className="px-6 py-4 flex items-start justify-between flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div>
                <span className="label-caps mb-1 block">Registrar atividade</span>
                <h2
                  className="text-white"
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  {step === "funcao" && "Qual função?"}
                  {step === "atividade" && "O que foi feito?"}
                  {step === "detalhes" && "Detalhes"}
                  {step === "sucesso" && (
                    <>
                      <span className="text-[#C9953A]">+{paSalvo.toFixed(1)} PA</span>
                    </>
                  )}
                </h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Fechar"
                className="rounded-full p-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Step 1: função */}
            {step === "funcao" && (
              <div className="px-6 py-6 flex flex-col gap-3">
                {funcoes.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFuncao(f);
                      setStep("atividade");
                    }}
                    className="text-left flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-white/[0.04]"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                  >
                    <span className="text-white font-semibold">
                      {FUNCAO_LABEL[f as FuncaoCodigo] ?? f}
                    </span>
                    <ChevronRight size={16} className="text-[#C9953A]" />
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: atividade */}
            {step === "atividade" && (
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-2">
                {atividadesDaFuncao.map((a) => {
                  const negativa = a.paValor < 0;
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        setAtividade(a);
                        setStep("detalhes");
                      }}
                      className="text-left flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.04]"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                      }}
                    >
                      <span className="text-white text-sm pr-3 flex-1">{a.nome}</span>
                      <span
                        className="text-mono text-sm flex-shrink-0"
                        style={{
                          fontWeight: 700,
                          color: negativa ? "#fb2c36" : "#C9953A",
                        }}
                      >
                        {negativa ? "" : "+"}
                        {a.paValor.toFixed(1)} PA
                      </span>
                    </button>
                  );
                })}
                {!onlyOneFuncao && (
                  <button
                    onClick={() => setStep("funcao")}
                    className="label-caps label-caps-muted mt-3 self-start hover:text-[#C9953A]"
                  >
                    ← Trocar função
                  </button>
                )}
              </div>
            )}

            {/* Step 3: detalhes */}
            {step === "detalhes" && atividade && (
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
                <div
                  className="p-4 rounded-xl flex items-center justify-between"
                  style={{
                    background: "rgba(201,149,58,0.06)",
                    boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.30)",
                  }}
                >
                  <span className="text-white text-sm font-semibold pr-3">{atividade.nome}</span>
                  <span
                    className="text-mono text-[#C9953A] flex-shrink-0"
                    style={{ fontSize: 14, fontWeight: 700 }}
                  >
                    {atividade.paValor < 0 ? "" : "+"}
                    {atividade.paValor.toFixed(1)} PA/un
                  </span>
                </div>

                <Field label="Quantidade">
                  <div
                    className="w-full h-12 flex items-center rounded-full overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.30)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                      className="w-12 h-full text-mid hover:text-white flex items-center justify-center"
                      aria-label="Diminuir"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantidade}
                      onChange={(e) =>
                        setQuantidade(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="text-mono flex-1 min-w-0 bg-transparent text-center outline-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ MozAppearance: "textfield", color: "#FFFFFF", fontWeight: 700, fontSize: 18 }}
                    />
                    <button
                      type="button"
                      onClick={() => setQuantidade((q) => q + 1)}
                      className="w-12 h-full text-[#C9953A] hover:text-[#E0B25A] flex items-center justify-center"
                      aria-label="Aumentar"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </Field>

                <Field label="Data">
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    max={hojeISO()}
                    className="input-square w-full"
                  />
                </Field>

                <Field label="Cliente (opcional)">
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Hato, IBB, …"
                    className="input-square w-full"
                  />
                </Field>

                <Field label="Observação (opcional)">
                  <textarea
                    rows={2}
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Detalhes que ajudem a memória"
                    className="input-square w-full resize-none py-2"
                  />
                </Field>

                <div
                  className="p-4 rounded-xl flex items-center justify-between mt-2"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="label-caps label-caps-muted">Você vai ganhar</span>
                  <span
                    className="text-mono"
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: paPreview < 0 ? "#fb2c36" : "#C9953A",
                    }}
                  >
                    {paPreview < 0 ? "" : "+"}
                    {paPreview.toFixed(1)} PA
                  </span>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setStep("atividade")}
                    className="btn-pill btn-ghost flex-1"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="btn-pill btn-gold flex-[2] disabled:opacity-40"
                  >
                    {submitting ? "Registrando…" : "Confirmar"}
                  </button>
                </div>
              </div>
            )}

            {/* Sucesso */}
            {step === "sucesso" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-6 py-16 flex flex-col items-center gap-3"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(201,149,58,0.10)",
                    boxShadow:
                      "inset 0 0 0 2px #C9953A, 0 0 32px rgba(201,149,58,0.45)",
                    color: "#C9953A",
                  }}
                >
                  <Check size={36} />
                </div>
                <p className="text-mid text-sm">Registrado.</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-caps label-caps-muted block mb-2">{label}</label>
      {children}
    </div>
  );
}
