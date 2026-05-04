// IMPORTANT: this page MUST aggregate without ever exposing user_id
// alongside an answer. We query group-by weekISO and rating, never join to User.

import { prisma } from "@/lib/prisma";

export default async function AdminMoodPage() {
  // aggregate by weekISO + rating only
  const distribution = await prisma.moodEntry.groupBy({
    by: ["weekISO", "rating"],
    _count: { _all: true },
    orderBy: [{ weekISO: "desc" }, { rating: "asc" }],
  });

  // overall average — single number, no user_id involved
  const all = await prisma.moodEntry.findMany({ select: { rating: true } });
  const avg = all.length ? all.reduce((s, m) => s + m.rating, 0) / all.length : 0;

  // anonymous comments — note we explicitly do NOT include `user`
  const comments = await prisma.moodEntry.findMany({
    where: { comment: { not: null } },
    select: { weekISO: true, rating: true, comment: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // group by week for rendering
  const weeks = new Map<string, Record<number, number>>();
  for (const row of distribution) {
    const w = weeks.get(row.weekISO) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    w[row.rating] = row._count._all;
    weeks.set(row.weekISO, w);
  }
  const weekRows = Array.from(weeks.entries()).slice(0, 12);

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-5xl mx-auto w-full">
      <h1 className="text-h2 uppercase text-anomalo-white mb-2">Mood do time.</h1>
      <p className="label-caps text-anomalo-gold mb-8">
        Visualização anônima. user_id não é exposto aqui.
      </p>

      <section className="border border-anomalo-gold-hair p-6 mb-10">
        <span className="label-caps text-anomalo-sand block mb-2">Média geral</span>
        <span className="font-black text-anomalo-gold text-5xl tabular-nums">
          {avg.toFixed(2)}
        </span>
        <span className="label-caps text-anomalo-sand ml-3">de 5</span>
      </section>

      <section className="mb-10">
        <h2 className="label-caps text-anomalo-sand mb-3">Últimas 12 semanas</h2>
        <div className="border border-anomalo-gold-hair">
          {weekRows.length === 0 ? (
            <p className="text-anomalo-muted text-sm py-12 text-center">
              Nenhuma resposta registrada ainda.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-anomalo-gold-hair">
                  <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Semana</th>
                  <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">1</th>
                  <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">2</th>
                  <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">3</th>
                  <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">4</th>
                  <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">5</th>
                </tr>
              </thead>
              <tbody>
                {weekRows.map(([wk, dist]) => (
                  <tr key={wk} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-anomalo-white tabular-nums">{wk}</td>
                    <td className="px-4 py-3 text-right text-anomalo-sand tabular-nums">{dist[1] ?? 0}</td>
                    <td className="px-4 py-3 text-right text-anomalo-sand tabular-nums">{dist[2] ?? 0}</td>
                    <td className="px-4 py-3 text-right text-anomalo-sand tabular-nums">{dist[3] ?? 0}</td>
                    <td className="px-4 py-3 text-right text-anomalo-sand tabular-nums">{dist[4] ?? 0}</td>
                    <td className="px-4 py-3 text-right text-anomalo-gold tabular-nums">{dist[5] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="label-caps text-anomalo-sand mb-3">Comentários anônimos</h2>
        {comments.length === 0 ? (
          <p className="text-anomalo-muted text-sm py-6 text-center border border-anomalo-gold-hair">
            Sem comentários nesse período.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c, i) => (
              <li key={i} className="border border-anomalo-gold-hair p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="label-caps text-anomalo-gold text-[10px]">Nota {c.rating}</span>
                  <span className="label-caps text-anomalo-muted text-[10px]">
                    {c.createdAt.toLocaleDateString("pt-BR")} · {c.weekISO}
                  </span>
                </div>
                <p className="text-anomalo-white text-sm leading-relaxed">{c.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
