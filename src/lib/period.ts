// Utils pra filtro de período mensal em todo o sistema.
// Convenção: monthISO no formato "YYYY-MM" (ex: "2026-05").

export type MonthISO = string;

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
