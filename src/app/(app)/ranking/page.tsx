import { Reveal } from "@/components/motion/Reveal";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[ranking] ${label} failed:`, err);
    return fallback;
  }
}

const KIND_LABEL: Record<string, { tag: string; color: string }> = {
  goal_done:      { tag: "Meta",     color: "#C9953A" },
  badge_unlocked: { tag: "Badge",    color: "#FFFFFF" },
  level_up:       { tag: "Nível",    color: "#C9953A" },
  delivery:       { tag: "Entrega",  color: "#E0B25A" },
  shop_redeem:    { tag: "Loja",     color: "#8A7850" },
};

export default async function RankingPage() {
  const user = await requireAppUser();

  const season = await safe(
    "season.findFirst",
    () => prisma.season.findFirst({ where: { isActive: true } }),
    null,
  );

  // Período "hoje" pra contar entregas do dia por colaborador
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  let ranking: Array<{
    userId: string;
    name: string;
    area: string | null;
    avatarUrl: string | null;
    xp: number;
    delta: number;
    todayCount: number;
    you: boolean;
  }> = [];

  // ADMINs não competem nem aparecem no Time. Sempre lista todos colaboradores
  // (mesmo zerados) pra ninguém sumir do mural até começar a registrar.
  const collaboratorUsers = await safe(
    "user.findMany collaborators",
    () =>
      prisma.user.findMany({
        where: { role: "COLABORADOR" },
        select: { id: true, name: true, area: true, avatarUrl: true },
        orderBy: { name: "asc" },
      }),
    [] as Array<{ id: string; name: string; area: string | null; avatarUrl: string | null }>,
  );
  const collaboratorIds = collaboratorUsers.map((u) => u.id);

  if (season && collaboratorIds.length > 0) {
    const totals = await safe(
      "xpEvent.groupBy totals",
      async () => {
        const rows = await prisma.xpEvent.groupBy({
          by: ["userId"],
          where: { seasonId: season.id, userId: { in: collaboratorIds } },
          _sum: { amount: true },
        });
        return rows.map((r) => ({ userId: r.userId, sum: r._sum.amount ?? 0 }));
      },
      [] as { userId: string; sum: number }[],
    );
    const totalsMap = new Map(totals.map((t) => [t.userId, t.sum]));

    const since = new Date(Date.now() - 7 * 86400000);
    const weekly = await safe(
      "xpEvent.groupBy weekly",
      async () => {
        const rows = await prisma.xpEvent.groupBy({
          by: ["userId"],
          where: {
            seasonId: season.id,
            createdAt: { gte: since },
            userId: { in: collaboratorIds },
          },
          _sum: { amount: true },
        });
        return rows.map((r) => ({ userId: r.userId, sum: r._sum.amount ?? 0 }));
      },
      [] as { userId: string; sum: number }[],
    );
    const weeklyMap = new Map(weekly.map((w) => [w.userId, w.sum]));

    // Entregas registradas hoje (count por usuário)
    const todayDeliveries = await safe(
      "delivery.groupBy today",
      async () => {
        const rows = await prisma.delivery.groupBy({
          by: ["userId"],
          where: {
            deliveredAt: { gte: dayStart },
            userId: { in: collaboratorIds },
          },
          _sum: { count: true },
        });
        return rows.map((r) => ({ userId: r.userId, n: r._sum.count ?? 0 }));
      },
      [] as { userId: string; n: number }[],
    );
    const todayMap = new Map(todayDeliveries.map((t) => [t.userId, t.n]));

    ranking = collaboratorUsers
      .map((u) => ({
        userId: u.id,
        name: u.name,
        area: u.area,
        avatarUrl: u.avatarUrl,
        xp: totalsMap.get(u.id) ?? 0,
        delta: weeklyMap.get(u.id) ?? 0,
        todayCount: todayMap.get(u.id) ?? 0,
        you: u.id === user.id,
      }))
      .sort((a, b) => b.xp - a.xp);
  } else {
    // Sem temporada ativa, ainda assim mostra os colaboradores zerados.
    ranking = collaboratorUsers.map((u) => ({
      userId: u.id,
      name: u.name,
      area: u.area,
      avatarUrl: u.avatarUrl,
      xp: 0,
      delta: 0,
      todayCount: 0,
      you: u.id === user.id,
    }));
  }

  type MuralEventWithUser = Awaited<
    ReturnType<typeof prisma.muralEvent.findMany<{
      include: { user: { select: { name: true; avatarUrl: true } } };
    }>>
  >;
  const events = await safe<MuralEventWithUser>(
    "muralEvent.findMany",
    () =>
      prisma.muralEvent.findMany({
        where: { user: { role: "COLABORADOR" } },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { name: true, avatarUrl: true } } },
      }),
    [],
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto w-full">
      <Reveal>
        <span className="label-caps mb-3 block">Game Anômalo · Time</span>
        <h1
          className="display-bold text-white"
          style={{ fontSize: "clamp(2.75rem, 9vw, 4.5rem)", lineHeight: 0.96 }}
        >
          O time<br />
          <span className="display-italic text-[#C9953A]">em movimento.</span>
        </h1>
        <p className="mt-4 text-mid text-sm max-w-md">
          Entregas de hoje, XP acumulado da temporada e atividade recente. Sem pódio,
          sem último colocado.
        </p>
      </Reveal>

      <Reveal delay={400}>
        <section className="mt-10">
          <h2 className="label-caps label-caps-muted mb-3">Time</h2>
          {ranking.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center ano-card-flat">
              Nenhum dado de temporada ainda.
            </p>
          ) : (
            <ul className="ano-card-flat overflow-hidden">
              {ranking.map((r, i) => (
                <li
                  key={r.userId}
                  style={{
                    borderBottom:
                      i < ranking.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <RankRow r={r} you={r.you} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>

      <Reveal delay={600}>
        <section className="mt-10">
          <h2 className="label-caps label-caps-muted mb-3">Atividade recente</h2>
          {events.length === 0 ? (
            <p className="text-faint text-sm py-10 text-center ano-card-flat">
              Nada no mural ainda. Vai ter logo.
            </p>
          ) : (
            <div className="ano-card-flat overflow-hidden">
              {events.map((ev, i) => {
                const meta = KIND_LABEL[ev.type] ?? { tag: "—", color: "#FFFFFF" };
                const payload = ev.payload as { text?: string; emoji?: string } | null;
                const initials = (ev.user.name ?? "—")
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={ev.id}
                    className="px-5 py-4 flex items-start gap-3"
                    style={{
                      borderBottom:
                        i < events.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <div
                      className="w-9 h-9 flex items-center justify-center font-bold text-xs flex-shrink-0 rounded-full overflow-hidden"
                      style={{
                        background: "rgba(201,149,58,0.06)",
                        boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.32)",
                        color: "#C9953A",
                      }}
                    >
                      {ev.user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ev.user.avatarUrl}
                          alt={ev.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1 gap-2">
                        <span className="label-caps" style={{ color: meta.color }}>
                          {meta.tag}
                        </span>
                        <span className="label-caps label-caps-muted text-[10px] text-mono">
                          {formatDistanceToNowStrict(ev.createdAt, { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-white/85 leading-relaxed">
                        <span className="font-bold text-white">{ev.user.name}</span>{" "}
                        {payload?.text ?? "—"} {payload?.emoji ?? ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}

interface RankItem {
  name: string;
  area: string | null;
  avatarUrl: string | null;
  xp: number;
  delta: number;
  todayCount: number;
}

function RankRow({ r, you }: { r: RankItem; you?: boolean }) {
  const initials = r.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div
        className="w-10 h-10 flex items-center justify-center font-bold text-xs flex-shrink-0 rounded-full overflow-hidden"
        style={{
          background: you ? "rgba(201,149,58,0.10)" : "rgba(255,255,255,0.04)",
          boxShadow: you
            ? "inset 0 0 0 1px #C9953A, 0 0 12px rgba(201,149,58,0.25)"
            : "inset 0 0 0 1px rgba(255,255,255,0.10)",
          color: you ? "#C9953A" : "#FFFFFF",
        }}
      >
        {r.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.avatarUrl} alt={r.name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm"
            style={{
              color: you ? "#C9953A" : "#FFFFFF",
              fontStyle: you ? "italic" : "normal",
              fontWeight: you ? 400 : 600,
              fontSize: you ? 16 : 14,
            }}
          >
            {r.name}
          </span>
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
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {r.area && (
            <span className="label-caps label-caps-muted text-[10px]">{r.area}</span>
          )}
          <span
            className="label-caps text-[10px]"
            style={{
              color: r.todayCount > 0 ? "#C9953A" : "#5A4A2A",
            }}
          >
            {r.todayCount > 0
              ? `${r.todayCount} entrega${r.todayCount > 1 ? "s" : ""} hoje`
              : "Sem entrega hoje"}
          </span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-mono text-white tabular-nums" style={{ fontSize: 17, fontWeight: 700 }}>
          {r.xp.toLocaleString("pt-BR")}
        </div>
        <div className="text-mono text-[#C9953A] text-[11px] tabular-nums">
          +{r.delta} sem
        </div>
      </div>
    </div>
  );
}
