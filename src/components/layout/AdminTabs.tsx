"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Tabs do admin no sistema PA. Rotas legadas (metas, comissionamento,
// gamificacao, alertas, validacoes, mood) saíram da nav.
const TABS = [
  { href: "/admin/pa",          label: "PA" },
  { href: "/admin/usuarios",    label: "Usuários" },
  { href: "/admin/relatorios",  label: "Relatórios" },
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
            className="label-caps py-2 px-4 rounded-full whitespace-nowrap flex-shrink-0"
            style={{
              color: active ? "#1a1410" : "rgba(255,255,255,0.65)",
              background: active ? "#C9953A" : "transparent",
              boxShadow: active
                ? "0 0 16px rgba(201,149,58,0.30)"
                : "inset 0 0 0 1px rgba(255,255,255,0.06)",
              transition:
                "color 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
