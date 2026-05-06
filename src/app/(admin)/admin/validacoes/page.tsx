import { prisma } from "@/lib/prisma";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/validacoes] ${label} failed:`, err);
    return fallback;
  }
}

export default async function ValidacoesPage() {
  type EvidencePending = Awaited<
    ReturnType<typeof prisma.evidence.findMany<{
      include: { goal: { select: { title: true } }; user: { select: { name: true } } };
    }>>
  >;
  const pending = await safe<EvidencePending>(
    "evidence.findMany",
    () =>
      prisma.evidence.findMany({
        where: { approved: null },
        include: {
          goal: { select: { title: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    [],
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-4xl mx-auto w-full">
      <span className="label-caps mb-3 block">Admin · Fila</span>
      <h1
        className="text-white mb-10"
        style={{
          fontWeight: 900,
          fontSize: "clamp(2.25rem, 6vw, 2.75rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        Validações<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          pendentes.
        </span>
      </h1>

      {pending.length === 0 ? (
        <p className="text-faint text-sm py-12 text-center ano-card-flat">
          Nada pra validar agora. Time em dia.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((ev) => (
            <li
              key={ev.id}
              className="ano-card p-6 flex items-center justify-between gap-4 flex-wrap"
            >
              <div>
                <p className="text-white font-semibold">{ev.goal.title}</p>
                <span className="label-caps label-caps-muted text-[10px] mt-1 block">
                  {ev.user.name} · {ev.createdAt.toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-pill btn-gold"
                  style={{ height: 38, fontSize: 11, padding: "0 18px" }}
                >
                  Aprovar
                </button>
                <button
                  className="btn-pill btn-ghost"
                  style={{ height: 38, fontSize: 11, padding: "0 18px" }}
                >
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
