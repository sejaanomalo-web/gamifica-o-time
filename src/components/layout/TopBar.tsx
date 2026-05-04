"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";

interface TopBarProps {
  userName: string;
  userInitials: string;
  unreadCount?: number;
}

export function TopBar({ userName, userInitials, unreadCount = 0 }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-anomalo-black/90 backdrop-blur border-b border-anomalo-gold-hair"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
    >
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <span className="text-anomalo-gold text-2xl font-light leading-none">Λ</span>
        <span className="label-caps text-anomalo-gold hidden md:inline">
          {greetByHour()}, {userName.split(" ")[0]}.
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href="/notificacoes"
          aria-label="Notificações"
          className="relative p-2"
        >
          <motion.span
            animate={
              unreadCount > 0
                ? { rotate: [0, -8, 8, -6, 6, 0] }
                : { rotate: 0 }
            }
            transition={{ duration: 0.6, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 4 }}
            className="inline-flex"
          >
            <Bell size={20} strokeWidth={1.6} className="text-anomalo-white/80" />
          </motion.span>
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} novas`}
              className="absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center"
              style={{ background: "#C9953A", color: "#000" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <Link
          href="/perfil"
          aria-label="Perfil"
          className="w-9 h-9 flex items-center justify-center font-bold text-sm border border-anomalo-gold-hair text-anomalo-gold"
          style={{ background: "rgba(201,149,58,0.06)" }}
        >
          {userInitials}
        </Link>
      </div>
    </header>
  );
}

function greetByHour() {
  if (typeof window === "undefined") return "Bom dia";
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
