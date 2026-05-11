import Link from "next/link";
import { Toaster } from "sonner";
import { requireAdminPA } from "@/lib/pa-auth";
import { AdminTabs } from "@/components/layout/AdminTabs";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Garante admin do sistema PA — se não for admin, redireciona pro /pa/time.
  await requireAdminPA();

  return (
    <div className="flex flex-col min-h-screen bg-[#070709]">
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(7,7,9,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="px-5 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <Link href="/admin/pa" className="flex items-center gap-3">
            <span className="text-[#C9953A] text-2xl font-light leading-none">Λ</span>
            <span className="label-caps">Game Anômalo · Admin</span>
          </Link>
          <Link
            href="/pa/time"
            className="btn-pill btn-ghost"
            style={{ height: 36, padding: "0 16px", fontSize: 11 }}
          >
            Voltar ao app →
          </Link>
        </div>
        <AdminTabs />
      </header>

      {/* pb-24 mobile pra não esconder conteúdo atrás da BottomNav */}
      <main className="flex-1 pb-24 md:pb-8">{children}</main>

      {/* Nav inferior mobile (igual ao app) — admin mantém acesso rápido a
          Time / Equipe / Registrar / Admin / Perfil */}
      <BottomNav isAdmin />

      <Toaster />
    </div>
  );
}
