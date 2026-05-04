import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { GoalProgress } from "@/components/feature/goal/GoalProgress";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAppUser();
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: { evidences: { orderBy: { createdAt: "desc" } } },
  });
  if (!goal || goal.ownerId !== user.id) notFound();

  const pct = Math.min(100, (goal.current / Math.max(1, goal.target)) * 100);
  const daysLeft = Math.max(
    0,
    Math.ceil((goal.deadline.getTime() - Date.now()) / 86400000),
  );

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-3xl mx-auto w-full">
      <Reveal>
        <Link href="/metas" className="label-caps text-anomalo-sand hover:text-anomalo-gold">
          ← Metas
        </Link>
      </Reveal>
      <Reveal delay={150}>
        <div className="mt-6 flex items-start justify-between gap-6">
          <div className="flex-1">
            <span className="label-caps text-anomalo-sand mb-2 block">{goal.kpi}</span>
            <h1 className="text-h2 uppercase text-anomalo-white" style={{ letterSpacing: "-0.01em" }}>
              {goal.title}
            </h1>
            {goal.description && (
              <p className="mt-3 text-anomalo-sand text-sm leading-relaxed">{goal.description}</p>
            )}
          </div>
          <GoalProgress percentage={pct} size="lg" />
        </div>
      </Reveal>

      <Reveal delay={300}>
        <div className="mt-8 grid grid-cols-3 gap-px bg-anomalo-gold-hair border border-anomalo-gold-hair">
          <div className="bg-anomalo-black p-4 text-center">
            <span className="label-caps text-anomalo-sand block mb-1">Progresso</span>
            <span className="text-anomalo-white tabular-nums font-bold">
              {goal.current}/{goal.target}
            </span>
          </div>
          <div className="bg-anomalo-black p-4 text-center">
            <span className="label-caps text-anomalo-sand block mb-1">Prazo</span>
            <span className="text-anomalo-white tabular-nums font-bold">{daysLeft}d</span>
          </div>
          <div className="bg-anomalo-black p-4 text-center">
            <span className="label-caps text-anomalo-sand block mb-1">XP</span>
            <span className="text-anomalo-gold tabular-nums font-bold">+{goal.xpReward}</span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={420}>
        <section className="mt-10">
          <h2 className="label-caps text-anomalo-sand mb-4">Evidências</h2>
          {goal.needsEvidence ? (
            <p className="text-sm text-anomalo-muted">
              Esta meta exige evidência. Em breve: upload de arquivo aqui.
            </p>
          ) : (
            <p className="text-sm text-anomalo-muted">Esta meta não exige evidência.</p>
          )}
          {goal.evidences.length > 0 && (
            <ul className="mt-4 space-y-2">
              {goal.evidences.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-center justify-between border border-anomalo-gold-hair px-4 py-3 text-sm"
                >
                  <span>{new Date(ev.createdAt).toLocaleDateString("pt-BR")}</span>
                  <span className="label-caps">
                    {ev.approved === null
                      ? "Aguardando validação."
                      : ev.approved
                        ? "Validado."
                        : "Rejeitado."}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>
    </div>
  );
}
