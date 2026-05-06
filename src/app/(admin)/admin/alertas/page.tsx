import { prisma } from "@/lib/prisma";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

const SEV_LABEL: Record<string, { text: string; color: string }> = {
  LOW: { text: "Atenção", color: "#8A7850" },
  MEDIUM: { text: "Importante", color: "#C9953A" },
  HIGH: { text: "Urgente", color: "#fb2c36" },
};

async function safe<T>(label: string, q: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await q();
  } catch (err) {
    console.error(`[admin/alertas] ${label} failed:`, err);
    return fallback;
  }
}

export default async function AlertasPage() {
  type AlertWithUser = Awaited<
    ReturnType<typeof prisma.adminAlert.findMany<{
      include: { targetUser: { select: { name: true } } };
    }>>
  >;
  const alerts = await safe<AlertWithUser>(
    "adminAlert.findMany",
    () =>
      prisma.adminAlert.findMany({
        where: { status: "ACTIVE" },
        include: { targetUser: { select: { name: true } } },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      }),
    [],
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 max-w-4xl mx-auto w-full">
      <span className="label-caps mb-3 block">Admin · Sinais</span>
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
        Aler<br />
        <span
          className="text-[#C9953A]"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            textTransform: "lowercase",
            letterSpacing: "-0.02em",
          }}
        >
          tas.
        </span>
      </h1>
      <p className="text-mid text-sm mt-4 mb-10 max-w-md">
        Sinais pra você chegar antes.
      </p>

      {alerts.length === 0 ? (
        <p className="text-faint text-sm py-12 text-center ano-card-flat">
          Sem alertas. Time todo presente.
        </p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => {
            const sev = SEV_LABEL[a.severity];
            return (
              <li
                key={a.id}
                className="ano-card p-6 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span
                      className="label-caps px-2.5 py-1 rounded-full"
                      style={{ background: sev.color, color: "#1a1410" }}
                    >
                      {sev.text}
                    </span>
                    <span className="text-white font-semibold">{a.targetUser.name}</span>
                  </div>
                  <p className="text-mid text-sm">{a.message}</p>
                  <span className="label-caps label-caps-muted text-[10px] mt-2 block">
                    {formatDistanceToNowStrict(a.createdAt, { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="btn-pill btn-ghost"
                    style={{ height: 34, fontSize: 11, padding: "0 16px" }}
                  >
                    Visto
                  </button>
                  <button
                    className="btn-pill btn-gold"
                    style={{ height: 34, fontSize: 11, padding: "0 16px" }}
                  >
                    Tratado
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
