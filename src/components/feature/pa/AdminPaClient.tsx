"use client";

// Client island do /admin/pa:
// - Tabela de ações com filtro (pessoa/função) e ações inline (editar/remover)
// - Botão "Fechar mês" (chama /api/admin/pa/fechamento)
// - Lista de fechamentos do mês selecionado

import { useState, useMemo } from "react";
import { Trash2, Check } from "lucide-react";
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
  data: string; // YYYY-MM-DD
  quantidade: number;
  paGerado: number;
  cliente: string | null;
  observacao: string | null;
  ehPenalidade: boolean;
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

interface Props {
  acoes: AcaoRow[];
  fechamentos: FechamentoRow[];
  mesAno: string;
}

export function AdminPaClient({ acoes, fechamentos, mesAno }: Props) {
  const router = useRouter();
  const [filtroPessoa, setFiltroPessoa] = useState<string>("all");
  const [filtroFuncao, setFiltroFuncao] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [editando, setEditando] = useState<{
    id: string;
    quantidade: number;
    cliente: string;
    observacao: string;
  } | null>(null);

  const pessoas = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of acoes) map.set(a.colaboradorId, a.colaboradorNome);
    return [...map.entries()];
  }, [acoes]);

  const filtered = useMemo(() => {
    return acoes.filter((a) => {
      if (filtroPessoa !== "all" && a.colaboradorId !== filtroPessoa) return false;
      if (filtroFuncao !== "all" && a.atividadeFuncao !== filtroFuncao) return false;
      return true;
    });
  }, [acoes, filtroPessoa, filtroFuncao]);

  const fecharMes = async () => {
    if (
      !confirm(
        `Fechar o mês ${mesAno}? Vai gerar/atualizar snapshot pra cada colaborador (idempotente — pode refazer).`,
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
        toast.error(data.error ?? "Falha ao fechar");
        return;
      }
      toast.success(`Mês ${mesAno} fechado · ${data.fechados ?? 0} colaboradores.`);
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
      toast.success("Ação removida.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    setBusy(editando.id);
    try {
      const res = await fetch(`/api/pa/acoes/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantidade: editando.quantidade,
          cliente: editando.cliente.trim() || null,
          observacao: editando.observacao.trim() || null,
        }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Falha");
        return;
      }
      toast.success("Ação atualizada.");
      setEditando(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <select
          value={filtroPessoa}
          onChange={(e) => setFiltroPessoa(e.target.value)}
          className="input-square"
          style={{ height: 36, fontSize: 12 }}
        >
          <option value="all">Todas as pessoas</option>
          {pessoas.map(([id, nome]) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </select>
        <select
          value={filtroFuncao}
          onChange={(e) => setFiltroFuncao(e.target.value)}
          className="input-square"
          style={{ height: 36, fontSize: 12 }}
        >
          <option value="all">Todas as funções</option>
          {(Object.entries(FUNCAO_LABEL) as [string, string][]).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>

        <span className="text-mid text-xs ml-auto">
          {filtered.length} de {acoes.length} ações
        </span>

        <button
          onClick={fecharMes}
          disabled={busy === "__fechamento__"}
          className="btn-pill btn-gold disabled:opacity-40"
          style={{ height: 36, padding: "0 16px", fontSize: 11 }}
        >
          {busy === "__fechamento__" ? "Fechando…" : "Fechar mês"}
        </button>
      </div>

      <div className="ano-card-flat overflow-hidden mb-10">
        {filtered.length === 0 ? (
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
                <th className="text-right px-4 py-3 label-caps label-caps-muted">Qtd</th>
                <th className="text-right px-4 py-3 label-caps label-caps-muted">PA</th>
                <th className="text-left px-4 py-3 label-caps label-caps-muted">Cliente</th>
                <th className="px-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const isEditing = editando?.id === a.id;
                return (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom:
                        i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <td className="px-4 py-3 text-white">{a.colaboradorNome}</td>
                    <td className="px-4 py-3 text-mid text-xs">{a.atividadeNome}</td>
                    <td className="px-4 py-3 label-caps text-[10px]">
                      {FUNCAO_LABEL[a.atividadeFuncao] ?? a.atividadeFuncao}
                    </td>
                    <td className="px-4 py-3 text-mid text-mono text-xs">{a.data}</td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min={1}
                          value={editando!.quantidade}
                          onChange={(e) =>
                            setEditando((s) =>
                              s ? { ...s, quantidade: Math.max(1, parseInt(e.target.value) || 1) } : s,
                            )
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
                      {a.paGerado < 0 ? "" : "+"}
                      {a.paGerado.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editando!.cliente}
                          onChange={(e) =>
                            setEditando((s) => (s ? { ...s, cliente: e.target.value } : s))
                          }
                          className="input-square w-full"
                          placeholder="—"
                        />
                      ) : (
                        <span className="text-mid text-xs">{a.cliente ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={salvarEdicao}
                              disabled={busy === a.id}
                              aria-label="Salvar"
                              className="w-7 h-7 flex items-center justify-center text-[#C9953A] hover:bg-white/[0.04] rounded-full"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditando(null)}
                              className="label-caps text-[9px] px-2 text-mid"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                setEditando({
                                  id: a.id,
                                  quantidade: a.quantidade,
                                  cliente: a.cliente ?? "",
                                  observacao: a.observacao ?? "",
                                })
                              }
                              className="label-caps text-[9px] px-2 py-1 text-[#C9953A] hover:bg-white/[0.04] rounded-full"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => remover(a)}
                              disabled={busy === a.id}
                              aria-label="Remover"
                              className="w-7 h-7 flex items-center justify-center text-[#fb2c36] hover:bg-white/[0.04] rounded-full"
                            >
                              <Trash2 size={13} />
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

      {/* Fechamentos do mês */}
      <section>
        <h2 className="label-caps label-caps-muted mb-3">Fechamentos · {mesAno}</h2>
        <div className="ano-card-flat overflow-hidden">
          {fechamentos.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center">
              Nenhum fechamento gerado ainda. Use o botão{" "}
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
                    <td className="px-5 py-3 label-caps text-[10px]" style={{ color: NIVEL_COR[f.nivelAtingido] }}>
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
      </section>
    </div>
  );
}
