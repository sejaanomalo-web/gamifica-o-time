// Utils pra filtro de período em todo o sistema.
// Convenção: monthISO "YYYY-MM" (ex: "2026-05"), yearISO "YYYY" (ex: "2026").
// Importável de server e client components.

export type MonthISO = string;

export type PeriodMode = "all" | "year" | "month";

export interface ParsedPeriod {
  mode: PeriodMode;
  yearISO: string | null; // "2026"
  monthISO: string | null; // "2026-05"
  start: Date | null; // null se all-time
  end: Date | null; // null se all-time
  label: string;
  param: string; // valor pra URL
}

function currentMonthParam(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  return parsePeriod(currentMonthParam());
}

export function currentMonthISO(now: Date = new Date()): MonthISO {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function parseMonthISO(iso: MonthISO | undefined | null): Date {
  if (!iso || !/^\d{4}-\d{2}$/.test(iso)) return new Date();
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function monthRange(iso: MonthISO): { start: Date; end: Date } {
  const start = parseMonthISO(iso);
  start.setHours(0, 0, 0, 0);
  start.setDate(1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

export function monthLabel(iso: MonthISO, locale = "pt-BR"): string {
  const d = parseMonthISO(iso);
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

export function shortMonthLabel(iso: MonthISO, locale = "pt-BR"): string {
  const d = parseMonthISO(iso);
  return d
    .toLocaleDateString(locale, { month: "short", year: "2-digit" })
    .replace(/\.$/, "");
}

export function shiftMonth(iso: MonthISO, delta: number): MonthISO {
  const d = parseMonthISO(iso);
  d.setMonth(d.getMonth() + delta);
  return currentMonthISO(d);
}

export function listLastMonths(count: number, fromIso?: MonthISO): MonthISO[] {
  const start = fromIso ?? currentMonthISO();
  return Array.from({ length: count }, (_, i) => shiftMonth(start, -i));
}
