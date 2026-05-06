"use client";

// Dashboard do Time — kiosk pra TV no escritório.
// - Anima sempre (constellation, lambda pulsando, count-ups, ticker scroll)
// - Auto-refresh server data a cada 30s via router.refresh()
// - Fullscreen API: esconde shell e ocupa tela toda quando ativado
// - Layout responsivo: mobile single column / desktop 2 cols / TV grande 3 cols

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, RefreshCw, Trophy, Zap, Award, Users } from "lucide-react";
import { CountUp } from "@/components/motion/CountUp";
import { ConstellationBg } from "@/components/motion/ConstellationBg";
import { PulsingLambda } from "@/components/motion/PulsingLambda";

export interface TeamMember {
  userId: string;
  name: string;
  area: string | null;
  avatarUrl: string | null;
  xp: number;
  weekXp: number;
  todayCount: number;
  weekCount: number;
  badges: number;
  level: number;
}

export interface ActivityEvent {
  id: string;
  type: string;
  userName: string;
  avatarUrl: string | null;
  text: string;
  emoji: string;
  createdAt: string;
}

interface Props {
  members: TeamMember[];
  activity: ActivityEvent[];
  totalSeasonXp: number;
  totalDeliveriesToday: number;
  totalDeliveriesWeek: number;
  totalBadges: number;
  avgLevel: number;
  seasonNumber: number;
  daysLeftInSeason: number;
}

const REFRESH_MS = 30_000;

export function TeamDashboard({
  members,
  activity,
  totalSeasonXp,
  totalDeliveriesToday,
  totalDeliveriesWeek,
  totalBadges,
  avgLevel,
  seasonNumber,
  daysLeftInSeason,
}: Props) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const [fullscreen, setFullscreen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clock tick a cada segundo
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh do servidor (puxa dados novos)
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  // Rotaciona spotlight entre top 5 colaboradores
  useEffect(() => {
    if (members.length === 0) return;
    const id = setInterval(() => {
      setHighlightIdx((i) => (i + 1) % Math.min(5, members.length));
    }, 4500);
    return () => clearInterval(id);
  }, [members.length]);

  // Sync state com fullscreen real
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Esconde shell quando entra em fullscreen, mostra de volta quando sai
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("tv-mode", fullscreen);
    return () => {
      document.body.classList.remove("tv-mode");
    };
  }, [fullscreen]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const dateLabel = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const top5 = members.slice(0, 5);
  const maxXp = Math.max(1, ...members.map((m) => m.xp));
  const leader = members[0];

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#070709] overflow-hidden"
      style={{ paddingBottom: fullscreen ? 0 : 96 }}
    >
      {/* Estilo pra esconder shell quando body.tv-mode */}
      <style jsx global>{`
        body.tv-mode header,
        body.tv-mode nav[aria-label="Navegação principal"],
        body.tv-mode nav[aria-label="Navegação lateral"] {
          display: none !important;
        }
        body.tv-mode main {
          padding: 0 !important;
        }
      `}</style>

      {/* Fundo animado constante */}
      <ConstellationBg density="high" opacity={0.18} />
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "10%",
          right: "-10%",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,149,58,0.20) 0%, rgba(201,149,58,0.05) 45%, rgba(201,149,58,0) 75%)",
          filter: "blur(20px)",
        }}
        animate={{ x: [0, -40, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: "5%",
          left: "-12%",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(224,178,90,0.16) 0%, rgba(224,178,90,0.04) 45%, rgba(224,178,90,0) 75%)",
          filter: "blur(28px)",
        }}
        animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 px-6 md:px-10 py-8 md:py-10 max-w-[1600px] mx-auto">
        {/* HEADER: brand + clock + fullscreen */}
        <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
          <div>
            <span className="label-caps mb-2 block">Game Anômalo · Time</span>
            <h1
              className="display-bold text-white"
              style={{
                fontSize: "clamp(3rem, 6vw, 5.5rem)",
                lineHeight: 0.92,
              }}
            >
              Game<br />
              <span className="display-italic text-[#C9953A]">anômalo.</span>
            </h1>
          </div>
          <div className="flex items-end gap-6">
            <div className="text-right">
              <span className="label-caps label-caps-muted block mb-1">
                {dateLabel}
              </span>
              <span
                className="text-mono text-white tabular-nums block"
                style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                {timeLabel}
              </span>
              <span className="label-caps text-[#C9953A] mt-1 block">
                Temporada {String(seasonNumber).padStart(2, "0")} · {daysLeftInSeason}d restantes
              </span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="btn-pill btn-ghost flex-shrink-0"
              style={{ height: 44, padding: "0 18px", fontSize: 12 }}
              aria-label={fullscreen ? "Sair de tela cheia" : "Tela cheia"}
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {fullscreen ? "Sair" : "Tela cheia"}
            </button>
            <button
              onClick={() => router.refresh()}
              className="btn-pill btn-ghost flex-shrink-0"
              style={{ height: 44, padding: "0 18px", fontSize: 12 }}
              aria-label="Atualizar agora"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
          </div>
        </div>

        {/* STATS GLOBAIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
          <StatBig
            icon={<Zap size={18} />}
            label="XP do time"
            value={<CountUp value={totalSeasonXp} duration={1.6} />}
            tone="primary"
          />
          <StatBig
            icon={<Trophy size={18} />}
            label="Entregas hoje"
            value={<CountUp value={totalDeliveriesToday} duration={1.2} />}
          />
          <StatBig
            icon={<Trophy size={18} />}
            label="Esta semana"
            value={<CountUp value={totalDeliveriesWeek} duration={1.4} />}
          />
          <StatBig
            icon={<Award size={18} />}
            label="Badges desbloqueados"
            value={<CountUp value={totalBadges} duration={1.4} />}
          />
        </div>

        {/* MAIN GRID: leaderboard + spotlight + activity */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          {/* LEFT: leaderboard */}
          <section className="ano-card p-6 md:p-8">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="label-caps">Ranking ao vivo</h2>
              <span className="label-caps label-caps-muted">
                <Users size={12} className="inline mr-1.5 -mt-0.5" />
                {members.length} no time
              </span>
            </div>

            {members.length === 0 ? (
              <p className="text-faint text-sm py-12 text-center">
                Sem dados de temporada ainda. Cadastre entregas pra começar.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {members.map((m, i) => {
                  const pct = (m.xp / maxXp) * 100;
                  const isLeader = i === 0;
                  const isHighlighted = i === highlightIdx && i < 5;
                  return (
                    <motion.li
                      key={m.userId}
                      layout
                      transition={{ type: "spring", damping: 26, stiffness: 240 }}
                      className="relative flex items-center gap-4 px-4 py-3 rounded-2xl"
                      style={{
                        background: isHighlighted
                          ? "rgba(201,149,58,0.12)"
                          : "rgba(255,255,255,0.025)",
                        boxShadow: isHighlighted
                          ? "inset 0 0 0 1px #C9953A, 0 0 32px rgba(201,149,58,0.30)"
                          : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                        transition: "all .8s var(--ease-academia)",
                      }}
                    >
                      <div
                        className="text-mono text-3xl tabular-nums flex-shrink-0 w-10 text-right"
                        style={{
                          color: isLeader ? "#E0B25A" : "rgba(255,255,255,0.30)",
                          fontWeight: 700,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>

                      <div
                        className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: isLeader
                            ? "rgba(201,149,58,0.18)"
                            : "rgba(255,255,255,0.04)",
                          boxShadow: isLeader
                            ? "inset 0 0 0 1.5px #C9953A, 0 0 16px rgba(201,149,58,0.4)"
                            : "inset 0 0 0 1px rgba(255,255,255,0.10)",
                          color: isLeader ? "#C9953A" : "#FFF",
                        }}
                      >
                        {m.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          m.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3 mb-1.5">
                          <span
                            className="text-white"
                            style={{
                              fontSize: 17,
                              fontWeight: isLeader ? 800 : 600,
                              letterSpacing: "-0.005em",
                            }}
                          >
                            {m.name}
                          </span>
                          <span
                            className="text-mono text-[#C9953A] tabular-nums flex-shrink-0"
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {m.xp.toLocaleString("pt-BR")} XP
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden mb-1.5"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{
                              background: "linear-gradient(90deg, #C9953A 0%, #E0B25A 100%)",
                              boxShadow: "0 0 10px rgba(201,149,58,0.55)",
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {m.area && (
                            <span className="label-caps label-caps-muted">{m.area}</span>
                          )}
                          <span className="text-mid text-mono tabular-nums">
                            Lv {m.level}
                          </span>
                          <span
                            className="text-mono tabular-nums"
                            style={{
                              color: m.todayCount > 0 ? "#E0B25A" : "rgba(255,255,255,0.30)",
                            }}
                          >
                            {m.todayCount > 0 ? `+${m.todayCount} hoje` : "—"}
                          </span>
                          <span className="text-mid text-mono tabular-nums">
                            +{m.weekXp.toLocaleString("pt-BR")} sem
                          </span>
                          {m.badges > 0 && (
                            <span className="text-mid text-mono tabular-nums">
                              <Award size={10} className="inline mr-0.5 -mt-0.5" />
                              {m.badges}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* RIGHT: spotlight + ticker activity */}
          <div className="flex flex-col gap-6">
            <section className="ano-card p-6 md:p-7 relative overflow-hidden">
              <h2 className="label-caps mb-4">Em destaque</h2>
              <SpotlightCard member={top5[highlightIdx] ?? null} avgLevel={avgLevel} leader={leader} />
            </section>

            <section className="ano-card-flat p-6 md:p-7 relative">
              <h2 className="label-caps mb-4">Atividade ao vivo</h2>
              <ActivityTicker events={activity} />
            </section>
          </div>
        </div>

        {/* LAMBDA gigante decorativo */}
        <div
          className="absolute pointer-events-none select-none"
          style={{ bottom: "8%", right: "5%", opacity: 0.08, zIndex: 0 }}
        >
          <PulsingLambda size={260} duration={6} opacityRange={[0.6, 1]} />
        </div>
      </div>
    </div>
  );
}

function StatBig({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "primary";
}) {
  return (
    <div
      className="ano-card-flat p-5 md:p-6 relative overflow-hidden"
      style={{
        boxShadow:
          tone === "primary"
            ? "inset 0 0 0 1px rgba(201,149,58,0.30), 0 0 32px rgba(201,149,58,0.18)"
            : "inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: tone === "primary" ? "#C9953A" : "#8A7850" }}>
          {icon}
        </span>
        <span className="label-caps label-caps-muted">{label}</span>
      </div>
      <span
        className="text-mono text-white tabular-nums block"
        style={{
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          color: tone === "primary" ? "#E0B25A" : "#FFF",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SpotlightCard({
  member,
  avgLevel,
  leader,
}: {
  member: TeamMember | null;
  avgLevel: number;
  leader?: TeamMember;
}) {
  if (!member) {
    return <p className="text-faint text-sm py-8 text-center">Aguardando dados.</p>;
  }
  const isLeader = leader && member.userId === leader.userId;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={member.userId}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-bold text-2xl flex-shrink-0"
            style={{
              background: "rgba(201,149,58,0.12)",
              boxShadow:
                "inset 0 0 0 2px #C9953A, 0 0 32px rgba(201,149,58,0.45), 0 8px 32px rgba(0,0,0,0.6)",
              color: "#C9953A",
            }}
          >
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              member.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="label-caps label-caps-muted block mb-1.5">
              {isLeader ? "Liderando" : "Em destaque"}
              {member.area ? ` · ${member.area}` : ""}
            </span>
            <h3
              className="text-white"
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              {member.name}
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-3 mt-6 gap-3">
          <SpotlightStat label="XP" value={member.xp.toLocaleString("pt-BR")} primary />
          <SpotlightStat label="Nível" value={String(member.level)} />
          <SpotlightStat label="Hoje" value={`${member.todayCount}`} />
        </div>
        <p className="mt-5 text-sm text-mid">
          {isLeader
            ? "Cabeça do ranking esta temporada."
            : `Nível médio do time: ${avgLevel}.`}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

function SpotlightStat({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div
      className="rounded-xl px-3 py-3 text-center"
      style={{
        background: primary ? "rgba(201,149,58,0.10)" : "rgba(255,255,255,0.03)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <span className="label-caps label-caps-muted block mb-1">{label}</span>
      <span
        className="text-mono tabular-nums"
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: primary ? "#E0B25A" : "#FFF",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ActivityTicker({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-faint text-sm py-6 text-center">
        Nenhuma atividade ainda.
      </p>
    );
  }
  // Duplica a lista pra fazer scroll loop infinito
  const loop = [...events, ...events];
  return (
    <div className="relative overflow-hidden" style={{ height: 360 }}>
      <motion.div
        animate={{ y: [0, -50 * events.length] }}
        transition={{
          duration: events.length * 4,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0"
      >
        {loop.map((ev, idx) => {
          const initials = ev.userName
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const tag = TAG_BY_TYPE[ev.type] ?? { label: "—", color: "#FFF" };
          return (
            <div
              key={`${ev.id}-${idx}`}
              className="px-1 py-2.5 flex items-start gap-3"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                minHeight: 50,
              }}
            >
              <div
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                style={{
                  background: "rgba(201,149,58,0.06)",
                  boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.32)",
                  color: "#C9953A",
                }}
              >
                {ev.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.avatarUrl}
                    alt={ev.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="label-caps text-[9px] mb-0.5 block"
                  style={{ color: tag.color }}
                >
                  {tag.label}
                </span>
                <p className="text-xs text-white/80 leading-snug">
                  <span className="font-bold text-white">{ev.userName}</span>{" "}
                  {ev.text} {ev.emoji}
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>
      {/* Fade no topo e fundo */}
      <div
        className="absolute top-0 left-0 right-0 h-12 pointer-events-none"
        style={{ background: "linear-gradient(180deg, #111115 0%, transparent 100%)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{ background: "linear-gradient(0deg, #111115 0%, transparent 100%)" }}
      />
    </div>
  );
}

const TAG_BY_TYPE: Record<string, { label: string; color: string }> = {
  goal_done: { label: "Meta", color: "#C9953A" },
  badge_unlocked: { label: "Badge", color: "#FFFFFF" },
  level_up: { label: "Nível", color: "#E0B25A" },
  delivery: { label: "Entrega", color: "#C9953A" },
  shop_redeem: { label: "Loja", color: "#8A7850" },
};
