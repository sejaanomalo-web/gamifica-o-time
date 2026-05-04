"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Target, Users, Newspaper, User } from "lucide-react";

const items = [
  { href: "/dashboard",     label: "Hoje",   icon: Home },
  { href: "/metas",         label: "Metas",  icon: Target },
  { href: "/ranking",       label: "Time",   icon: Users },
  { href: "/mural",         label: "Mural",  icon: Newspaper },
  { href: "/perfil",        label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-anomalo-gold-hair bg-anomalo-black/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className="flex flex-col items-center gap-1 py-3 px-1 relative"
                style={{ color: active ? "#C9953A" : "rgba(255,255,255,0.55)" }}
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-active"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px bg-anomalo-gold"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <Icon size={22} strokeWidth={1.6} />
                </motion.span>
                <span
                  className="font-medium"
                  style={{ fontSize: 10, letterSpacing: "0.04em" }}
                >
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
