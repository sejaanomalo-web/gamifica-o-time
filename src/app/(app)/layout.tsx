import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { SideNav } from "@/components/layout/SideNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageTransition } from "@/components/layout/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // best-effort lookup; if Prisma isn't reachable yet, fall back to auth user
  let dbUser: { id: string; name: string; role: string; avatarUrl: string | null } | null = null;
  let unread = 0;
  let walletXp = 0;
  try {
    const found = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true, name: true, role: true, avatarUrl: true },
    });
    dbUser = found;
    if (found) {
      unread = await prisma.notification.count({
        where: { userId: found.id, readAt: null },
      });
      // Saldo XP = total acumulado − resgates (não-rejeitados)
      const [xpAgg, redeemAgg] = await Promise.all([
        prisma.xpEvent.aggregate({
          where: { userId: found.id },
          _sum: { amount: true },
        }),
        prisma.redeem.aggregate({
          where: { userId: found.id, status: { not: "REJEITADO" } },
          _sum: { costXp: true },
        }),
      ]);
      walletXp = Math.max(
        0,
        (xpAgg._sum.amount ?? 0) - (redeemAgg._sum.costXp ?? 0),
      );
    }
  } catch {
    // schema not migrated yet
  }

  const name = dbUser?.name ?? user.email?.split("@")[0] ?? "Anômalo";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isAdmin = dbUser?.role === "ADMIN";

  return (
    <div className="flex flex-1 min-h-screen bg-[#070709]">
      <SideNav isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          userName={name}
          userInitials={initials}
          avatarUrl={dbUser?.avatarUrl ?? null}
          unreadCount={unread}
          walletXp={walletXp}
        />
        <main className="flex-1 pb-24 md:pb-8 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}
