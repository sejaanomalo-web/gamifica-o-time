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
  { href: "/dashboard",     label: "Hoje",          icon: Home },
  { href: "/metas",         label: "Metas",         icon: Target },
  { href: "/ranking",       label: "Time",          icon: Users },
  { href: "/mural",         label: "Mural",         icon: Newspaper },
  { href: "/badges",        label: "Badges",        icon: Award },
  { href: "/loja",          label: "Loja",          icon: ShoppingBag },
  { href: "/perfil",        label: "Perfil",        icon: User },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function SideNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...baseItems, { href: "/admin", label: "Admin", icon: Shield }]
    : baseItems;

  return (
    <nav
      aria-label="Navegação lateral"
      className="hidden md:flex flex-col w-64 bg-[#070709]"
      style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="px-6 py-7 flex items-center gap-3">
        <span className="text-[#c9b298] text-2xl font-light leading-none">Λ</span>
        <span className="display-serif-italic text-[#edebe6]" style={{ fontSize: 18 }}>
          anômalo<span className="text-[#c9b298]"> meta</span>
        </span>
      </div>
      <ul className="flex-1 flex flex-col gap-1 px-3">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className="group flex items-center gap-3 px-4 py-2.5 transition-all relative rounded-full"
                style={{
                  color: active ? "#c9b298" : "rgba(237,235,230,0.65)",
                  background: active ? "rgba(201,178,152,0.08)" : "transparent",
                  boxShadow: active ? "inset 0 0 0 1px rgba(201,178,152,0.20)" : "none",
                }}
              >
                <Icon size={17} strokeWidth={1.6} />
                <span className="text-sm font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="px-6 py-5">
        <p className="text-faint text-[10px] tracking-wide uppercase">
          Anômalo Hub
        </p>
      </div>
    </nav>
  );
}
