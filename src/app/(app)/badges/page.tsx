import { Reveal } from "@/components/motion/Reveal";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[badges] ${label} failed:`, err);
    return fallback;
  }
}

export default async function BadgesPage() {
  const user = await requireAppUser();
  const all = await safe(
    "badge.findMany",
    () => prisma.badge.findMany({ orderBy: { name: "asc" } }),
    [] as Awaited<ReturnType<typeof prisma.badge.findMany>>,
  );
  type UserBadgeWithBadge = Awaited<
    ReturnType<typeof prisma.userBadge.findMany<{ include: { badge: true } }>>
  >;
  const unlocked = await safe<UserBadgeWithBadge>(
    "userBadge.findMany",
    () =>
      prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true },
      }),
    [],
  );
  const unlockedSet = new Set(unlocked.map((u) => u.badgeId));

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-4xl mx-auto w-full">
      <Reveal>
        <span className="label-caps mb-3 block">Game Anômalo · Conquistas</span>
        <h1
          className="text-white"
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          }}
        >
          Suas<br />
          <span
            className="text-[#C9953A]"
            style={{
              fontWeight: 300,
              fontStyle: "italic",
              textTransform: "lowercase",
              letterSpacing: "-0.02em",
            }}
          >
            conquistas.
          </span>
        </h1>
        <p className="mt-4 text-mid text-sm max-w-md">
          <span className="text-mono text-[#C9953A]">
            {unlocked.length}
          </span>{" "}
          desbloqueados de{" "}
          <span className="text-mono text-white">{all.length}</span>. Cada
          um com seu critério.
        </p>
      </Reveal>

      <Reveal delay={250}>
        <div className="mt-10">
          {all.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center ano-card-flat">
              Nenhum badge cadastrado. O admin define a lista em /admin/gamificacao.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {all.map((b) => {
                const got = unlockedSet.has(b.id);
                return (
                  <div
                    key={b.id}
                    className={got ? "ano-card p-6 flex flex-col items-center text-center" : "ano-card-flat p-6 flex flex-col items-center text-center"}
                    style={{
                      opacity: got ? 1 : 0.55,
                      boxShadow: got
                        ? "inset 0 0 0 1px rgba(201,149,58,0.30), 0 8px 32px -16px rgba(201,149,58,0.20)"
                        : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                  >
                    <span
                      className="text-5xl font-light leading-none mb-4"
                      style={{
                        color: got ? "#C9953A" : "#5A4A2A",
                        textShadow: got ? "0 0 24px rgba(201,149,58,0.45)" : "none",
                      }}
                    >
                      Λ
                    </span>
                    <h3
                      className="text-white text-sm mb-2"
                      style={{ fontWeight: 700, letterSpacing: "-0.005em" }}
                    >
                      {b.name}
                    </h3>
                    <p className="text-mid text-xs leading-relaxed mb-4">{b.criterion}</p>
                    <span
                      className="label-caps px-3 py-1 rounded-full"
                      style={{
                        color: got ? "#C9953A" : "#5A4A2A",
                        background: got ? "rgba(201,149,58,0.08)" : "rgba(255,255,255,0.03)",
                        boxShadow: got
                          ? "inset 0 0 0 1px rgba(201,149,58,0.32)"
                          : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                      }}
                    >
                      {got ? "Desbloqueado" : "Bloqueado"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
