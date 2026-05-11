"use client";

// Client island do /admin/pa com 4 tabs:
// - Validações: ações PENDENTE, admin aprova/ajusta/rejeita
// - Ações: todas as ações do mês com filtros + remoção
// - Loja: resgates de gift cards pra processar
// - Fechamentos: histórico de fechamentos mensais + botão Fechar mês

import { useState, useMemo } from "react";
import { Trash2, Check, X, ShieldCheck, Gift, Lock, ListChecks, Plus } from "lucide-react";
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

export interface AtividadeRow {
  id: string;
  funcao: FuncaoCodigo;
  nome: string;
  codigo: string;
  paValor: number;
  ativo: boolean;
  ordem: number;
}

interface Props {
  acoes: AcaoRow[];
  fechamentos: FechamentoRow[];
  resgates: ResgateRow[];
  atividades: AtividadeRow[];
  mesAno: string;
  tabInicial: "validacoes" | "acoes" | "loja" | "atividades" | "fechamentos";
}

type Tab = "validacoes" | "acoes" | "loja" | "atividades" | "fechamentos";

const FUNCOES_OPCOES: FuncaoCodigo[] = [
  "sdr",
  "design",
  "trafego",
  "social_midia",
  "video_maker",
  "closer",
];

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

export function AdminPaClient({
  acoes,
  fechamentos,
  resgates,
  atividades,
  mesAno,
  tabInicial,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(tabInicial);
  const [busy, setBusy] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState<{ id: string; qtd: number } | null>(null);

  // Drafts pra edição inline das atividades
  const [atvDrafts, setAtvDrafts] = useState<
    Record<string, Partial<AtividadeRow>>
  >({});
  const [criandoAtv, setCriandoAtv] = useState<{
    funcao: FuncaoCodigo;
    nome: string;
    codigo: string;
    paValor: string;
  } | null>(null);

  const setAtvDraft = (id: string, patch: Partial<AtividadeRow>) =>
    setAtvDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...patch } }));
  const mergedAtv = (a: AtividadeRow): AtividadeRow => ({
    ...a,
    ...(atvDrafts[a.id] ?? {}),
  });
  const dirtyAtv = (a: AtividadeRow): boolean => {
    const d = atvDrafts[a.id];
    if (!d) return false;
    return Object.keys(d).some((k) => {
      const key = k as keyof AtividadeRow;
      return d[key] !== undefined && d[key] !== a[key];
    });
  };

  const salvarAtv = async (a: AtividadeRow) => {
    const m = mergedAtv(a);
    if (!dirtyAtv(a)) return;
    if (!m.nome.trim() || !m.codigo.trim()) {
      toast.error("Nome e código obrigatórios");
      return;
    }
    setBusy(a.id);
    try {
      const res = await fetch(`/api/admin/pa/atividades/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcao: m.funcao,
          nome: m.nome.trim(),
          codigo: m.codigo.trim(),
          paValor: Number(m.paValor),
          ativo: m.ativo,
          ordem: m.ordem,
        }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success("Atividade atualizada.");
      setAtvDrafts((d) => {
        const { [a.id]: _omit, ...rest } = d;
        void _omit;
        return rest;
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const removerAtv = async (a: AtividadeRow) => {
    if (!confirm(`Remover "${a.nome}"? (código: ${a.codigo})`)) return;
    setBusy(a.id);
    try {
      const res = await fetch(`/api/admin/pa/atividades/${a.id}`, { method: "DELETE" });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success("Atividade removida.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const criarAtv = async () => {
    if (!criandoAtv) return;
    if (
      !criandoAtv.nome.trim() ||
      !criandoAtv.codigo.trim() ||
      !Number.isFinite(Number(criandoAtv.paValor))
    ) {
      toast.error("Função, nome, código e PA são obrigatórios");
      return;
    }
    setBusy("__new_atv__");
    try {
      const res = await fetch("/api/admin/pa/atividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcao: criandoAtv.funcao,
          nome: criandoAtv.nome.trim(),
          codigo: criandoAtv.codigo.trim(),
          paValor: Number(criandoAtv.paValor),
        }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success("Atividade criada.");
      setCriandoAtv(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

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
        <TabButton id="atividades" label="Atividades" icon={<ListChecks size={12} />} />
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
        <div className="ano-card-flat overflow-x-auto">
          {pendentes.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center">
              Nada pendente. Todas as ações do mês foram revisadas.
            </p>
          ) : (
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
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
        <div className="ano-card-flat overflow-x-auto">
          {acoes.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center">
              Nenhuma ação registrada nesse mês.
            </p>
          ) : (
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
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
        <div className="ano-card-flat overflow-x-auto">
          {resgates.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center">
              Nenhum resgate da loja ainda.
            </p>
          ) : (
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
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

      {/* TAB · Atividades (CRUD do catálogo) */}
      {tab === "atividades" && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <span className="text-mid text-xs">
              {atividades.length} atividades no catálogo · ajuste PA, ative/desative,
              adicione ou remova.
            </span>
            {!criandoAtv && (
              <button
                onClick={() =>
                  setCriandoAtv({
                    funcao: "sdr",
                    nome: "",
                    codigo: "",
                    paValor: "1.0",
                  })
                }
                className="btn-pill btn-gold"
                style={{ height: 36, padding: "0 16px", fontSize: 11 }}
              >
                <Plus size={12} />
                Nova atividade
              </button>
            )}
          </div>

          <div className="ano-card-flat overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Função</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Nome</th>
                  <th className="text-left px-4 py-3 label-caps label-caps-muted">Código</th>
                  <th className="text-right px-4 py-3 label-caps label-caps-muted">PA</th>
                  <th className="text-center px-4 py-3 label-caps label-caps-muted">Ativa</th>
                  <th className="px-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {criandoAtv && (
                  <tr style={{ background: "rgba(201,149,58,0.05)" }}>
                    <td className="px-4 py-3">
                      <select
                        value={criandoAtv.funcao}
                        onChange={(e) =>
                          setCriandoAtv({ ...criandoAtv, funcao: e.target.value as FuncaoCodigo })
                        }
                        className="input-square"
                        style={{ fontSize: 12 }}
                      >
                        {FUNCOES_OPCOES.map((f) => (
                          <option key={f} value={f}>
                            {FUNCAO_LABEL[f]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Nome da atividade"
                        value={criandoAtv.nome}
                        onChange={(e) =>
                          setCriandoAtv({ ...criandoAtv, nome: e.target.value })
                        }
                        className="input-square w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="codigo_unico"
                        value={criandoAtv.codigo}
                        onChange={(e) =>
                          setCriandoAtv({
                            ...criandoAtv,
                            codigo: e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "_")
                              .replace(/[^a-z0-9_]/g, ""),
                          })
                        }
                        className="input-square w-full text-mono"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.5"
                        value={criandoAtv.paValor}
                        onChange={(e) =>
                          setCriandoAtv({ ...criandoAtv, paValor: e.target.value })
                        }
                        className="input-square w-20 text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-center label-caps label-caps-muted text-[10px]">
                      Sim
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={criarAtv}
                          disabled={busy === "__new_atv__"}
                          aria-label="Salvar"
                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#C9953A] hover:bg-white/[0.04] disabled:opacity-40"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setCriandoAtv(null)}
                          aria-label="Cancelar"
                          className="w-8 h-8 flex items-center justify-center rounded-full text-mid hover:bg-white/[0.04]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {atividades.map((a, i) => {
                  const m = mergedAtv(a);
                  const isDirty = dirtyAtv(a);
                  const isBusy = busy === a.id;
                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom:
                          i < atividades.length - 1
                            ? "1px solid rgba(255,255,255,0.05)"
                            : "none",
                        opacity: m.ativo ? 1 : 0.5,
                      }}
                    >
                      <td className="px-4 py-3">
                        <select
                          value={m.funcao}
                          onChange={(e) =>
                            setAtvDraft(a.id, { funcao: e.target.value as FuncaoCodigo })
                          }
                          className="input-square"
                          style={{ fontSize: 12, background: "transparent" }}
                        >
                          {FUNCOES_OPCOES.map((f) => (
                            <option key={f} value={f}>
                              {FUNCAO_LABEL[f]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={m.nome}
                          onChange={(e) => setAtvDraft(a.id, { nome: e.target.value })}
                          className="input-square w-full"
                          style={{ background: "transparent" }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={m.codigo}
                          onChange={(e) =>
                            setAtvDraft(a.id, {
                              codigo: e.target.value
                                .toLowerCase()
                                .replace(/\s+/g, "_")
                                .replace(/[^a-z0-9_]/g, ""),
                            })
                          }
                          className="input-square w-full text-mono text-xs"
                          style={{ background: "transparent" }}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={m.paValor}
                          onChange={(e) =>
                            setAtvDraft(a.id, { paValor: Number(e.target.value) })
                          }
                          className="input-square w-20 text-right"
                          style={{
                            background: "transparent",
                            color: m.paValor < 0 ? "#fb2c36" : undefined,
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={m.ativo}
                            onChange={(e) => setAtvDraft(a.id, { ativo: e.target.checked })}
                            className="accent-[#C9953A]"
                          />
                        </label>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isDirty && (
                            <button
                              onClick={() => salvarAtv(a)}
                              disabled={isBusy}
                              aria-label="Salvar"
                              className="w-8 h-8 flex items-center justify-center rounded-full text-[#C9953A] hover:bg-white/[0.04] disabled:opacity-40"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => removerAtv(a)}
                            disabled={isBusy}
                            aria-label="Remover"
                            className="w-8 h-8 flex items-center justify-center rounded-full text-[#fb2c36] hover:bg-white/[0.04] disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-faint text-xs">
            <strong className="text-mid">Negativos</strong> são penalidades. Atividades com
            ações já registradas só podem ser <strong className="text-mid">desativadas</strong>
            (não removidas) pra preservar histórico.
          </p>
        </div>
      )}

      {/* TAB · Fechamentos */}
      {tab === "fechamentos" && (
        <div className="ano-card-flat overflow-x-auto">
          {fechamentos.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center">
              Nenhum fechamento gerado ainda. Use{" "}
              <span className="text-[#C9953A]">Fechar mês</span> pra criar.
            </p>
          ) : (
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
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
