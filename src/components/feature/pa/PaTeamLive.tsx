"use client";

// Subscreve em Supabase Realtime na tabela acoes_pontuadas.
// Quando uma nova ação é registrada, dispara router.refresh() pra recarregar
// o ranking + feed do server. (Mais simples e correto do que mesclar
// estado local — server-rendered ranking sempre consistente.)
//
// Pra evitar refresh em rajadas, debounce de 1.5s.

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";

export interface FeedItem {
  id: string;
  colaboradorNome: string;
  atividadeNome: string;
  paGerado: number;
  createdAt: string; // ISO
}

export function PaTeamLive({ initialFeed }: { initialFeed: FeedItem[] }) {
  const router = useRouter();
  const [feed, setFeed] = useState(initialFeed);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync com prop quando server re-render
  useEffect(() => {
    setFeed(initialFeed);
  }, [initialFeed]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("acoes_pontuadas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "acoes_pontuadas" },
        () => {
          // Debounce — em caso de rajada (admin registrando várias),
          // espera 1.5s antes de pedir refresh.
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            router.refresh();
          }, 1500);
        },
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  if (feed.length === 0) {
    return (
      <p className="text-faint text-sm py-10 text-center">
        Nenhuma atividade registrada ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {feed.map((ev) => {
        const negativa = ev.paGerado < 0;
        const initials = ev.colaboradorNome
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <li
            key={ev.id}
            className="px-3 py-2.5 flex items-start gap-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
              style={{
                background: "rgba(201,149,58,0.06)",
                boxShadow: "inset 0 0 0 1px rgba(201,149,58,0.30)",
                color: "#C9953A",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/85 leading-snug">
                <span className="font-bold text-white">{ev.colaboradorNome}</span>{" "}
                registrou: {ev.atividadeNome}{" "}
                <span
                  className="text-mono font-bold"
                  style={{ color: negativa ? "#fb2c36" : "#C9953A" }}
                >
                  ({negativa ? "" : "+"}
                  {ev.paGerado.toFixed(1)} PA)
                </span>
              </p>
              <span className="label-caps label-caps-muted text-[9px] mt-1 block">
                há {formatDistanceToNowStrict(new Date(ev.createdAt), { locale: ptBR })}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
