import { prisma } from "@/lib/prisma";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

const SEV_LABEL: Record<string, { text: string; color: string }> = {
  LOW: { text: "Atenção", color: "#8d7556" },
  MEDIUM: { text: "Importante", color: "#c9b298" },
  HIGH: { text: "Urgente", color: "#E26B4A" },
};

export default async function AlertasPage() {
  const alerts = await prisma.adminAlert.findMany({
    where: { status: "ACTIVE" },
    include: { targetUser: { select: { name: true } } },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="px-5 md:px-8 py-6 md:py-10 max-w-4xl mx-auto w-full">
      <h1 className="text-h2 uppercase text-anomalo-white mb-2">Alertas.</h1>
      <p className="text-anomalo-sand text-sm mb-8">Sinais pra você chegar antes.</p>

      {alerts.length === 0 ? (
        <p className="text-anomalo-muted text-sm py-12 text-center border border-anomalo-gold-hair">
          Sem alertas. Time todo presente.
        </p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => {
            const sev = SEV_LABEL[a.severity];
            return (
              <li
                key={a.id}
                className="border border-anomalo-gold-hair p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="label-caps text-[10px] px-2 py-0.5"
                      style={{ background: sev.color, color: "#000" }}
                    >
                      {sev.text}
                    </span>
                    <span className="text-anomalo-white font-bold">{a.targetUser.name}</span>
                  </div>
                  <p className="text-anomalo-sand text-sm">{a.message}</p>
                  <span className="label-caps text-anomalo-muted text-[10px] mt-1 block">
                    {formatDistanceToNowStrict(a.createdAt, { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="label-caps px-3 py-2 border border-anomalo-gold-hair text-anomalo-sand">
                    Visto
                  </button>
                  <button className="label-caps px-3 py-2" style={{ background: "#c9b298", color: "#000" }}>
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
