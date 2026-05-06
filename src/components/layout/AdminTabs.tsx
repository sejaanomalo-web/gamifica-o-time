"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/metas",           label: "Metas" },
  { href: "/admin/validacoes",      label: "Validações" },
  { href: "/admin/usuarios",        label: "Usuários" },
  { href: "/admin/gamificacao",     label: "Gamificação" },
  { href: "/admin/comissionamento", label: "Comissão" },
  { href: "/admin/relatorios",      label: "Relatórios" },
  { href: "/admin/mood",            label: "Mood" },
  { href: "/admin/alertas",         label: "Alertas" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="px-3 md:px-6 pb-3 flex overflow-x-auto gap-1.5">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className="label-caps py-2 px-4 rounded-full whitespace-nowrap transition-all flex-shrink-0"
            style={{
              color: active ? "#1a1410" : "rgba(255,255,255,0.65)",
              background: active ? "#C9953A" : "transparent",
              boxShadow: active
                ? "0 0 16px rgba(201,149,58,0.30)"
                : "inset 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
