import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { PulsingLambda } from "@/components/motion/PulsingLambda";
import { GoalCard } from "@/components/feature/goal/GoalCard";
import { XpBar } from "@/components/feature/profile/XpBar";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xpProgress } from "@/lib/xp";

function greetByHour() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[dashboard] ${label} failed:`, err);
    return fallback;
  }
}

export default async function DashboardPage() {
  const user = await requireAppUser();

  const season = await safe(
    "season.findFirst",
    () => prisma.season.findFirst({ where: { isActive: true } }),
    null,
  );

  const xpAgg = season
    ? await safe(
        "xpEvent.aggregate",
        () =>
          prisma.xpEvent.aggregate({
            where: { userId: user.id, seasonId: season.id },
            _sum: { amount: true },
          }),
        { _sum: { amount: 0 } },
      )
    : { _sum: { amount: 0 } };
  const xp = xpAgg._sum.amount ?? 0;
  const prog = xpProgress(xp);

  const metaMes = await safe(
    "goal.findFirst",
    () =>
      prisma.goal.findFirst({
        where: { ownerId: user.id, status: "ATIVA" },
        orderBy: { deadline: "asc" },
      }),
    null,
  );

  const recent = await safe(
    "muralEvent.findMany",
    () =>
      prisma.muralEvent.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    [] as Awaited<ReturnType<typeof prisma.muralEvent.findMany>>,
  );

  const ranking: Array<{ userId: string }> = season
    ? await safe<Array<{ userId: string }>>(
        "xpEvent.groupBy",
        async () => {
          const rows = await prisma.xpEvent.groupBy({
            by: ["userId"],
            where: { seasonId: season.id },
            _sum: { amount: true },
            orderBy: { _sum: { amount: "desc" } },
          });
          return rows.map((r) => ({ userId: r.userId }));
        },
        [],
      )
    : [];
  const myPos = ranking.findIndex((r) => r.userId === user.id) + 1;

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
      {/* HERO */}
      <Reveal>
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1">
            <span className="label-caps mb-3 block">
              {greetByHour()}, {user.name.split(" ")[0]}.
            </span>
            <h1
              className="display-bold text-white"
              style={{ fontSize: "clamp(2.75rem, 9vw, 4.5rem)", lineHeight: 0.96 }}
            >
              Hoje<br />
              <span className="display-italic text-[#C9953A]">continua.</span>
            </h1>
          </div>
          <PulsingLambda size={48} />
        </div>
      </Reveal>

      {/* XP / LEVEL */}
      <Reveal delay={200}>
        <div className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="label-caps label-caps-muted mb-2 block">XP da temporada</span>
              <div
                className="text-mono text-white"
                style={{ fontSize: "clamp(2.5rem, 7vw, 3.75rem)", lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 500 }}
              >
                <CountUp value={xp} duration={1.7} />
              </div>
            </div>
            <div className="text-right">
              <span className="label-caps label-caps-muted mb-2 block">Próx · {prog.toNext}</span>
              <p className="text-mid text-sm">até nível {prog.level + 1}</p>
            </div>
          </div>
          <div className="mt-4">
            <XpBar
              currentXp={xp}
              nextLevelXp={prog.next}
              level={prog.level}
              levelFloor={prog.next - prog.levelSize}
            />
          </div>
        </div>
      </Reveal>

      {/* META DO MÊS */}
      {metaMes && (
        <Reveal delay={400}>
          <div className="mt-12">
            <span className="label-caps label-caps-muted mb-3 block">Sua meta do mês</span>
            <GoalCard
              primary
              goal={{
                id: metaMes.id,
                title: metaMes.title,
                area: metaMes.kpi,
                progress: metaMes.current,
                target: metaMes.target,
                daysLeft: Math.max(
                  0,
                  Math.ceil((metaMes.deadline.getTime() - Date.now()) / 86400000),
                ),
                xpReward: metaMes.xpReward,
                status: metaMes.status,
              }}
            />
          </div>
        </Reveal>
      )}

      {/* STATS GRID */}
      <Reveal delay={600}>
        <div className="mt-12 grid grid-cols-3 gap-3">
          <div className="ano-card p-5 text-center">
            <span className="label-caps label-caps-muted block mb-2">Nível</span>
            <span className="text-mono text-white text-3xl">
              <CountUp value={prog.level} duration={0.9} />
            </span>
          </div>
          <div className="ano-card p-5 text-center">
            <span className="label-caps label-caps-muted block mb-2">Posição</span>
            <span className="text-mono text-white text-3xl">
              {myPos > 0 ? <>#<CountUp value={myPos} duration={0.9} /></> : "—"}
            </span>
          </div>
          <Link href="/badges" className="ano-card p-5 text-center hover:bg-[#1a1a1f] transition-colors">
            <span className="label-caps label-caps-muted block mb-2">Badges</span>
            <span className="text-mono text-white text-3xl">
              <CountUp value={0} duration={1.2} />
            </span>
          </Link>
        </div>
      </Reveal>

      {/* RECENT FEED */}
      <Reveal delay={800}>
        <div className="mt-12">
          <div className="flex items-baseline justify-between mb-4">
            <span className="label-caps label-caps-muted">Suas últimas ações</span>
            <Link
              href="/mural"
              className="label-caps text-[#C9953A] hover:text-[#E0B25A] transition-colors"
            >
              Ver mural →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-faint text-sm py-8 text-center ano-card-flat">
              Nenhuma ação ainda. Bata sua primeira meta pra começar.
            </p>
          ) : (
            <ul className="ano-card-flat overflow-hidden">
              {recent.map((ev) => (
                <li
                  key={ev.id}
                  className="px-5 py-4 text-sm border-b last:border-0"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <span className="text-white">
                    {(ev.payload as { text?: string })?.text ?? ev.type}
                  </span>
                  <span className="text-faint ml-2 text-xs">
                    {new Date(ev.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
