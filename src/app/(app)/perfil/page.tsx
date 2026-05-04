import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { XpBar } from "@/components/feature/profile/XpBar";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { xpProgress } from "@/lib/xp";

export default async function PerfilPage() {
  const user = await requireAppUser();
  const [xpTotalAgg, badgeCount, goalsBeaten, seasonsCount, snapshots] = await Promise.all([
    prisma.xpEvent.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
    prisma.userBadge.count({ where: { userId: user.id } }),
    prisma.goal.count({ where: { ownerId: user.id, status: "CONCLUIDA" } }),
    prisma.xpEvent.findMany({
      where: { userId: user.id },
      distinct: ["seasonId"],
      select: { seasonId: true },
    }),
    prisma.wrappedSnapshot.findMany({
      where: { userId: user.id },
      include: { season: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const totalXp = xpTotalAgg._sum.amount ?? 0;
  const prog = xpProgress(totalXp);

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-3xl mx-auto w-full">
      <Reveal>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 flex items-center justify-center text-2xl font-bold border border-anomalo-gold"
              style={{ background: "rgba(201,149,58,0.06)", color: "#C9953A" }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-h3 text-anomalo-white" style={{ letterSpacing: "-0.01em" }}>
                {user.name}
              </h1>
              <span className="label-caps text-anomalo-sand mt-1 block">
                {user.area ?? "Anômalo"} · Nível {prog.level}
              </span>
            </div>
          </div>
          <Link
            href="/perfil/editar"
            className="label-caps text-anomalo-gold border border-anomalo-gold-hair px-3 py-2 hover:bg-anomalo-gold-ghost transition-colors"
          >
            Editar
          </Link>
        </div>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-8">
          <XpBar
            currentXp={totalXp}
            nextLevelXp={prog.next}
            level={prog.level}
            levelFloor={prog.next - prog.levelSize}
          />
        </div>
      </Reveal>

      <Reveal delay={350}>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-anomalo-gold-hair border border-anomalo-gold-hair">
          <Stat label="XP total" value={<CountUp value={totalXp} />} />
          <Stat label="Metas batidas" value={<CountUp value={goalsBeaten} />} />
          <Stat label="Badges" value={<CountUp value={badgeCount} />} />
          <Stat label="Temporadas" value={<CountUp value={seasonsCount.length} />} />
        </div>
      </Reveal>

      <Reveal delay={500}>
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="label-caps text-anomalo-sand">Suas retrospectivas</h2>
          </div>
          {snapshots.length === 0 ? (
            <p className="text-anomalo-muted text-sm py-6 text-center border border-anomalo-gold-hair">
              Nenhuma temporada fechada ainda.
            </p>
          ) : (
            <ul className="border border-anomalo-gold-hair">
              {snapshots.map((s) => (
                <li
                  key={s.id}
                  className="border-b border-white/5 last:border-0 px-4 py-3.5 flex items-center justify-between"
                >
                  <span className="text-anomalo-white text-sm">
                    Temporada {String(s.season.number).padStart(2, "0")}
                  </span>
                  <Link
                    href={`/perfil/wrapped/${s.seasonId}`}
                    className="label-caps text-anomalo-gold hover:underline"
                  >
                    Ver Wrapped →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>

      <Reveal delay={650}>
        <Link
          href="/perfil/comissionamento"
          className="block mt-8 border border-anomalo-gold-hair hover:border-anomalo-gold p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="label-caps text-anomalo-gold mb-1 block">Comissionamento</span>
              <p className="text-anomalo-white text-sm">
                Pontos do mês, tier atual, próximo marco.
              </p>
            </div>
            <span className="text-anomalo-gold text-2xl">→</span>
          </div>
        </Link>
      </Reveal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-anomalo-black p-5 text-center">
      <span className="label-caps text-anomalo-sand block mb-2">{label}</span>
      <span className="font-black text-anomalo-white text-2xl tabular-nums">{value}</span>
    </div>
  );
}
