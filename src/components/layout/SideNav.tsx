"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Users, Gift, User } from "lucide-react";

// "Time" é a aba padrão — 1º item da nav, círculo aceso ao abrir.
// Admin usa a mesma nav do colab — Equipe (TV) e Painel admin ficam
// acessíveis via /perfil.
const items = [
  { href: "/pa/time",      label: "Time",      icon: Users },
  { href: "/pa/registrar", label: "Registrar", icon: Plus },
  { href: "/pa",           label: "Início",    icon: Home },
  { href: "/pa/loja",      label: "Loja",      icon: Gift },
  { href: "/perfil",       label: "Perfil",    icon: User },
];

// isAdmin mantido na assinatura por compat; nav é a mesma pros dois.
export function SideNav({ isAdmin: _isAdmin = false }: { isAdmin?: boolean } = {}) {
  void _isAdmin;
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação lateral"
      className="hidden md:flex flex-col w-64 bg-[#070709]"
      style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="px-6 py-7 flex items-center gap-3">
        <span className="text-[#C9953A] text-2xl font-light leading-none">Λ</span>
        <span
          className="text-white"
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Game{" "}
          <span
            className="text-[#C9953A]"
            style={{ fontWeight: 300, fontStyle: "italic", textTransform: "lowercase" }}
          >
            anômalo
          </span>
        </span>
      </div>
      <ul className="flex-1 flex flex-col gap-1 px-3">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/pa" && pathname.startsWith(it.href + "/"));
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className="group flex items-center gap-3 px-4 py-2.5 relative rounded-full"
                style={{
                  color: active ? "#C9953A" : "rgba(237,235,230,0.65)",
                  background: active ? "rgba(201,149,58,0.08)" : "transparent",
                  boxShadow: active ? "inset 0 0 0 1px rgba(201,149,58,0.20)" : "none",
                  transition:
                    "color 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
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
        <p className="text-faint text-[10px] tracking-wide uppercase">Anômalo Hub</p>
      </div>
    </nav>
  );
}
