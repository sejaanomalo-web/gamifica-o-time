"use client";

// Visão geral do mês: cards de stats globais + tabela do time + 2 botões
// pra exportar (PDF via window.print, CSV via Blob download).

import { Download, Printer, Trophy, Zap, FileCheck, Gift } from "lucide-react";
import {
  formatBRL,
  type FuncaoCodigo,
  type Nivel,
} from "@/lib/pa";

interface Row {
  id: string;
  nome: string;
  funcoes: FuncaoCodigo[];
  paMes: number;
  acoesMes: number;
  paLifetime: number;
  nivel: Nivel;
  comissao: number;
}

interface Stats {
  totalTimeMes: number;
  totalAcoesMes: number;
  totalLifetime: number;
  colabsAtivos: number;
  pendentes: number;
  aprovadas: number;
  rejeitadas: number;
  resgatesCount: number;
  resgatesValor: number;
}

interface Props {
  mesAno: string;
  mesAnoLabel: string;
  rows: Row[];
  funcaoLabel: Record<FuncaoCodigo, string>;
  nivelLabel: Record<Nivel, string>;
  nivelCor: Record<Nivel, string>;
  stats: Stats;
}

export function RelatoriosClient({
  mesAno,
  mesAnoLabel,
  rows,
  funcaoLabel,
  nivelLabel,
  nivelCor,
  stats,
}: Props) {
  const exportarCSV = () => {
    const header = [
      "Colaborador",
      "Funções",
      "PA do mês",
      "Ações do mês",
      "Nível",
      "Comissão (R$)",
      "PA total (lifetime)",
    ].join(";");
    const lines = rows.map((r) =>
      [
        r.nome,
        r.funcoes.map((f) => funcaoLabel[f] ?? f).join(" + "),
        r.paMes.toFixed(2).replace(".", ","),
        r.acoesMes,
        nivelLabel[r.nivel],
        r.comissao.toFixed(2).replace(".", ","),
        r.paLifetime.toFixed(2).replace(".", ","),
      ].join(";"),
    );
    const csv = "﻿" + [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${mesAno}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const imprimirPDF = () => {
    window.print();
  };

  return (
    <>
      {/* Cards de stats globais */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={<Zap size={16} />}
          label="PA do time no mês"
          value={stats.totalTimeMes.toFixed(1)}
          tone="primary"
        />
        <StatCard
          icon={<Trophy size={16} />}
          label="Ações registradas"
          value={String(stats.totalAcoesMes)}
        />
        <StatCard
          icon={<FileCheck size={16} />}
          label="Pendentes de validação"
          value={String(stats.pendentes)}
        />
        <StatCard
          icon={<Gift size={16} />}
          label="Resgates no mês"
          value={`${stats.resgatesCount} · R$ ${stats.resgatesValor}`}
        />
      </section>

      {/* Linha extra: lifetime + breakdown */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <SmallStat label="PA lifetime acumulado" value={stats.totalLifetime.toFixed(1)} />
        <SmallStat label="Aprovadas" value={String(stats.aprovadas)} />
        <SmallStat label="Rejeitadas" value={String(stats.rejeitadas)} />
        <SmallStat label="Colaboradores ativos" value={String(stats.colabsAtivos)} />
      </section>

      {/* Ações export */}
      <div className="flex items-center justify-end gap-2 mb-4 print:hidden">
        <button
          onClick={imprimirPDF}
          className="btn-pill btn-ghost"
          style={{ height: 36, padding: "0 16px", fontSize: 12 }}
          aria-label="Salvar em PDF"
        >
          <Printer size={14} />
          Salvar em PDF
        </button>
        <button
          onClick={exportarCSV}
          className="btn-pill btn-gold"
          style={{ height: 36, padding: "0 16px", fontSize: 12 }}
          aria-label="Baixar CSV"
        >
          <Download size={14} />
          Baixar CSV
        </button>
      </div>

      {/* Tabela desempenho */}
      <div className="ano-card-flat overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-faint text-sm py-12 text-center">
            Nenhum colaborador ativo.
          </p>
        ) : (
          <table className="w-full text-sm" style={{ minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">#</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Colaborador</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Função</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">PA mês</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Ações</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Nível</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Comissão</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Lifetime</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom:
                      i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <td className="px-5 py-3 text-mono text-mid">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-3 text-white font-semibold">{r.nome}</td>
                  <td className="px-5 py-3 text-mid text-xs">
                    {r.funcoes.map((f) => funcaoLabel[f] ?? f).join(" · ")}
                  </td>
                  <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
                    {r.paMes.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 text-right text-mono text-mid">{r.acoesMes}</td>
                  <td
                    className="px-5 py-3 label-caps text-[10px]"
                    style={{ color: nivelCor[r.nivel] }}
                  >
                    {nivelLabel[r.nivel]}
                  </td>
                  <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
                    {formatBRL(r.comissao)}
                  </td>
                  <td className="px-5 py-3 text-right text-mono text-mid">
                    {r.paLifetime.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-faint text-xs print:hidden">
        Relatório de <strong className="text-mid">{mesAnoLabel}</strong>. Os dados acima
        atualizam em tempo real conforme o time registra ações no app.
      </p>

      {/* Estilos pra impressão: oculta nav, botões e Λ; fundo branco */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav,
          .print\\:hidden {
            display: none !important;
          }
          .ano-card-flat {
            background: white !important;
            box-shadow: 0 0 0 1px #ccc !important;
          }
          table,
          th,
          td {
            color: black !important;
          }
          .text-white,
          .text-mid,
          .text-faint {
            color: black !important;
          }
          .text-\\[\\#C9953A\\] {
            color: #8a6e2a !important;
          }
        }
      `}</style>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary";
}) {
  return (
    <div
      className="ano-card-flat p-5"
      style={{
        boxShadow:
          tone === "primary"
            ? "inset 0 0 0 1px rgba(201,149,58,0.30), 0 0 24px rgba(201,149,58,0.10)"
            : "inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: tone === "primary" ? "#C9953A" : "#8A7850" }}>{icon}</span>
        <span className="label-caps label-caps-muted">{label}</span>
      </div>
      <span
        className="text-mono tabular-nums block"
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: tone === "primary" ? "#E0B25A" : "#FFFFFF",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ano-card-flat p-4 text-center">
      <span className="label-caps label-caps-muted text-[9px] block mb-1.5">{label}</span>
      <span
        className="text-mono text-white tabular-nums"
        style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {value}
      </span>
    </div>
  );
}
