import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { SideNav } from "@/components/layout/SideNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { currentMesAno } from "@/lib/pa";

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
  let paMes = 0;

  try {
    const found = await prisma.colaborador.findUnique({
      where: { email: user.email! },
      select: { id: true, nome: true, isAdmin: true, avatarUrl: true },
    });
    colab = found;
    if (found) {
      const mesAno = currentMesAno();
      const [year, month] = mesAno.split("-").map(Number);
      const inicio = new Date(year, month - 1, 1);
      const fim = new Date(year, month, 1);
      const agg = await prisma.acaoPontuada.aggregate({
        where: { colaboradorId: found.id, data: { gte: inicio, lt: fim } },
        _sum: { paGerado: true },
      });
      paMes = Number(agg._sum.paGerado ?? 0);
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
          unreadCount={0}
          walletXp={Math.round(paMes)}
        />
        <main className="flex-1 pb-24 md:pb-8 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}
