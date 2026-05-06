import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/metas] ${label} failed:`, err);
    return fallback;
  }
}

export default async function AdminMetasPage() {
  type GoalWithOwner = Awaited<
    ReturnType<typeof prisma.goal.findMany<{ include: { owner: { select: { name: true; email: true } } } }>>
  >;
  const goals = await safe<GoalWithOwner>(
    "goal.findMany",
    () =>
      prisma.goal.findMany({
        include: { owner: { select: { name: true, email: true } } },
        orderBy: { deadline: "asc" },
        take: 100,
      }),
    [],
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-6xl mx-auto w-full">
      <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
        <div>
          <span className="label-caps mb-3 block">Admin · Catálogo</span>
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
            Metas<br />
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
        </div>
        <button className="btn-pill btn-gold">
          <Plus size={14} />
          Nova meta
        </button>
      </div>

      <div className="ano-card-flat overflow-hidden">
        {goals.length === 0 ? (
          <p className="text-faint text-sm py-12 text-center">
            Nenhuma meta cadastrada ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Título</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Atribuída</th>
                <th className="text-left px-5 py-3 label-caps label-caps-muted">Status</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">Prazo</th>
                <th className="text-right px-5 py-3 label-caps label-caps-muted">XP</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g, i) => (
                <tr
                  key={g.id}
                  style={{
                    borderBottom: i < goals.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <td className="px-5 py-3 text-white">{g.title}</td>
                  <td className="px-5 py-3 text-mid">{g.owner.name}</td>
                  <td className="px-5 py-3 label-caps text-[10px]">{g.status}</td>
                  <td className="px-5 py-3 text-right text-mid text-mono">
                    {g.deadline.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3 text-right text-[#C9953A] text-mono font-bold">
                    +{g.xpReward}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-6 text-faint text-xs">
        Em breve: dialog de criar/editar meta com KPI, target, atribuição e validação.
      </p>
    </div>
  );
}
