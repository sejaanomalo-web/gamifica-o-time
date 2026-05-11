import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { SideNav } from "@/components/layout/SideNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageTransition } from "@/components/layout/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sistema PA — busca o colaborador pelo email do auth.
  let colab: {
    id: string;
    nome: string;
    isAdmin: boolean;
    avatarUrl: string | null;
  } | null = null;
  // Saldo PA disponível na carteira (acumulável lifetime) =
  //   PA total ganho (não rejeitada) − resgates lifetime (não rejeitado)
  // É o mesmo cálculo de /pa/loja e /api/pa/loja → carteira sempre bate
  // com a tela de resgate.
  let paSaldo = 0;

  try {
    const found = await prisma.colaborador.findUnique({
      where: { email: user.email! },
      select: { id: true, nome: true, isAdmin: true, avatarUrl: true },
    });
    colab = found;
    if (found) {
      const [paAgg, resgatesAgg] = await Promise.all([
        prisma.acaoPontuada.aggregate({
          where: { colaboradorId: found.id, status: { not: "REJEITADA" } },
          _sum: { paGerado: true },
        }),
        prisma.lojaResgate.aggregate({
          where: { colaboradorId: found.id, status: { not: "REJEITADO" } },
          _sum: { paGasto: true },
        }),
      ]);
      const acumulado = Number(paAgg._sum.paGerado ?? 0);
      const gasto = Number(resgatesAgg._sum.paGasto ?? 0);
      paSaldo = Math.max(0, acumulado - gasto);
    }
  } catch (err) {
    console.error("[layout] colab lookup failed:", err);
  }

  const name = colab?.nome ?? user.email?.split("@")[0] ?? "Anômalo";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isAdmin = colab?.isAdmin ?? false;

  return (
    <div className="flex flex-1 min-h-screen bg-[#070709]">
      <SideNav isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          userName={name}
          userInitials={initials}
          avatarUrl={colab?.avatarUrl ?? null}
          walletXp={Math.round(paSaldo)}
        />
        <main className="flex-1 pb-24 md:pb-8 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}
