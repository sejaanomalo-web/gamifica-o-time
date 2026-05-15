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

export interface TeamMember {
  userId: string;
  name: string;
  area: string | null;
  avatarUrl: string | null;
  xp: number;
  weekXp: number;
  todayCount: number;
  weekCount: number;
  goalsBeaten: number;
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
  totalGoalsBeaten: number;
  avgLevel: number;
  seasonNumber: number;
  daysLeftInSeason: number;
}

// Auto-refresh do dashboard a cada 1 minuto. O botão "Atualizar" no
// header dispara router.refresh() instantâneo quando precisa antes disso.
const REFRESH_MS = 60_000;

// Screen Orientation API — best effort. Não-suportado (iPhone Safari)
// silenciosamente vira no-op.
type ScreenOrientationLockable = ScreenOrientation & {
  lock?: (orientation: "landscape" | "portrait" | "any") => Promise<void>;
};

function lockOrientationLandscape() {
  if (typeof screen === "undefined" || !screen.orientation) return;
  const o = screen.orientation as ScreenOrientationLockable;
  if (typeof o.lock !== "function") return;
  o.lock("landscape").catch(() => {
    // iPhone Safari, ou usuário desabilitou — ignora
  });
}

function unlockOrientation() {
  if (typeof screen === "undefined" || !screen.orientation) return;
  try {
    screen.orientation.unlock?.();
  } catch {
    // ignora
  }
}

export function TeamDashboard({
  members,
  totalSeasonXp,
  totalDeliveriesToday,
  totalDeliveriesWeek,
  totalGoalsBeaten,
  avgLevel,
  seasonNumber,
  daysLeftInSeason,
}: Props) {
  // `activity` foi removida do dashboard (Atividade ao vivo só em /pa/time
  // pros colaboradores). A prop continua na interface pra retrocompat.
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

  // Rotaciona spotlight entre TODOS os colaboradores ativos (não só o
  // top 5 — todo mundo merece aparecer em destaque).
  useEffect(() => {
    if (members.length === 0) return;
    const id = setInterval(() => {
      setHighlightIdx((i) => (i + 1) % members.length);
    }, 4500);
    return () => clearInterval(id);
  }, [members.length]);

  // Sync state quando user pressiona ESC ou navegador solta o fullscreen.
  // (Não setamos true aqui — quem ativa é o toggle, pra suportar iOS
  // Safari que não tem Fullscreen API mas ainda recebe modo TV via CSS.)
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false);
        unlockOrientation();
      }
    };
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
    if (fullscreen) {
      // Sair: solta orientação + sai do fullscreen real (se ativo).
      unlockOrientation();
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.warn("exitFullscreen failed", err);
        }
      }
      setFullscreen(false);
      return;
    }

    // Entrar: tenta API real; se falhar (iPhone Safari), segue só com
    // CSS mode (body.tv-mode esconde shell e ocupa o viewport).
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.warn("requestFullscreen indisponível, usando CSS mode:", err);
    }

    // Trava em paisagem se a API estiver disponível (Android Chrome,
    // iPad). iPhone Safari ignora silenciosamente.
    lockOrientationLandscape();
    setFullscreen(true);
  }, [fullscreen]);

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

  // Spotlight rotaciona entre TODOS os colaboradores (não só top 5).
  const spotlightMembers = members;
  const maxXp = Math.max(1, ...members.map((m) => m.xp));
  const leader = members[0];

  return (
    <div
      ref={containerRef}
      className="relative bg-[#070709]"
      style={{
        // Em tela cheia: grid de 2 linhas (conteúdo principal / manifesto)
        // travado em 100dvh (dynamic viewport — preciso em mobile). Inner
        // content distribui header/stats/grid via flex-col interno.
        // Fora dela: flex column normal (rolável).
        ...(fullscreen
          ? {
              display: "grid",
              gridTemplateRows: "minmax(0, 1fr) auto",
              height: "100dvh",
              overflow: "hidden",
            }
          : {
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              paddingBottom: 96,
              overflowX: "hidden",
            }),
      }}
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
      {/* density=medium em vez de high — mobile tava engasgando com 40 spans
          animados em loop infinito + blur dos gradient blobs */}
      <ConstellationBg density="medium" opacity={0.16} />
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
          filter: "blur(14px)",
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
          filter: "blur(18px)",
        }}
        animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="relative z-10 max-w-[1600px] mx-auto w-full flex flex-col"
        style={{
          paddingLeft: fullscreen ? "clamp(12px, 2vw, 40px)" : "1.5rem",
          paddingRight: fullscreen ? "clamp(12px, 2vw, 40px)" : "1.5rem",
          paddingTop: fullscreen ? "clamp(10px, 1.6vh, 28px)" : "2rem",
          paddingBottom: fullscreen ? "clamp(6px, 1vh, 16px)" : "2.5rem",
          minHeight: 0,
          gap: fullscreen ? "clamp(8px, 1.2vh, 20px)" : "2rem",
        }}
      >
        {/* HEADER: brand + clock + fullscreen */}
        <div className="flex items-end justify-between gap-3 md:gap-6 flex-wrap flex-shrink-0">
          <div>
            <span className="label-caps mb-1 block">Game Anômalo · Time</span>
            <h1
              className="display-bold text-white"
              style={{
                fontSize: fullscreen
                  ? "clamp(1.25rem, min(4vw, 6vh), 3rem)"
                  : "clamp(3rem, 6vw, 5.5rem)",
                lineHeight: 0.92,
              }}
            >
              Game<br />
              <span className="display-italic text-[#C9953A]">anômalo.</span>
            </h1>
          </div>
          <div className="flex items-end gap-2 md:gap-4">
            <div className="text-right">
              <span
                className="label-caps label-caps-muted block mb-1"
                style={{ fontSize: fullscreen ? "clamp(8px, 1.1vh, 11px)" : undefined }}
              >
                {dateLabel}
              </span>
              <span
                className="text-mono text-white tabular-nums block"
                style={{
                  fontSize: fullscreen
                    ? "clamp(0.95rem, min(2.6vw, 4vh), 2rem)"
                    : "clamp(2rem, 4.5vw, 3.5rem)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {timeLabel}
              </span>
              <span
                className="label-caps text-[#C9953A] mt-1 block"
                style={{ fontSize: fullscreen ? "clamp(8px, 1.1vh, 11px)" : undefined }}
              >
                Temporada {String(seasonNumber).padStart(2, "0")} · {daysLeftInSeason}d restantes
              </span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="btn-pill btn-ghost flex-shrink-0"
              style={{
                height: fullscreen ? 32 : 40,
                padding: fullscreen ? "0 12px" : "0 16px",
                fontSize: fullscreen ? 10 : 11,
              }}
              aria-label={fullscreen ? "Sair de tela cheia" : "Tela cheia"}
            >
              {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={14} />}
              {fullscreen ? "Sair" : "Tela cheia"}
            </button>
            <button
              onClick={() => router.refresh()}
              className="btn-pill btn-ghost flex-shrink-0"
              style={{
                height: fullscreen ? 32 : 40,
                padding: fullscreen ? "0 12px" : "0 16px",
                fontSize: fullscreen ? 10 : 11,
              }}
              aria-label="Atualizar agora"
            >
              <RefreshCw size={fullscreen ? 12 : 14} />
              Atualizar
            </button>
          </div>
        </div>

        {/* STATS GLOBAIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 flex-shrink-0">
          <StatBig
            icon={<Zap size={18} />}
            label="XP do time"
            value={<CountUp value={totalSeasonXp} duration={1.6} />}
            tone="primary"
            compact={fullscreen}
          />
          <StatBig
            icon={<Trophy size={18} />}
            label="Entregas hoje"
            value={<CountUp value={totalDeliveriesToday} duration={1.2} />}
            compact={fullscreen}
          />
          <StatBig
            icon={<Trophy size={18} />}
            label="Esta semana"
            value={<CountUp value={totalDeliveriesWeek} duration={1.4} />}
            compact={fullscreen}
          />
          <StatBig
            icon={<Award size={18} />}
            label="Metas batidas"
            value={<CountUp value={totalGoalsBeaten} duration={1.4} />}
            compact={fullscreen}
          />
        </div>

        {/* MAIN GRID: leaderboard + spotlight + activity */}
        {/* Em fullscreen, o outer grid-template-rows já distribui a altura
            (1fr aqui, auto na manifesto). Em fullscreen mobile/tablet,
            força 2 colunas — landscape de celular tem ~700-900px, divide. */}
        <div
          className={
            fullscreen
              ? "grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-3 md:gap-5 flex-1"
              : "grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4 md:gap-6 flex-1"
          }
          style={{ minHeight: 0 }}
        >
          {/* LEFT: leaderboard */}
          <section
            className={
              fullscreen
                ? "ano-card p-3 md:p-4 flex flex-col"
                : "ano-card p-5 md:p-6 flex flex-col"
            }
            style={{ minHeight: 0 }}
          >
            <div
              className="flex items-baseline justify-between flex-shrink-0"
              style={{ marginBottom: fullscreen ? 8 : 16 }}
            >
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
              <ul
                className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1"
                style={{ minHeight: 0 }}
              >
                {members.map((m, i) => {
                  const pct = (m.xp / maxXp) * 100;
                  const isLeader = i === 0;
                  const isHighlighted = i === highlightIdx;
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
                          {m.goalsBeaten > 0 && (
                            <span className="text-mid text-mono tabular-nums">
                              <Award size={10} className="inline mr-0.5 -mt-0.5" />
                              {m.goalsBeaten}
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

          {/* RIGHT: spotlight ocupando a coluna inteira (atividade ao vivo
              removida do TV dashboard a pedido — fica em /pa/time pros colabs) */}
          <section
            className={
              fullscreen
                ? "ano-card p-4 md:p-6 relative overflow-hidden flex flex-col"
                : "ano-card p-5 md:p-7 relative overflow-hidden flex flex-col"
            }
            style={{ minHeight: 0 }}
          >
            <h2
              className="label-caps flex-shrink-0"
              style={{ marginBottom: fullscreen ? 12 : 20 }}
            >
              Em destaque
            </h2>
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: 0 }}>
              <SpotlightCard
                member={spotlightMembers[highlightIdx] ?? null}
                avgLevel={avgLevel}
                leader={leader}
                compact={fullscreen}
              />
            </div>
          </section>
        </div>

      </div>

      {/* MANIFESTO SOU ANÔMALO — assinatura cultural ao pé da página, no
          background. Sem card, sem borda, visível também em tela cheia. */}
      <div className="relative z-10 px-6 md:px-10 max-w-[1600px] mx-auto w-full flex-shrink-0">
        <SouAnomaloManifesto compact={fullscreen} />
      </div>
    </div>
  );
}

function StatBig({
  icon,
  label,
  value,
  tone,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "primary";
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? "ano-card-flat p-3 md:p-4 relative overflow-hidden" : "ano-card-flat p-5 md:p-6 relative overflow-hidden"}
      style={{
        boxShadow:
          tone === "primary"
            ? "inset 0 0 0 1px rgba(201,149,58,0.30), 0 0 32px rgba(201,149,58,0.18)"
            : "inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      <div className={compact ? "flex items-center gap-2 mb-1" : "flex items-center gap-2 mb-3"}>
        <span style={{ color: tone === "primary" ? "#C9953A" : "#8A7850" }}>
          {icon}
        </span>
        <span className="label-caps label-caps-muted">{label}</span>
      </div>
      <span
        className="text-mono text-white tabular-nums block"
        style={{
          fontSize: compact ? "clamp(1.5rem, 2.5vw, 2.25rem)" : "clamp(2rem, 4vw, 3rem)",
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
  compact,
}: {
  member: TeamMember | null;
  avgLevel: number;
  leader?: TeamMember;
  compact?: boolean;
}) {
  if (!member) {
    return <p className="text-faint text-sm py-8 text-center">Aguardando dados.</p>;
  }
  const isLeader = leader && member.userId === leader.userId;

  // Em compact (fullscreen), o spotlight agora ocupa a coluna inteira,
  // então pode crescer generoso. Sizing baseado em viewport pra adaptar
  // entre TV grande, laptop e celular landscape.
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={member.userId}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -24, scale: 0.96 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center text-center w-full"
        style={{ gap: compact ? "clamp(16px, 2.5vh, 36px)" : 24 }}
      >
        {/* Avatar gigante e centralizado */}
        <div
          className="rounded-full overflow-hidden flex items-center justify-center font-bold flex-shrink-0"
          style={{
            width: compact ? "clamp(120px, 18vh, 240px)" : 80,
            height: compact ? "clamp(120px, 18vh, 240px)" : 80,
            fontSize: compact ? "clamp(40px, 7vh, 80px)" : 24,
            background: "rgba(201,149,58,0.12)",
            boxShadow:
              "inset 0 0 0 2.5px #C9953A, 0 0 48px rgba(201,149,58,0.45), 0 12px 48px rgba(0,0,0,0.6)",
            color: "#C9953A",
          }}
        >
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            member.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
          )}
        </div>

        {/* Label + Nome */}
        <div className="flex flex-col items-center">
          <span
            className="label-caps label-caps-muted block"
            style={{
              marginBottom: compact ? "clamp(6px, 0.8vh, 12px)" : 6,
              fontSize: compact ? "clamp(10px, 1.2vh, 14px)" : undefined,
              letterSpacing: "0.16em",
            }}
          >
            {isLeader ? "Liderando" : "Em destaque"}
            {member.area ? ` · ${member.area}` : ""}
          </span>
          <h3
            className="text-white"
            style={{
              fontSize: compact ? "clamp(28px, 4.5vh, 56px)" : 24,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              textTransform: "uppercase",
            }}
          >
            {member.name}
          </h3>
        </div>

        {/* Stats grandes */}
        <div
          className="grid grid-cols-3 w-full"
          style={{ gap: compact ? "clamp(8px, 1.2vw, 18px)" : 8 }}
        >
          <SpotlightStat
            label="PA"
            value={member.xp.toLocaleString("pt-BR")}
            primary
            compact={compact}
          />
          <SpotlightStat label="Nível" value={String(member.level)} compact={compact} />
          <SpotlightStat label="Hoje" value={`${member.todayCount}`} compact={compact} />
        </div>

        {/* Frase contextual aparece em fullscreen tambem (tem espaço) */}
        <p
          className="text-mid"
          style={{
            fontSize: compact ? "clamp(11px, 1.4vh, 16px)" : 14,
            maxWidth: "32ch",
            lineHeight: 1.4,
          }}
        >
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
  compact,
}: {
  label: string;
  value: string;
  primary?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-xl text-center"
      style={{
        padding: compact ? "clamp(10px, 1.4vh, 18px) clamp(8px, 1vw, 14px)" : "12px 12px",
        background: primary ? "rgba(201,149,58,0.10)" : "rgba(255,255,255,0.03)",
        boxShadow: primary
          ? "inset 0 0 0 1px rgba(201,149,58,0.30)"
          : "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <span
        className="label-caps label-caps-muted block"
        style={{
          marginBottom: compact ? "clamp(2px, 0.4vh, 6px)" : 4,
          fontSize: compact ? "clamp(9px, 1vh, 12px)" : undefined,
        }}
      >
        {label}
      </span>
      <span
        className="text-mono tabular-nums"
        style={{
          fontSize: compact ? "clamp(20px, 3.2vh, 40px)" : 20,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: primary ? "#E0B25A" : "#FFF",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ActivityTicker removido do /equipe — feed ao vivo agora vive em /pa/time
// (pros colaboradores). Coluna direita do TeamDashboard mostra só o
// "Em destaque" ocupando a altura inteira.

function SouAnomaloManifesto({ compact }: { compact?: boolean }) {
  return (
    <section
      aria-label="Manifesto cultural da Anômalo Hub"
      className="manifesto-section"
      style={{
        // Em compact (fullscreen) o tamanho usa vh — o gargalo no mobile
        // landscape é a altura, não a largura. Garante que tudo cabe sem
        // sobrepor o grid principal.
        paddingTop: compact ? "clamp(12px, 2.5vh, 40px)" : "clamp(40px, 5vw, 96px)",
        paddingBottom: compact ? "clamp(10px, 2vh, 32px)" : "clamp(28px, 3vw, 56px)",
        borderTop: "1px solid rgba(201,149,58,0.10)",
        marginTop: compact ? "clamp(8px, 1.2vh, 20px)" : "clamp(48px, 6vw, 96px)",
      }}
    >
      <div
        className="manifesto-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: compact ? "clamp(16px, 3vw, 56px)" : "clamp(32px, 4.5vw, 96px)",
        }}
      >
        <ul
          className="manifesto-frases"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            gap: compact ? "clamp(2px, 0.6vh, 10px)" : "clamp(8px, 0.9vw, 16px)",
          }}
        >
          {[
            "Compreendo meu papel.",
            "Assumo nosso propósito.",
            "Me comprometo com nossa cultura.",
          ].map((frase) => (
            <li
              key={frase}
              style={{
                color: "#8A7850",
                fontSize: compact ? "clamp(11px, 1.6vh, 18px)" : "clamp(13px, 1vw, 17px)",
                lineHeight: 1.35,
                fontWeight: 400,
                letterSpacing: "-0.005em",
              }}
            >
              {frase}
            </li>
          ))}
        </ul>

        <div
          className="manifesto-divider"
          aria-hidden
          style={{
            width: 1,
            height: compact ? "clamp(40px, 7vh, 100px)" : "clamp(56px, 7vw, 110px)",
            background: "rgba(201,149,58,0.30)",
          }}
        />

        <strong
          className="manifesto-signature"
          style={{
            color: "#FFFFFF",
            // Usa o MENOR entre vw (largura) e vh (altura) — assim em
            // landscape phone (largura grande, altura pequena) escolhe
            // vh e fica proporcional. Cap em 56px no maior.
            fontSize: compact ? "clamp(22px, min(3.5vw, 5vh), 56px)" : "clamp(28px, 3vw, 56px)",
            fontWeight: 900,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontStyle: "normal",
            lineHeight: 1,
            display: "block",
          }}
        >
          Sou <span style={{ color: "#C9953A" }}>Anômalo.</span>
        </strong>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .manifesto-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .manifesto-frases {
            text-align: center !important;
            align-items: center;
          }
          .manifesto-divider {
            width: 32px !important;
            height: 1px !important;
            margin: 0 auto;
          }
          .manifesto-signature {
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}
