import { clientTimeZone } from "@/lib/time/timeZone";

export interface TaxYearProgressResult {
  year: number;
  progressPct: number;
  projectedSavings: number | null;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayOfYear(date: Date, timeZone: string): number {
  const start = new Date(
    Date.UTC(
      Number(
        new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(
          date,
        ),
      ),
      0,
      1,
    ),
  );
  return Math.floor((date.getTime() - start.getTime()) / 86400000) + 1;
}

export function computeTaxYearProgress(
  taxSaved: number | null,
  opts: { now?: Date; timeZone?: string } = {},
): TaxYearProgressResult {
  const now = opts.now ?? new Date();
  const timeZone = opts.timeZone ?? clientTimeZone();
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now),
  );
  const totalDays = isLeapYear(year) ? 366 : 365;
  const elapsed = dayOfYear(now, timeZone);
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round((elapsed / totalDays) * 100)),
  );
  const saved = taxSaved ?? 0;
  const projectedSavings =
    saved > 0 && elapsed > 0
      ? round2(saved * (totalDays / elapsed))
      : null;

  return { year, progressPct, projectedSavings };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
