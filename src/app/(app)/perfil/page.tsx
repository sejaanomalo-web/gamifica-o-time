import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { XpBar } from "@/components/feature/profile/XpBar";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { xpProgress } from "@/lib/xp";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[perfil] ${label} failed:`, err);
    return fallback;
  }
}

export default async function PerfilPage() {
  const user = await requireAppUser();

  const xpTotalAgg = await safe(
    "xpEvent.aggregate",
    () => prisma.xpEvent.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
    { _sum: { amount: 0 } },
  );
  const badgeCount = await safe(
    "userBadge.count",
    () => prisma.userBadge.count({ where: { userId: user.id } }),
    0,
  );
  const goalsBeaten = await safe(
    "goal.count",
    () => prisma.goal.count({ where: { ownerId: user.id, status: "CONCLUIDA" } }),
    0,
  );
  const seasonsCount = await safe(
    "xpEvent.distinct",
    () =>
      prisma.xpEvent.findMany({
        where: { userId: user.id },
        distinct: ["seasonId"],
        select: { seasonId: true },
      }),
    [] as { seasonId: string }[],
  );
  type SnapshotWithSeason = Awaited<
    ReturnType<typeof prisma.wrappedSnapshot.findMany<{ include: { season: true } }>>
  >;
  const snapshots = await safe<SnapshotWithSeason>(
    "wrappedSnapshot.findMany",
    () =>
      prisma.wrappedSnapshot.findMany({
        where: { userId: user.id },
        include: { season: true },
        orderBy: { createdAt: "desc" },
      }),
    [],
  );

  const totalXp = xpTotalAgg._sum.amount ?? 0;
  const prog = xpProgress(totalXp);

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      {/* HEADER */}
      <Reveal>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 flex items-center justify-center text-2xl font-black rounded-full overflow-hidden"
              style={{
                background: "rgba(201, 149, 58, 0.10)",
                color: "#C9953A",
                boxShadow:
                  "inset 0 0 0 1.5px #C9953A, 0 0 24px rgba(201,149,58,0.30), 0 8px 32px -16px rgba(0,0,0,0.6)",
              }}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
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
                {user.name}
              </h1>
              <span className="label-caps label-caps-muted mt-1.5 block">
                {user.area ?? "Anômalo"} · Nível {prog.level}
              </span>
            </div>
          </div>
          <Link
            href="/perfil/editar"
            className="btn-pill btn-ghost"
            style={{ height: 40, padding: "0 18px", fontSize: 12 }}
          >
            Editar
          </Link>
        </div>
      </Reveal>

      {/* HERO copy */}
      <Reveal delay={150}>
        <div className="mt-10">
          <h2
            className="text-white"
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            Sua<br />
            <span
              className="text-[#C9953A]"
              style={{
                fontWeight: 300,
                fontStyle: "italic",
                textTransform: "lowercase",
                letterSpacing: "-0.02em",
              }}
            >
              jornada.
            </span>
          </h2>
        </div>
      </Reveal>

      {/* XP BAR */}
      <Reveal delay={300}>
        <div className="mt-8 ano-card-flat p-6">
          <XpBar
            currentXp={totalXp}
            nextLevelXp={prog.next}
            level={prog.level}
            levelFloor={prog.next - prog.levelSize}
          />
          <div className="mt-3 flex items-baseline justify-between">
            <span className="label-caps label-caps-muted">XP até nível {prog.level + 1}</span>
            <span className="text-mono text-[#C9953A]" style={{ fontSize: 13 }}>
              {prog.toNext.toLocaleString("pt-BR")} faltando
            </span>
          </div>
        </div>
      </Reveal>

      {/* STATS GRID */}
      <Reveal delay={450}>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="XP total" value={<CountUp value={totalXp} />} />
          <StatCard label="Metas batidas" value={<CountUp value={goalsBeaten} />} />
          <StatCard label="Badges" value={<CountUp value={badgeCount} />} />
          <StatCard label="Temporadas" value={<CountUp value={seasonsCount.length} />} />
        </div>
      </Reveal>

      {/* COMISSIONAMENTO CARD (CTA destaque com glow) */}
      <Reveal delay={600}>
        <Link href="/perfil/comissionamento" className="block mt-8 ano-card p-6 group">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="label-caps mb-2 block">Comissionamento</span>
              <p className="text-white text-base font-semibold mb-1">
                Pontos do mês · Tier · Bônus em R$
              </p>
              <p className="text-mid text-sm">
                Veja o que tá no caminho do próximo marco.
              </p>
            </div>
            <span
              className="text-[#C9953A] text-2xl transition-transform group-hover:translate-x-1"
              style={{ transitionTimingFunction: "var(--ease-academia)" }}
            >
              →
            </span>
          </div>
        </Link>
      </Reveal>

      {/* WRAPPED HISTORY */}
      <Reveal delay={750}>
        <section className="mt-10">
          <h2 className="label-caps label-caps-muted mb-3">Suas retrospectivas</h2>
          {snapshots.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center ano-card-flat">
              Nenhuma temporada fechada ainda. A primeira chega no fim do ciclo atual.
            </p>
          ) : (
            <ul className="ano-card-flat overflow-hidden">
              {snapshots.map((s, i) => (
                <li
                  key={s.id}
                  className={
                    "px-5 py-4 flex items-center justify-between" +
                    (i < snapshots.length - 1 ? " border-b" : "")
                  }
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div>
                    <span className="text-white text-sm font-semibold">
                      Temporada {String(s.season.number).padStart(2, "0")}
                    </span>
                    <span className="block text-mid text-xs mt-0.5">
                      {s.season.startsAt.toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <Link
                    href={`/perfil/wrapped/${s.seasonId}`}
                    className="label-caps text-[#C9953A] hover:text-[#E0B25A] transition-colors"
                  >
                    Ver Wrapped →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="ano-card-flat p-5 text-center" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
      <span className="label-caps label-caps-muted block mb-2">{label}</span>
      <span
        className="text-mono text-white"
        style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {value}
      </span>
    </div>
  );
}
