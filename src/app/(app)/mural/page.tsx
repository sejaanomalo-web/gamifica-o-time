import { Reveal } from "@/components/motion/Reveal";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

const KIND_LABEL: Record<string, { tag: string; color: string }> = {
  goal_done:      { tag: "Meta",  color: "#C9953A" },
  badge_unlocked: { tag: "Badge", color: "#FFFFFF" },
  level_up:       { tag: "Nível", color: "#C9953A" },
  shop_redeem:    { tag: "Loja",  color: "#8A7850" },
};

export default async function MuralPage() {
  await requireAppUser();
  const events = await prisma.muralEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-3xl mx-auto w-full">
      <Reveal>
        <span className="label-caps text-anomalo-gold mb-3 block">Anômalo · Mural</span>
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
          Cada<br />
          <span className="text-respiro" style={{ textTransform: "lowercase" }}>
            entrega.
          </span>
        </h1>
        <p className="mt-4 text-anomalo-sand text-sm max-w-md">
          Tudo que o time entregou nos últimos dias. Em ordem de chegada.
        </p>
      </Reveal>

      <div className="mt-10 border border-anomalo-gold-hair">
        {events.length === 0 ? (
          <p className="text-anomalo-muted text-sm py-12 text-center">
            Nada no mural ainda. Vai ter logo.
          </p>
        ) : (
          events.map((ev, i) => {
            const meta = KIND_LABEL[ev.type] ?? { tag: "—", color: "#FFFFFF" };
            const payload = ev.payload as { text?: string; emoji?: string } | null;
            return (
              <Reveal key={ev.id} delay={120 + i * 60}>
                <div className="border-b border-white/5 last:border-0 px-4 py-4 flex items-start gap-3">
                  <div
                    className="w-9 h-9 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-anomalo-gold-hair"
                    style={{ background: "rgba(201,149,58,0.06)", color: "#C9953A" }}
                  >
                    {(ev.user.name ?? "—")
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1 gap-2">
                      <span className="label-caps" style={{ color: meta.color }}>
                        {meta.tag}
                      </span>
                      <span className="label-caps text-anomalo-muted text-[10px]">
                        {formatDistanceToNowStrict(ev.createdAt, { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-anomalo-white/85 leading-relaxed">
                      <span className="font-bold text-anomalo-white">{ev.user.name}</span>{" "}
                      {payload?.text ?? "—"} {payload?.emoji ?? ""}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })
        )}
      </div>
    </div>
  );
}
