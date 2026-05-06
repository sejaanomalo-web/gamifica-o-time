"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Target, Users, ShoppingBag, User } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Hoje",   icon: Home },
  { href: "/metas",     label: "Metas",  icon: Target },
  { href: "/ranking",   label: "Time",   icon: Users },
  { href: "/loja",      label: "Loja",   icon: ShoppingBag },
  { href: "/perfil",    label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
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
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-full transition-colors relative"
              style={{
                color: active ? "#C9953A" : "rgba(237,235,230,0.55)",
                background: active ? "rgba(201,149,58,0.10)" : "transparent",
              }}
            >
              <motion.span
                animate={{ scale: active ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 360, damping: 24 }}
              >
                <Icon size={20} strokeWidth={1.6} />
              </motion.span>
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
