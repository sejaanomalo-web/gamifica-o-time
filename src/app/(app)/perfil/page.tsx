// /perfil — perfil do colaborador. Sem comissionamento detalhado.
// Mostra: avatar, nome, função, nível atual com barra de progresso
// até o próximo nível, e botão pra editar/sair.

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireColaboradorPA } from "@/lib/pa-auth";
import { SignOutButton } from "@/components/feature/profile/SignOutButton";
import {
  calcularNivel,
  currentMesAno,
  mesAnoLabel,
  NIVEL_LABEL,
  NIVEL_COR,
  paAteProximoNivel,
  progressoDoNivelAtual,
  FUNCAO_LABEL,
  type FuncaoCodigo,
} from "@/lib/pa";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[perfil] ${label} failed:`, err);
    return fallback;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PerfilPage() {
  const colab = await requireColaboradorPA();
  const mesAno = currentMesAno();
  const [year, month] = mesAno.split("-").map(Number);
  const inicio = new Date(year, month - 1, 1);
  const fim = new Date(year, month, 1);

  const paMes = await safe(
    "acao.aggregate mes",
    async () => {
      const r = await prisma.acaoPontuada.aggregate({
        where: {
          colaboradorId: colab.id,
          data: { gte: inicio, lt: fim },
          status: { not: "REJEITADA" },
        },
        _sum: { paGerado: true },
      });
      return Number(r._sum.paGerado ?? 0);
    },
    0,
  );

  // Total de ações já registradas (lifetime)
  const totalAcoes = await safe(
    "acao.count",
    () =>
      prisma.acaoPontuada.count({
        where: { colaboradorId: colab.id, status: { not: "REJEITADA" } },
      }),
    0,
  );

  // Meses ativos (lifetime — quantos meses já registrou alguma coisa)
  const mesesAtivos = await safe(
    "acao.distinct months",
    async () => {
      const rows = await prisma.acaoPontuada.findMany({
        where: { colaboradorId: colab.id, status: { not: "REJEITADA" } },
        select: { data: true },
      });
      const set = new Set(rows.map((r) => r.data.toISOString().slice(0, 7)));
      return set.size;
    },
    0,
  );

  const nivel = calcularNivel(paMes);
  const proximo = paAteProximoNivel(paMes);
  const dentroNivel = progressoDoNivelAtual(paMes);

  const initials = colab.nome
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const funcoesLabel = colab.funcoes
    .map((f) => FUNCAO_LABEL[f as FuncaoCodigo] ?? f)
    .join(" · ");

  return (
    <div className="relative px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 flex items-center justify-center text-2xl font-black rounded-full overflow-hidden flex-shrink-0"
            style={{
              background: "rgba(201, 149, 58, 0.10)",
              color: "#C9953A",
              boxShadow:
                "inset 0 0 0 1.5px #C9953A, 0 0 24px rgba(201,149,58,0.30), 0 8px 32px -16px rgba(0,0,0,0.6)",
            }}
          >
            {colab.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={colab.avatarUrl}
                alt={colab.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1
              className="text-white"
              style={{
                fontWeight: 900,
                fontSize: "1.75rem",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {colab.nome}
            </h1>
            <span className="label-caps label-caps-muted mt-1.5 block">
              {funcoesLabel}
            </span>
            {colab.isAdmin && (
              <span
                className="label-caps text-[10px] mt-1.5 inline-block px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(201,149,58,0.10)",
                  color: "#C9953A",
                  boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.40)",
                }}
              >
                Admin
              </span>
            )}
          </div>
        </div>
        <Link
          href="/perfil/editar"
          className="btn-pill btn-ghost flex-shrink-0"
          style={{ height: 40, padding: "0 18px", fontSize: 12 }}
        >
          Editar
        </Link>
      </div>

      {/* NÍVEL ATUAL + BARRA */}
      <section className="ano-card-flat p-6 mt-10">
        <span className="label-caps label-caps-muted block mb-2">
          Nível · {mesAnoLabel(mesAno)}
        </span>
        <div className="flex items-baseline gap-4 mb-1">
          <span
            style={{
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: NIVEL_COR[nivel],
              textTransform: "uppercase",
            }}
          >
            {NIVEL_LABEL[nivel]}
          </span>
          <span
            className="text-mono text-[#C9953A] tabular-nums"
            style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {paMes.toFixed(1)} PA
          </span>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between mb-2">
            <span className="label-caps label-caps-muted">
              Progresso dentro do {NIVEL_LABEL[nivel]}
            </span>
            <span className="text-mono text-[#C9953A] text-xs font-bold">
              {dentroNivel.pct}%
            </span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${dentroNivel.pct}%`,
                background: "linear-gradient(90deg, #C9953A 0%, #E0B25A 100%)",
                boxShadow: "0 0 10px rgba(201,149,58,0.45)",
                transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-mid text-mono">
            <span>{dentroNivel.base} PA</span>
            <span className="text-[#C9953A]">{paMes.toFixed(1)} PA</span>
            <span>{dentroNivel.topo} PA</span>
          </div>
        </div>

        {proximo.proximo && (
          <p className="mt-5 text-sm text-mid">
            Faltam{" "}
            <span className="text-mono text-[#C9953A] font-bold">
              {proximo.faltam?.toFixed(1)}
            </span>{" "}
            PA pra{" "}
            <span className="text-[#C9953A] font-semibold">
              {NIVEL_LABEL[proximo.proximo]}
            </span>
            .
          </p>
        )}
        {!proximo.proximo && (
          <p className="mt-5 text-sm text-[#E0B25A]">
            Você já tá em Excelência neste mês. Topo do ranking.
          </p>
        )}
      </section>

      {/* STATS HISTÓRICO */}
      <section className="grid grid-cols-2 gap-3 mt-6">
        <div className="ano-card-flat p-5 text-center">
          <span className="label-caps label-caps-muted block mb-2">Total de ações</span>
          <span
            className="text-mono text-white"
            style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {totalAcoes}
          </span>
        </div>
        <div className="ano-card-flat p-5 text-center">
          <span className="label-caps label-caps-muted block mb-2">Meses no time</span>
          <span
            className="text-mono text-white"
            style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {mesesAtivos}
          </span>
        </div>
      </section>

      {/* ACESSOS ADMIN — só pra admins. Painel admin + Equipe (TV dashboard)
          ficam aqui em vez de na nav, reforçando que admin é responsabilidade
          extra, não privilégio de navegação. */}
      {colab.isAdmin && (
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/admin/pa" className="ano-card p-6 group block">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="label-caps mb-2 block">Acesso administrativo</span>
                <p className="text-white text-base font-semibold mb-1">Painel admin</p>
                <p className="text-mid text-sm">
                  Validar ações, gerenciar atividades, fechar mês, processar
                  resgates da loja.
                </p>
              </div>
              <span
                className="text-[#C9953A] text-2xl flex-shrink-0 group-hover:translate-x-1"
                style={{
                  transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                →
              </span>
            </div>
          </Link>

          <Link href="/equipe" className="ano-card p-6 group block">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="label-caps mb-2 block">Modo TV</span>
                <p className="text-white text-base font-semibold mb-1">Equipe</p>
                <p className="text-mid text-sm">
                  Dashboard kiosk pra rodar 24h na TV do escritório com ranking,
                  spotlight e auto-refresh.
                </p>
              </div>
              <span
                className="text-[#C9953A] text-2xl flex-shrink-0 group-hover:translate-x-1"
                style={{
                  transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                →
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* SAIR */}
      <div className="mt-12 mb-4 flex justify-center">
        <SignOutButton />
      </div>

      <span
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          bottom: 110,
          right: 16,
          color: "rgba(201,149,58,0.60)",
          fontSize: 14,
          fontWeight: 300,
        }}
      >
        Λ
      </span>
    </div>
  );
}
