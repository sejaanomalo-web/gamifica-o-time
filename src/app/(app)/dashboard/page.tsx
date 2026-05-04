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

export default async function DashboardPage() {
  const user = await requireAppUser();

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  const xpAgg = season
    ? await prisma.xpEvent.aggregate({
        where: { userId: user.id, seasonId: season.id },
        _sum: { amount: true },
      })
    : { _sum: { amount: 0 } };
  const xp = xpAgg._sum.amount ?? 0;
  const prog = xpProgress(xp);

  const metaMes = await prisma.goal.findFirst({
    where: { ownerId: user.id, status: "ATIVA" },
    orderBy: { deadline: "asc" },
  });

  const recent = await prisma.muralEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const ranking = season
    ? await prisma.xpEvent.groupBy({
        by: ["userId"],
        where: { seasonId: season.id },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      })
    : [];
  const myPos = ranking.findIndex((r) => r.userId === user.id) + 1;

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-5xl mx-auto w-full">
      {/* HERO */}
      <Reveal>
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1">
            <span className="label-caps text-anomalo-gold mb-3 block">
              {greetByHour()}, {user.name.split(" ")[0]}.
            </span>
            <h1
              className="text-anomalo-white"
              style={{
                fontWeight: 900,
                fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
              }}
            >
              Hoje<br />
              <span className="text-respiro" style={{ textTransform: "lowercase" }}>
                continua.
              </span>
            </h1>
          </div>
          <PulsingLambda size={48} />
        </div>
      </Reveal>

      {/* XP / LEVEL */}
      <Reveal delay={200}>
        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="label-caps text-anomalo-sand mb-2 block">XP da temporada</span>
              <div
                className="font-black text-anomalo-white tabular-nums"
                style={{ fontSize: "clamp(2.25rem, 7vw, 3.5rem)", lineHeight: 1, letterSpacing: "-0.02em" }}
              >
                <CountUp value={xp} duration={1.7} />
              </div>
            </div>
            <div className="text-right">
              <span className="label-caps text-anomalo-sand mb-2 block">Próx · {prog.toNext}</span>
              <p className="text-anomalo-sand text-sm">até nível {prog.level + 1}</p>
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
          <div className="mt-10">
            <span className="label-caps text-anomalo-sand mb-3 block">Sua meta do mês</span>
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
        <div className="mt-10 grid grid-cols-3 gap-px bg-anomalo-gold-hair border border-anomalo-gold-hair">
          <div className="bg-anomalo-black p-5 text-center">
            <span className="label-caps text-anomalo-sand block mb-2">Nível</span>
            <span className="font-black text-anomalo-white text-3xl tabular-nums">
              <CountUp value={prog.level} duration={0.9} />
            </span>
          </div>
          <div className="bg-anomalo-black p-5 text-center">
            <span className="label-caps text-anomalo-sand block mb-2">Posição</span>
            <span className="font-black text-anomalo-white text-3xl tabular-nums">
              {myPos > 0 ? <>#<CountUp value={myPos} duration={0.9} /></> : "—"}
            </span>
          </div>
          <Link
            href="/badges"
            className="bg-anomalo-black p-5 text-center hover:bg-anomalo-surface transition-colors"
          >
            <span className="label-caps text-anomalo-sand block mb-2">Badges</span>
            <span className="font-black text-anomalo-white text-3xl tabular-nums">
              <CountUp value={user ? 0 : 0} duration={1.2} />
            </span>
          </Link>
        </div>
      </Reveal>

      {/* RECENT FEED */}
      <Reveal delay={800}>
        <div className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <span className="label-caps text-anomalo-sand">Suas últimas ações</span>
            <Link
              href="/mural"
              className="label-caps text-anomalo-gold hover:underline"
            >
              Ver mural →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-anomalo-muted text-sm py-6 text-center border border-anomalo-gold-hair">
              Nenhuma ação ainda. Bata sua primeira meta pra começar.
            </p>
          ) : (
            <ul className="border border-anomalo-gold-hair">
              {recent.map((ev) => (
                <li key={ev.id} className="border-b border-anomalo-gold-hair last:border-0 px-4 py-3 text-sm">
                  <span className="text-anomalo-white">{(ev.payload as { text?: string })?.text ?? ev.type}</span>
                  <span className="text-anomalo-muted ml-2 text-xs">
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
