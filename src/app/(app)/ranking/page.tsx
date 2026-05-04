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
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-3xl mx-auto w-full">
      <Reveal>
        <span className="label-caps text-anomalo-gold mb-3 block">Anômalo · Time</span>
        <h1
          className="text-anomalo-white"
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          }}
        >
          O time<br />esta semana.
        </h1>
        <p className="mt-4 text-anomalo-sand text-sm max-w-md">
          Sem pódio. Sem último colocado. Só XP da semana e quem está perto de você.
        </p>
      </Reveal>

      {me && (above || below) && (
        <Reveal delay={250}>
          <section className="mt-10">
            <h2 className="label-caps text-anomalo-sand mb-3">Sua zona</h2>
            <div className="border border-anomalo-gold-hair">
              {above && <RankRow r={above} />}
              {above && <div className="ano-divider-gold" />}
              <RankRow r={me} you />
              {below && <div className="ano-divider-gold" />}
              {below && <RankRow r={below} />}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal delay={400}>
        <section className="mt-10">
          <h2 className="label-caps text-anomalo-sand mb-3">Todo mundo</h2>
          {ranking.length === 0 ? (
            <p className="text-anomalo-muted text-sm py-8 text-center border border-anomalo-gold-hair">
              Nenhum dado de temporada ainda.
            </p>
          ) : (
            <ul className="border border-anomalo-gold-hair">
              {ranking.map((r) => (
                <li key={r.userId} className="border-b border-white/5 last:border-0">
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
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div
        className="w-9 h-9 flex items-center justify-center font-bold text-xs flex-shrink-0"
        style={{
          background: "rgba(201,149,58,0.06)",
          border: `1px solid ${you ? "#C9953A" : "rgba(255,255,255,0.18)"}`,
          color: you ? "#C9953A" : "#FFF",
        }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="font-semibold text-sm flex items-center gap-2"
          style={{ color: you ? "#C9953A" : "#FFF" }}
        >
          {r.name}
          {you && (
            <span
              className="label-caps px-2 py-0.5 border border-anomalo-gold-hair text-[10px]"
              style={{ background: "rgba(201,149,58,0.10)", color: "#E0B25A" }}
            >
              Você
            </span>
          )}
        </div>
        {r.area && (
          <span className="label-caps text-anomalo-sand mt-0.5 block text-[10px]">
            {r.area}
          </span>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-anomalo-white tabular-nums" style={{ fontSize: 16 }}>
          {r.xp.toLocaleString("pt-BR")}
        </div>
        <div className="text-anomalo-gold text-xs font-semibold tabular-nums">
          +{r.delta} sem
        </div>
      </div>
    </div>
  );
}
