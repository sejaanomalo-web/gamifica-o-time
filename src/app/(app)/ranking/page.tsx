import { Reveal } from "@/components/motion/Reveal";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RankingPage() {
  const user = await requireAppUser();

  const season = await prisma.season.findFirst({ where: { isActive: true } });
  let ranking: Array<{
    userId: string;
    name: string;
    area: string | null;
    xp: number;
    delta: number;
    you: boolean;
  }> = [];
  if (season) {
    const totals = await prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { seasonId: season.id },
      _sum: { amount: true },
    });
    const since = new Date(Date.now() - 7 * 86400000);
    const weekly = await prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { seasonId: season.id, createdAt: { gte: since } },
      _sum: { amount: true },
    });
    const weeklyMap = new Map(weekly.map((w) => [w.userId, w._sum.amount ?? 0]));
    const userIds = totals.map((t) => t.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, area: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    ranking = totals
      .map((t) => ({
        userId: t.userId,
        name: userMap.get(t.userId)?.name ?? "—",
        area: userMap.get(t.userId)?.area ?? null,
        xp: t._sum.amount ?? 0,
        delta: weeklyMap.get(t.userId) ?? 0,
        you: t.userId === user.id,
      }))
      .sort((a, b) => b.xp - a.xp);
  }

  const myIdx = ranking.findIndex((r) => r.you);
  const above = myIdx > 0 ? ranking[myIdx - 1] : null;
  const me = myIdx >= 0 ? ranking[myIdx] : null;
  const below = myIdx >= 0 && myIdx < ranking.length - 1 ? ranking[myIdx + 1] : null;

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      <Reveal>
        <span className="label-caps mb-3 block">Anômalo · Time</span>
        <h1
          className="display-bold text-white"
          style={{ fontSize: "clamp(2.75rem, 9vw, 4.5rem)", lineHeight: 0.96 }}
        >
          O time<br />
          <span className="display-italic text-[#C9953A]">esta semana.</span>
        </h1>
        <p className="mt-4 text-mid text-sm max-w-md">
          Sem pódio. Sem último colocado. Só XP da semana e quem está perto de você.
        </p>
      </Reveal>

      {me && (above || below) && (
        <Reveal delay={250}>
          <section className="mt-10">
            <h2 className="label-caps label-caps-muted mb-3">Sua zona</h2>
            <div className="ano-card-flat overflow-hidden">
              {above && <RankRow r={above} />}
              {above && <div className="ano-divider mx-5" />}
              <RankRow r={me} you />
              {below && <div className="ano-divider mx-5" />}
              {below && <RankRow r={below} />}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={400}>
        <section className="mt-10">
          <h2 className="label-caps label-caps-muted mb-3">Todo mundo</h2>
          {ranking.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center ano-card-flat">
              Nenhum dado de temporada ainda.
            </p>
          ) : (
            <ul className="ano-card-flat overflow-hidden">
              {ranking.map((r, i) => (
                <li
                  key={r.userId}
                  className={i < ranking.length - 1 ? "border-b" : ""}
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <RankRow r={r} you={r.you} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>
    </div>
  );
}

function RankRow({
  r,
  you,
}: {
  r: { name: string; area: string | null; xp: number; delta: number };
  you?: boolean;
}) {
  const initials = r.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div
        className="w-9 h-9 flex items-center justify-center font-bold text-xs flex-shrink-0 rounded-full"
        style={{
          background: you ? "rgba(201,149,58,0.10)" : "rgba(255,255,255,0.04)",
          boxShadow: you
            ? "inset 0 0 0 1px #C9953A, 0 0 12px rgba(201,149,58,0.25)"
            : "inset 0 0 0 1px rgba(255,255,255,0.10)",
          color: you ? "#C9953A" : "#edebe6",
        }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-sm flex items-center gap-2"
          style={{
            color: you ? "#C9953A" : "#edebe6",
            fontFamily: you ? "var(--font-inter)" : "var(--font-inter-tight)",
            fontStyle: you ? "italic" : "normal",
            fontSize: you ? 16 : 14,
            fontWeight: you ? 400 : 600,
          }}
        >
          {r.name}
          {you && (
            <span
              className="label-caps px-2.5 py-0.5 rounded-full text-[9px]"
              style={{
                background: "rgba(201,149,58,0.12)",
                color: "#E0B25A",
                boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.35)",
              }}
            >
              Você
            </span>
          )}
        </div>
        {r.area && (
          <span className="label-caps label-caps-muted mt-0.5 block text-[10px]">
            {r.area}
          </span>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-mono text-white tabular-nums" style={{ fontSize: 16, fontWeight: 500 }}>
          {r.xp.toLocaleString("pt-BR")}
        </div>
        <div className="text-mono text-[#C9953A] text-xs tabular-nums">
          +{r.delta} sem
        </div>
      </div>
    </div>
  );
}
