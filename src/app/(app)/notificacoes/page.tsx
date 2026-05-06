import { Reveal } from "@/components/motion/Reveal";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function NotificacoesPage() {
  const user = await requireAppUser();
  const notifs = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-2xl mx-auto w-full">
      <Reveal>
        <h1 className="text-h2 uppercase text-anomalo-white" style={{ letterSpacing: "-0.01em" }}>
          Notificações.
        </h1>
      </Reveal>

      <div className="mt-8 border border-anomalo-gold-hair">
        {notifs.length === 0 ? (
          <p className="text-anomalo-muted text-sm py-12 text-center">
            Nenhuma notificação.
          </p>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              className="border-b border-white/5 last:border-0 px-4 py-3.5 flex items-start gap-3"
            >
              {!n.readAt && (
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 mt-2 flex-shrink-0"
                  style={{ background: "#c9b298" }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-anomalo-white text-sm font-bold">{n.title}</span>
                  <span className="label-caps text-anomalo-muted text-[10px]">
                    {formatDistanceToNowStrict(n.createdAt, { locale: ptBR })}
                  </span>
                </div>
                <p className="text-anomalo-sand text-sm leading-relaxed">{n.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
