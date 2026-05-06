import { Reveal } from "@/components/motion/Reveal";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

export default async function BadgesPage() {
  const user = await requireAppUser();
  const all = await prisma.badge.findMany({ orderBy: { name: "asc" } });
  const unlocked = await prisma.userBadge.findMany({
    where: { userId: user.id },
    include: { badge: true },
  });
  const unlockedSet = new Set(unlocked.map((u) => u.badgeId));

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-4xl mx-auto w-full">
      <Reveal>
        <span className="label-caps text-anomalo-gold mb-3 block">Anômalo · Conquistas</span>
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
          Badges.
        </h1>
        <p className="mt-4 text-anomalo-sand text-sm max-w-md">
          {unlocked.length} desbloqueados de {all.length}. Cada um com seu critério.
        </p>
      </Reveal>

      <Reveal delay={250}>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-px bg-anomalo-gold-hair border border-anomalo-gold-hair">
          {all.length === 0 ? (
            <div className="col-span-full bg-anomalo-black p-12 text-center text-anomalo-muted text-sm">
              Nenhum badge cadastrado. Admin define a lista em /admin/gamificacao.
            </div>
          ) : (
            all.map((b) => {
              const got = unlockedSet.has(b.id);
              return (
                <div
                  key={b.id}
                  className="bg-anomalo-black p-5 flex flex-col items-center text-center"
                  style={{ opacity: got ? 1 : 0.4 }}
                >
                  <span
                    className="text-4xl font-light leading-none mb-3"
                    style={{ color: got ? "#c9b298" : "#5a4a34" }}
                  >
                    Λ
                  </span>
                  <h3 className="font-bold text-anomalo-white text-sm mb-1">{b.name}</h3>
                  <p className="text-anomalo-muted text-xs leading-relaxed">{b.criterion}</p>
                  <span
                    className="label-caps mt-3"
                    style={{ color: got ? "#c9b298" : "#5a4a34", fontSize: 10 }}
                  >
                    {got ? "Desbloqueado." : "Bloqueado."}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Reveal>
    </div>
  );
}
