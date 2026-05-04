import { prisma } from "@/lib/prisma";

export default async function ValidacoesPage() {
  const pending = await prisma.evidence.findMany({
    where: { approved: null },
    include: {
      goal: { select: { title: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-4xl mx-auto w-full">
      <h1 className="text-h2 uppercase text-anomalo-white mb-8">Validações pendentes.</h1>

      {pending.length === 0 ? (
        <p className="text-anomalo-muted text-sm py-12 text-center border border-anomalo-gold-hair">
          Nada pra validar agora.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((ev) => (
            <li
              key={ev.id}
              className="border border-anomalo-gold-hair p-5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-anomalo-white font-bold">{ev.goal.title}</p>
                <span className="label-caps text-anomalo-sand text-[10px]">
                  {ev.user.name} · {ev.createdAt.toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="label-caps px-4 py-2.5" style={{ background: "#C9953A", color: "#000" }}>
                  Aprovar
                </button>
                <button className="label-caps px-4 py-2.5 border border-anomalo-gold-hair text-anomalo-sand">
                  Rejeitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
