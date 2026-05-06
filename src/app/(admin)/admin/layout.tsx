import Link from "next/link";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { requireAppUser } from "@/lib/auth";
import { AdminTabs } from "@/components/layout/AdminTabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAppUser();
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex flex-col min-h-screen bg-[#070709]">
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(7,7,9,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="px-5 md:px-8 py-4 flex items-center justify-between">
          <Link href="/admin/metas" className="flex items-center gap-3">
            <span className="text-[#C9953A] text-2xl font-light leading-none">Λ</span>
            <span className="label-caps">Anômalo · Admin</span>
          </Link>
          <Link
            href="/dashboard"
            className="btn-pill btn-ghost"
            style={{ height: 36, padding: "0 16px", fontSize: 11 }}
          >
            Voltar ao app →
          </Link>
        </div>
        <AdminTabs />
      </header>
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
