"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tv, Plus, Users, Gift, User } from "lucide-react";

// Rotas oficiais do sistema PA. "Time" é a aba padrão (1º item)
// — quando o user abre o app, cai em /pa/time com o círculo aceso aqui.
//
// Admin tem o mesmo set do colab + Equipe (TV dashboard). O acesso ao
// painel admin (/admin/pa) saiu da nav e foi pra /perfil — admin é
// gestor antes de tudo, então pontua/loga junto com o time.
const collaboratorItems = [
  { href: "/pa/time",      label: "Time",      icon: Users },
  { href: "/pa/registrar", label: "Registrar", icon: Plus },
  { href: "/pa/loja",      label: "Loja",      icon: Gift },
  { href: "/perfil",       label: "Perfil",    icon: User },
];

const adminItems = [
  { href: "/pa/time",      label: "Time",      icon: Users },
  { href: "/equipe",       label: "Equipe",    icon: Tv },
  { href: "/pa/registrar", label: "Registrar", icon: Plus },
  { href: "/pa/loja",      label: "Loja",      icon: Gift },
  { href: "/perfil",       label: "Perfil",    icon: User },
];

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? adminItems : collaboratorItems;
  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 flex justify-center"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        className="flex items-center w-full max-w-md backdrop-blur-md"
        style={{
          background: "rgba(17, 17, 21, 0.85)",
          borderRadius: 9999,
          padding: "6px",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.08), 0 10px 40px rgba(0,0,0,0.6), 0 4px 20px rgba(201, 178, 152, 0.15)",
        }}
      >
        {items.map((it) => {
          // Match exato ou prefixo, mas evita /pa marcar /pa/registrar como ativo.
          const active =
            pathname === it.href ||
            (it.href !== "/pa" && pathname.startsWith(it.href + "/"));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-full relative"
              style={{
                color: active ? "#C9953A" : "rgba(237,235,230,0.55)",
                background: active ? "rgba(201,149,58,0.10)" : "transparent",
                // Transição suave entre cor ativa/inativa
                transition:
                  "color 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <Icon
                size={20}
                strokeWidth={1.6}
                style={{
                  transform: active ? "scale(1.08)" : "scale(1)",
                  transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
              <span
                className="font-medium"
                style={{ fontSize: 9.5, letterSpacing: "0.05em" }}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
