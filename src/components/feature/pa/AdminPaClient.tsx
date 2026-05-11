"use client";

// Client island do /admin/pa com 4 tabs:
// - Validações: ações PENDENTE, admin aprova/ajusta/rejeita
// - Ações: todas as ações do mês com filtros + remoção
// - Loja: resgates de gift cards pra processar
// - Fechamentos: histórico de fechamentos mensais + botão Fechar mês

import { useState, useMemo } from "react";
import { Trash2, Check, X, ShieldCheck, Gift, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  FUNCAO_LABEL,
  NIVEL_LABEL,
  NIVEL_COR,
  formatBRL,
  type FuncaoCodigo,
  type Nivel,
} from "@/lib/pa";

interface AcaoRow {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  atividadeNome: string;
  atividadeFuncao: FuncaoCodigo;
  atividadePaValor: number;
  data: string;
  quantidade: number;
  paGerado: number;
  cliente: string | null;
  observacao: string | null;
  ehPenalidade: boolean;
  status: "PENDENTE" | "APROVADA" | "REJEITADA";
  createdAt: string;
}

interface FechamentoRow {
  id: string;
  colaboradorNome: string;
  paTotal: number;
  nivelAtingido: Nivel;
  totalComissao: number;
  fechadoEm: string;
}

interface ResgateRow {
  id: string;
  colaboradorNome: string;
  valorReais: number;
  paGasto: number;
  status: "PENDENTE" | "APROVADO" | "ENTREGUE" | "REJEITADO";
  observacao: string | null;
  createdAt: string;
  resolvidoEm: string | null;
}

interface Props {
  acoes: AcaoRow[];
  fechamentos: FechamentoRow[];
  resgates: ResgateRow[];
  mesAno: string;
  tabInicial: "validacoes" | "acoes" | "loja" | "fechamentos";
}

type Tab = "validacoes" | "acoes" | "loja" | "fechamentos";

const RESGATE_COR: Record<ResgateRow["status"], string> = {
  PENDENTE: "#8A7850",
  APROVADO: "#C9953A",
  ENTREGUE: "#E0B25A",
  REJEITADO: "#fb2c36",
};

const RESGATE_LABEL: Record<ResgateRow["status"], string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  ENTREGUE: "Entregue",
  REJEITADO: "Rejeitado",
};

export function AdminPaClient({ acoes, fechamentos, resgates, mesAno, tabInicial }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(tabInicial);
  const [busy, setBusy] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState<{ id: string; qtd: number } | null>(null);

  const pendentes = useMemo(() => acoes.filter((a) => a.status === "PENDENTE"), [acoes]);
  const resgatesPendentes = useMemo(
    () => resgates.filter((r) => r.status === "PENDENTE").length,
    [resgates],
  );

  const validar = async (
    a: AcaoRow,
    acao: "aprovar" | "rejeitar" | "ajustar",
    quantidade?: number,
  ) => {
    setBusy(a.id);
    try {
      const res = await fetch(`/api/admin/pa/acoes/${a.id}/validar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, quantidade }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success(
        acao === "aprovar"
          ? "Aprovada."
          : acao === "rejeitar"
            ? "Rejeitada (descontada)."
            : "Ajustada e aprovada.",
      );
      setAjustando(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const remover = async (a: AcaoRow) => {
    if (
      !confirm(
        `Remover ação de ${a.colaboradorNome}? ${a.atividadeNome} (${a.paGerado.toFixed(1)} PA)`,
      )
    )
      return;
    setBusy(a.id);
    try {
      const res = await fetch(`/api/pa/acoes/${a.id}`, { method: "DELETE" });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success("Removida.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const atualizarResgate = async (r: ResgateRow, status: "APROVADO" | "ENTREGUE" | "REJEITADO") => {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/pa/loja/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success(`Resgate ${status.toLowerCase()}.`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const fecharMes = async () => {
    if (
      !confirm(
        `Fechar o mês ${mesAno}? Gera/atualiza snapshot de comissão por colaborador (idempotente).`,
      )
    )
      return;
    setBusy("__fechamento__");
    try {
      const res = await fetch("/api/admin/pa/fechamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesAno }),
      });
      const data: { ok?: boolean; fechados?: number; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success(`Mês ${mesAno} fechado · ${data.fechados ?? 0} colaboradores.`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const TabButton = ({
    id,
    label,
    icon,
    badge,
  }: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }) => {
    const on = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        className="label-caps px-4 py-2 rounded-full transition-all flex items-center gap-2"
        style={{
          background: on ? "#C9953A" : "rgba(255,255,255,0.04)",
          color: on ? "#1a1410" : "rgba(255,255,255,0.65)",
          boxShadow: on
            ? "0 0 12px rgba(201,149,58,0.30)"
            : "inset 0 0 0 1px rgba(255,255,255,0.10)",
        }}
      >
        {icon}
        {label}
        {!!badge && badge > 0 && (
          <span
            className="text-mono"
            style={{
              fontSize: 10,
              background: on ? "rgba(26,20,16,0.20)" : "rgba(201,149,58,0.18)",
              color: on ? "#1a1410" : "#C9953A",
              padding: "1px 6px",
              borderRadius: 999,
            }}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <TabButton id="validacoes" label="Validações" icon={<ShieldCheck size={12} />} badge={pendentes.length} />
        <TabButton id="acoes" label="Ações" icon={<Check size={12} />} />
        <TabButton id="loja" label="Loja" icon={<Gift size={12} />} badge={resgatesPendentes} />
        <TabButton id="fechamentos" label="Fechamentos" icon={<Lock size={12} />} />

        {tab === "fechamentos" && (
          <button
            onClick={fecharMes}
            disabled={busy === "__fechamento__"}
            className="btn-pill btn-gold ml-auto disabled:opacity-40"
            style={{ height: 36, padding: "0 16px", fontSize: 11 }}
          >
            {busy === "__fechamento__" ? "Fechando…" : "Fechar mês"}
          </button>
        )}
      </div>

      {/* TAB · Validações */}
      {tab === "validacoes" && (
        <div className="ano-card-flat overflow-hidden">
          {pendentes.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center">
              Nada pendente. Todas as ações do mês foram revisadas.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Quem</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Atividade</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Data</th>
                  <th className="text-right px-4 py-3 label-caps label-caps-muted">Qtd</th>
                  <th className="text-right px-4 py-3 label-caps label-caps-muted">PA</th>
                  <th className="px-2 w-72" />
                </tr>
              </thead>
              <tbody>
                {pendentes.map((a, i) => {
                  const ajuste = ajustando?.id === a.id ? ajustando : null;
                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom:
                          i < pendentes.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}
                    >
                      <td className="px-4 py-3 text-white">{a.colaboradorNome}</td>
                      <td className="px-4 py-3 text-mid text-xs">
                        {a.atividadeNome}{" "}
                        <span className="label-caps text-[9px] text-faint ml-1">
                          {FUNCAO_LABEL[a.atividadeFuncao] ?? a.atividadeFuncao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-mid text-mono text-xs">{a.data}</td>
                      <td className="px-4 py-3 text-right">
                        {ajuste ? (
                          <input
                            type="number"
                            min={1}
                            value={ajuste.qtd}
                            onChange={(e) =>
                              setAjustando({
                                id: a.id,
                                qtd: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="input-square w-16 text-right"
                          />
                        ) : (
                          <span className="text-mono">{a.quantidade}</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-mono font-bold"
                        style={{ color: a.paGerado < 0 ? "#fb2c36" : "#C9953A" }}
                      >
                        {ajuste
                          ? (ajuste.qtd * a.atividadePaValor).toFixed(1)
                          : `${a.paGerado < 0 ? "" : "+"}${a.paGerado.toFixed(1)}`}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {ajuste ? (
                            <>
                              <button
                                onClick={() => validar(a, "ajustar", ajuste.qtd)}
                                disabled={busy === a.id}
                                className="label-caps text-[9px] px-3 py-1 rounded-full text-[#C9953A] hover:bg-white/[0.04]"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setAjustando(null)}
                                className="label-caps text-[9px] px-3 py-1 rounded-full text-mid hover:bg-white/[0.04]"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => validar(a, "aprovar")}
                                disabled={busy === a.id}
                                className="label-caps text-[9px] px-3 py-1 rounded-full text-[#C9953A] hover:bg-white/[0.04] flex items-center gap-1"
                              >
                                <Check size={11} /> Aprovar
                              </button>
                              <button
                                onClick={() => setAjustando({ id: a.id, qtd: a.quantidade })}
                                disabled={busy === a.id}
                                className="label-caps text-[9px] px-3 py-1 rounded-full text-mid hover:bg-white/[0.04]"
                              >
                                Ajustar
                              </button>
                              <button
                                onClick={() => validar(a, "rejeitar")}
                                disabled={busy === a.id}
                                className="label-caps text-[9px] px-3 py-1 rounded-full text-[#fb2c36] hover:bg-white/[0.04] flex items-center gap-1"
                              >
                                <X size={11} /> Rejeitar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB · Ações (todas do mês) */}
      {tab === "acoes" && (
        <div className="ano-card-flat overflow-hidden">
          {acoes.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center">
              Nenhuma ação registrada nesse mês.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Quem</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Atividade</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Função</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Data</th>
                  <th className="text-right px-4 py-3 label-caps label-caps-muted">PA</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Status</th>
                  <th className="px-2 w-12" />
                </tr>
              </thead>
              <tbody>
                {acoes.map((a, i) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom:
                        i < acoes.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      opacity: a.status === "REJEITADA" ? 0.5 : 1,
                    }}
                  >
                    <td className="px-4 py-3 text-white">{a.colaboradorNome}</td>
                    <td className="px-4 py-3 text-mid text-xs">{a.atividadeNome}</td>
                    <td className="px-4 py-3 label-caps text-[10px]">
                      {FUNCAO_LABEL[a.atividadeFuncao] ?? a.atividadeFuncao}
                    </td>
                    <td className="px-4 py-3 text-mid text-mono text-xs">{a.data}</td>
                    <td
                      className="px-4 py-3 text-right text-mono font-bold"
                      style={{ color: a.paGerado < 0 ? "#fb2c36" : "#C9953A" }}
                    >
                      {a.paGerado < 0 ? "" : "+"}
                      {a.paGerado.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 label-caps text-[10px]">{a.status}</td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => remover(a)}
                        disabled={busy === a.id}
                        aria-label="Remover"
                        className="w-7 h-7 flex items-center justify-center rounded-full text-[#fb2c36] hover:bg-white/[0.04] disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB · Loja */}
      {tab === "loja" && (
        <div className="ano-card-flat overflow-hidden">
          {resgates.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center">
              Nenhum resgate da loja ainda.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Quem</th>
                  <th className="text-right px-4 py-3 label-caps label-caps-muted">Valor</th>
                  <th className="text-right px-4 py-3 label-caps label-caps-muted">PA</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Solicitado</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Status</th>
                  <th className="px-2 w-56" />
                </tr>
              </thead>
              <tbody>
                {resgates.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom:
                        i < resgates.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      opacity: r.status === "REJEITADO" ? 0.5 : 1,
                    }}
                  >
                    <td className="px-4 py-3 text-white">{r.colaboradorNome}</td>
                    <td className="px-4 py-3 text-right text-[#C9953A] text-mono font-bold">
                      R$ {r.valorReais}
                    </td>
                    <td className="px-4 py-3 text-right text-mono text-mid">
                      {r.paGasto.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-mid text-xs">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="label-caps text-[9px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          color: RESGATE_COR[r.status],
                          boxShadow: `inset 0 0 0 1px ${RESGATE_COR[r.status]}40`,
                        }}
                      >
                        {RESGATE_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {r.status === "PENDENTE" && (
                          <>
                            <button
                              onClick={() => atualizarResgate(r, "APROVADO")}
                              disabled={busy === r.id}
                              className="label-caps text-[9px] px-3 py-1 rounded-full text-[#C9953A] hover:bg-white/[0.04]"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => atualizarResgate(r, "REJEITADO")}
                              disabled={busy === r.id}
                              className="label-caps text-[9px] px-3 py-1 rounded-full text-[#fb2c36] hover:bg-white/[0.04]"
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                        {r.status === "APROVADO" && (
                          <button
                            onClick={() => atualizarResgate(r, "ENTREGUE")}
                            disabled={busy === r.id}
                            className="label-caps text-[9px] px-3 py-1 rounded-full text-[#E0B25A] hover:bg-white/[0.04]"
                          >
                            Marcar entregue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB · Fechamentos */}
      {tab === "fechamentos" && (
        <div className="ano-card-flat overflow-hidden">
          {fechamentos.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center">
              Nenhum fechamento gerado ainda. Use{" "}
              <span className="text-[#C9953A]">Fechar mês</span> pra criar.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left px-5 py-3 label-caps label-caps-muted">Colaborador</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">PA</th>
                  <th className="text-left px-5 py-3 label-caps label-caps-muted">Nível</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">Comissão</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">Fechado em</th>
                </tr>
              </thead>
              <tbody>
                {fechamentos.map((f, i) => (
                  <tr
                    key={f.id}
                    style={{
                      borderBottom:
                        i < fechamentos.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <td className="px-5 py-3 text-white">{f.colaboradorNome}</td>
                    <td className="px-5 py-3 text-right text-mono">{f.paTotal.toFixed(1)}</td>
                    <td
                      className="px-5 py-3 label-caps text-[10px]"
                      style={{ color: NIVEL_COR[f.nivelAtingido] }}
                    >
                      {NIVEL_LABEL[f.nivelAtingido]}
                    </td>
                    <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
                      {formatBRL(f.totalComissao)}
                    </td>
                    <td className="px-5 py-3 text-right text-mid text-xs">
                      {new Date(f.fechadoEm).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
