"use client";

import Link from "next/link";
import { Bell, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface TopBarProps {
  userName: string;
  userInitials: string;
  avatarUrl?: string | null;
  unreadCount?: number;
  walletXp?: number;
}

export function TopBar({
  userName,
  userInitials,
  avatarUrl,
  unreadCount = 0,
  walletXp = 0,
}: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-5 py-3 gap-3"
      style={{
        background: "rgba(7,7,9,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
      }}
    >
      {/* Brand mobile + Greeting desktop */}
      <Link href="/dashboard" className="flex items-center gap-2.5 md:hidden flex-shrink-0">
        <span className="text-[#C9953A] text-2xl font-light leading-none">Λ</span>
      </Link>
      <Link href="/dashboard" className="hidden md:flex items-center gap-3 flex-shrink-0">
        <span className="display-italic text-white" style={{ fontSize: 16 }}>
          {greetByHour()},{" "}
          <span className="text-[#C9953A]">{userName.split(" ")[0]}</span>.
        </span>
      </Link>

      {/* Right cluster: Wallet · Bell · Avatar */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Wallet pill — saldo XP convertível */}
        <Link
          href="/loja"
          aria-label="Carteira de XP"
          className="flex items-center gap-2 rounded-full transition-all hover:scale-[1.02]"
          style={{
            padding: "6px 12px 6px 10px",
            height: 36,
            background: "rgba(201,149,58,0.10)",
            boxShadow:
              "inset 0 0 0 1px rgba(201,149,58,0.35), 0 0 12px rgba(201,149,58,0.15)",
            transitionTimingFunction: "var(--ease-academia)",
          }}
        >
          <Wallet size={14} strokeWidth={1.8} className="text-[#C9953A] flex-shrink-0" />
          <span
            className="text-mono text-[#E0B25A] tabular-nums"
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em" }}
          >
            {walletXp.toLocaleString("pt-BR")}
          </span>
          <span
            className="hidden sm:inline label-caps label-caps-muted"
            style={{ fontSize: 9, letterSpacing: "0.14em" }}
          >
            XP
          </span>
        </Link>

        <Link
          href="/notificacoes"
          aria-label="Notificações"
          className="relative p-2 rounded-full transition-colors hover:bg-white/[0.04] flex-shrink-0"
        >
          <motion.span
            animate={
              unreadCount > 0
                ? { rotate: [0, -8, 8, -6, 6, 0] }
                : { rotate: 0 }
            }
            transition={{
              duration: 0.6,
              repeat: unreadCount > 0 ? Infinity : 0,
              repeatDelay: 4,
            }}
            className="inline-flex"
          >
            <Bell size={20} strokeWidth={1.6} className="text-white/80" />
          </motion.span>
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} novas`}
              className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 text-[10px] font-bold flex items-center justify-center rounded-full"
              style={{
                background: "#C9953A",
                color: "#1a1410",
                boxShadow: "0 0 10px rgba(201,149,58,0.6)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <Link
          href="/perfil"
          aria-label="Perfil"
          className="w-9 h-9 flex items-center justify-center font-bold text-sm rounded-full transition-all overflow-hidden flex-shrink-0"
          style={{
            background: "rgba(201,149,58,0.10)",
            boxShadow:
              "inset 0 0 0 1px rgba(201,149,58,0.40), 0 0 12px rgba(201,149,58,0.15)",
            color: "#C9953A",
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
          ) : (
            userInitials
          )}
        </Link>
      </div>
    </header>
  );
}

function greetByHour() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
