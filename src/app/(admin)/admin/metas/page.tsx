import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminMetasPage() {
  const goals = await prisma.goal.findMany({
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { deadline: "asc" },
    take: 100,
  });

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h2 uppercase text-anomalo-white">Metas.</h1>
        <button
          className="flex items-center gap-2 label-caps px-4 py-2.5"
          style={{ background: "#c9b298", color: "#000" }}
        >
          <Plus size={14} />
          Nova meta
        </button>
      </div>

      <div className="border border-anomalo-gold-hair">
        {goals.length === 0 ? (
          <p className="text-anomalo-muted text-sm py-12 text-center">
            Nenhuma meta cadastrada ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-anomalo-gold-hair">
                <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Título</th>
                <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Atribuída</th>
                <th className="text-left px-4 py-3 label-caps text-anomalo-sand text-[10px]">Status</th>
                <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">Prazo</th>
                <th className="text-right px-4 py-3 label-caps text-anomalo-sand text-[10px]">XP</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => (
                <tr key={g.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-anomalo-white">{g.title}</td>
                  <td className="px-4 py-3 text-anomalo-sand">{g.owner.name}</td>
                  <td className="px-4 py-3 label-caps text-anomalo-gold text-[10px]">{g.status}</td>
                  <td className="px-4 py-3 text-right text-anomalo-sand tabular-nums">
                    {g.deadline.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right text-anomalo-gold tabular-nums">+{g.xpReward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-6 text-anomalo-muted text-xs">
        Em breve: dialog de criar/editar meta com KPI, target, atribuição e validação.
      </p>
    </div>
  );
}
