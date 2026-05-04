import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/auth";
import { Toaster } from "sonner";

const TABS = [
  { href: "/admin/metas",            label: "Metas" },
  { href: "/admin/validacoes",       label: "Validações" },
  { href: "/admin/usuarios",         label: "Usuários" },
  { href: "/admin/gamificacao",      label: "Gamificação" },
  { href: "/admin/comissionamento",  label: "Comissão" },
  { href: "/admin/relatorios",       label: "Relatórios" },
  { href: "/admin/mood",             label: "Mood" },
  { href: "/admin/alertas",          label: "Alertas" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAppUser();
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex flex-col min-h-screen bg-anomalo-black">
      <header className="sticky top-0 z-30 border-b border-anomalo-gold-hair bg-anomalo-black/90 backdrop-blur">
        <div className="px-5 md:px-8 py-4 flex items-center justify-between">
          <Link href="/admin/metas" className="flex items-center gap-3">
            <span className="text-anomalo-gold text-2xl font-light leading-none">Λ</span>
            <span className="label-caps text-anomalo-gold">Anômalo · Admin</span>
          </Link>
          <Link href="/dashboard" className="label-caps text-anomalo-sand hover:text-anomalo-gold">
            Voltar ao app →
          </Link>
        </div>
        <nav className="px-5 md:px-8 flex overflow-x-auto gap-1 border-t border-white/5">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="label-caps py-3 px-3 text-anomalo-sand hover:text-anomalo-gold whitespace-nowrap"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
