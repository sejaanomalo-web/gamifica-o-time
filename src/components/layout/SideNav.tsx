"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Target,
  Users,
  Newspaper,
  User,
  ShoppingBag,
  Award,
  Settings,
  Shield,
} from "lucide-react";

const baseItems = [
  { href: "/dashboard",       label: "Hoje",            icon: Home },
  { href: "/metas",           label: "Metas",           icon: Target },
  { href: "/ranking",         label: "Time",            icon: Users },
  { href: "/mural",           label: "Mural",           icon: Newspaper },
  { href: "/badges",          label: "Badges",          icon: Award },
  { href: "/loja",            label: "Loja",            icon: ShoppingBag },
  { href: "/perfil",          label: "Perfil",          icon: User },
  { href: "/configuracoes",   label: "Configurações",   icon: Settings },
];

export function SideNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...baseItems, { href: "/admin", label: "Admin", icon: Shield }]
    : baseItems;

  return (
    <nav
      aria-label="Navegação lateral"
      className="hidden md:flex flex-col w-64 border-r border-anomalo-gold-hair bg-anomalo-black"
    >
      <div className="px-6 py-6 flex items-center gap-3">
        <span className="text-anomalo-gold text-2xl font-light leading-none">Λ</span>
        <span className="label-caps text-anomalo-gold">Anômalo Meta</span>
      </div>
      <ul className="flex-1 flex flex-col gap-1 px-3">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className="group flex items-center gap-3 px-4 py-2.5 transition-colors relative"
                style={{
                  color: active ? "#C9953A" : "rgba(255,255,255,0.7)",
                  background: active ? "rgba(201,149,58,0.06)" : "transparent",
                }}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-2 bottom-2 w-px"
                    style={{ background: "#C9953A" }}
                  />
                )}
                <Icon size={18} strokeWidth={1.6} />
                <span className="text-sm font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
