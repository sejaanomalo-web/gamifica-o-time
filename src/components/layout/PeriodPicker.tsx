"use client";

// Filtro de período compartilhável: All-time / Year / Month.
// Sincroniza estado com query string (?p=all | ?p=2026 | ?p=2026-05)
// pra ser bookmarkable e shareable.

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, parseMonthISO, shiftMonth } from "@/lib/period";

export type PeriodMode = "all" | "year" | "month";
export interface ParsedPeriod {
  mode: PeriodMode;
  yearISO: string | null;        // "2026"
  monthISO: string | null;       // "2026-05"
  start: Date | null;            // null se all-time
  end: Date | null;              // null se all-time
  label: string;
  param: string;                 // valor pra URL
}

export function parsePeriod(raw: string | undefined | null): ParsedPeriod {
  const value = raw && raw.trim() ? raw.trim() : currentMonthParam();
  if (value === "all") {
    return {
      mode: "all",
      yearISO: null,
      monthISO: null,
      start: null,
      end: null,
      label: "Todo o período",
      param: "all",
    };
  }
  if (/^\d{4}$/.test(value)) {
    const y = Number(value);
    return {
      mode: "year",
      yearISO: value,
      monthISO: null,
      start: new Date(y, 0, 1),
      end: new Date(y + 1, 0, 1),
      label: value,
      param: value,
    };
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    const start = parseMonthISO(value);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return {
      mode: "month",
      yearISO: value.slice(0, 4),
      monthISO: value,
      start,
      end,
      label: monthLabel(value),
      param: value,
    };
  }
  // fallback
  const cur = currentMonthParam();
  return parsePeriod(cur);
}

function currentMonthParam(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface PeriodPickerProps {
  param: string;
}

export function PeriodPicker({ param }: PeriodPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const period = parsePeriod(param);

  const setParam = (next: string) => {
    const sp = new URLSearchParams(search.toString());
    sp.set("p", next);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const setMode = (mode: PeriodMode) => {
    const now = new Date();
    if (mode === "all") setParam("all");
    else if (mode === "year") setParam(String(now.getFullYear()));
    else setParam(currentMonthParam());
  };

  const stepMonth = (delta: number) => {
    if (period.mode === "month" && period.monthISO) {
      setParam(shiftMonth(period.monthISO, delta));
    } else if (period.mode === "year" && period.yearISO) {
      setParam(String(Number(period.yearISO) + delta));
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Modo */}
      <div
        className="flex p-1 gap-1 rounded-full"
        style={{
          background: "rgba(17,17,21,0.6)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        {(
          [
            ["month", "Mês"],
            ["year", "Ano"],
            ["all", "Tudo"],
          ] as [PeriodMode, string][]
        ).map(([m, label]) => {
          const on = period.mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="label-caps px-4 py-2 rounded-full transition-all"
              style={{
                background: on ? "#C9953A" : "transparent",
                color: on ? "#1a1410" : "rgba(255,255,255,0.65)",
                boxShadow: on ? "0 0 16px rgba(201,149,58,0.30)" : "none",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Stepper (só pra mês/ano) */}
      {period.mode !== "all" && (
        <div
          className="flex items-center gap-1 rounded-full"
          style={{
            background: "rgba(17,17,21,0.6)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            padding: "4px",
          }}
        >
          <button
            onClick={() => stepMonth(-1)}
            aria-label="Anterior"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] text-mid hover:text-[#C9953A] transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span
            className="text-mono px-3"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#C9953A",
              letterSpacing: "-0.01em",
              minWidth: 100,
              textAlign: "center",
            }}
          >
            {period.label}
          </span>
          <button
            onClick={() => stepMonth(1)}
            aria-label="Próximo"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] text-mid hover:text-[#C9953A] transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {period.mode === "all" && (
        <span className="label-caps text-[#C9953A]">{period.label}</span>
      )}
    </div>
  );
}
