// IMPORTANT: this page MUST aggregate without ever exposing user_id
// alongside an answer. We query group-by weekISO and rating, never join to User.

import { prisma } from "@/lib/prisma";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/mood] ${label} failed:`, err);
    return fallback;
  }
}

export default async function AdminMoodPage() {
  type DistRow = { weekISO: string; rating: number; _count: { _all: number } };
  const distribution = await safe<DistRow[]>(
    "moodEntry.groupBy",
    async () => {
      const rows = await prisma.moodEntry.groupBy({
        by: ["weekISO", "rating"],
        _count: { _all: true },
        orderBy: [{ weekISO: "desc" }, { rating: "asc" }],
      });
      return rows.map((r) => ({
        weekISO: r.weekISO,
        rating: r.rating,
        _count: { _all: r._count._all },
      }));
    },
    [],
  );

  const all = await safe(
    "moodEntry.findMany",
    () => prisma.moodEntry.findMany({ select: { rating: true } }),
    [] as Awaited<ReturnType<typeof prisma.moodEntry.findMany>>,
  );
  const avg = all.length ? all.reduce((s, m) => s + m.rating, 0) / all.length : 0;

  const comments = await safe(
    "moodEntry.findMany comments",
    () =>
      prisma.moodEntry.findMany({
        where: { comment: { not: null } },
        select: { weekISO: true, rating: true, comment: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    [] as Awaited<ReturnType<typeof prisma.moodEntry.findMany>>,
  );

  const weeks = new Map<string, Record<number, number>>();
  for (const row of distribution) {
    const w = weeks.get(row.weekISO) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    w[row.rating] = row._count._all;
    weeks.set(row.weekISO, w);
  }
  const weekRows = Array.from(weeks.entries()).slice(0, 12);

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">
      <span className="label-caps mb-3 block">Admin · Cultura</span>
      <h1
        className="text-white"
        style={{
          fontWeight: 900,
          fontSize: "clamp(2.25rem, 6vw, 2.75rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        Mood<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          do time.
        </span>
      </h1>
      <p
        className="label-caps mt-4 inline-block px-3 py-1.5 rounded-full"
        style={{
          background: "rgba(201,149,58,0.08)",
          boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.32)",
        }}
      >
        Visualização anônima. user_id não é exposto aqui.
      </p>

      <section className="ano-card p-7 mt-10">
        <span className="label-caps label-caps-muted block mb-3">Média geral</span>
        <span
          className="text-mono text-[#C9953A]"
          style={{ fontSize: 56, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}
        >
          {avg.toFixed(2)}
        </span>
        <span className="label-caps label-caps-muted ml-3">de 5</span>
      </section>

      <section className="mt-8">
        <h2 className="label-caps label-caps-muted mb-3">Últimas 12 semanas</h2>
        <div className="ano-card-flat overflow-hidden">
          {weekRows.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center">
              Nenhuma resposta registrada ainda.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left px-5 py-3 label-caps label-caps-muted">Semana</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">1</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">2</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">3</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">4</th>
                  <th className="text-right px-5 py-3 label-caps label-caps-muted">5</th>
                </tr>
              </thead>
              <tbody>
                {weekRows.map(([wk, dist], i) => (
                  <tr
                    key={wk}
                    style={{
                      borderBottom: i < weekRows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <td className="px-5 py-3 text-white text-mono">{wk}</td>
                    <td className="px-5 py-3 text-right text-mid text-mono">{dist[1] ?? 0}</td>
                    <td className="px-5 py-3 text-right text-mid text-mono">{dist[2] ?? 0}</td>
                    <td className="px-5 py-3 text-right text-mid text-mono">{dist[3] ?? 0}</td>
                    <td className="px-5 py-3 text-right text-mid text-mono">{dist[4] ?? 0}</td>
                    <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
                      {dist[5] ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="label-caps label-caps-muted mb-3">Comentários anônimos</h2>
        {comments.length === 0 ? (
          <p className="text-faint text-sm py-10 text-center ano-card-flat">
            Sem comentários nesse período.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c, i) => (
              <li key={i} className="ano-card-flat p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="label-caps px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(201,149,58,0.10)",
                      boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.32)",
                    }}
                  >
                    Nota {c.rating}
                  </span>
                  <span className="label-caps label-caps-muted text-[10px] text-mono">
                    {c.createdAt.toLocaleDateString("pt-BR")} · {c.weekISO}
                  </span>
                </div>
                <p className="text-white text-sm leading-relaxed">{c.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
