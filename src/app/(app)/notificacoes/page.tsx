import { Reveal } from "@/components/motion/Reveal";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[notificacoes] ${label} failed:`, err);
    return fallback;
  }
}

export default async function NotificacoesPage() {
  const user = await requireAppUser();
  const notifs = await safe(
    "notification.findMany",
    () =>
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    [] as Awaited<ReturnType<typeof prisma.notification.findMany>>,
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-2xl mx-auto w-full">
      <Reveal>
        <span className="label-caps mb-3 block">GΛME Anômalo · Inbox</span>
        <h1
          className="text-white"
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.25rem, 7vw, 3rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          }}
        >
          Notifica<br />
          <span
            className="text-[#C9953A]"
            style={{
              fontWeight: 300,
              fontStyle: "italic",
              textTransform: "lowercase",
              letterSpacing: "-0.02em",
            }}
          >
            ções.
          </span>
        </h1>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-10 ano-card-flat overflow-hidden">
          {notifs.length === 0 ? (
            <p className="text-faint text-sm py-12 text-center">Nenhuma notificação.</p>
          ) : (
            notifs.map((n, i) => (
              <div
                key={n.id}
                className="px-5 py-4 flex items-start gap-3"
                style={{
                  borderBottom: i < notifs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                {!n.readAt && (
                  <span
                    aria-hidden
                    className="w-1.5 h-1.5 mt-2 flex-shrink-0 rounded-full"
                    style={{
                      background: "#C9953A",
                      boxShadow: "0 0 8px rgba(201,149,58,0.55)",
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-white text-sm font-semibold">{n.title}</span>
                    <span className="label-caps label-caps-muted text-[10px] text-mono">
                      {formatDistanceToNowStrict(n.createdAt, { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-mid text-sm leading-relaxed">{n.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Reveal>
    </div>
  );
}
