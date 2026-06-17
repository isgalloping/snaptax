import type { Receipt } from "@/lib/types";
import { receiptsInTaxYear, taxYearDeductions } from "@/lib/tax/taxYearStats";
import { clientTimeZone } from "@/lib/time/timeZone";

export type DeadlineUrgency = "safe" | "attention" | "urgent";

export interface TaxDeadlineInfo {
  quarterLabel: string;
  daysLeft: number;
  urgency: DeadlineUrgency;
  deadlineDate: Date;
  projectedPayment: number | null;
  income: number;
  expenses: number;
  netProfit: number;
}

/** US estimated tax due dates (month 1-indexed in helper below). */
const US_DEADLINES = [
  { month: 4, day: 15, quarter: "Q1" },
  { month: 6, day: 15, quarter: "Q2" },
  { month: 9, day: 15, quarter: "Q3" },
  { month: 1, day: 15, quarter: "Q4", yearOffset: 1 },
] as const;

function toUtcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
}

function adjustWeekend(date: Date): Date {
  const dow = date.getUTCDay();
  if (dow === 6) return new Date(date.getTime() + 2 * 86400000);
  if (dow === 0) return new Date(date.getTime() + 86400000);
  return date;
}

export function nextEstimatedTaxDeadline(
  now: Date,
  timeZone: string = clientTimeZone(),
): Date {
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now),
  );
  const candidates: Date[] = [];
  for (const d of US_DEADLINES) {
    const deadlineYear =
      d.quarter === "Q4" && d.month === 1 ? year + 1 : year;
    candidates.push(adjustWeekend(toUtcDate(deadlineYear, d.month, d.day)));
  }
  const future = candidates.filter((c) => c.getTime() > now.getTime());
  if (future.length > 0) {
    return future.sort((a, b) => a.getTime() - b.getTime())[0]!;
  }
  return adjustWeekend(toUtcDate(year + 1, 4, 15));
}

function quarterLabelForDate(deadline: Date): string {
  const m = deadline.getUTCMonth() + 1;
  if (m === 4) return "Q1 Estimated Tax";
  if (m === 6) return "Q2 Estimated Tax";
  if (m === 9) return "Q3 Estimated Tax";
  return "Q4 Estimated Tax";
}

export function deadlineUrgency(daysLeft: number): DeadlineUrgency {
  if (daysLeft > 30) return "safe";
  if (daysLeft >= 14) return "attention";
  return "urgent";
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

export function computeTaxDeadline(
  receipts: Receipt[],
  opts: {
    now?: Date;
    timeZone?: string;
    marginalRate?: number;
  } = {},
): TaxDeadlineInfo {
  const now = opts.now ?? new Date();
  const timeZone = opts.timeZone ?? clientTimeZone();
  const marginalRate = opts.marginalRate ?? 0.25;
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now),
  );
  const deadlineDate = nextEstimatedTaxDeadline(now, timeZone);
  const daysLeft = daysBetween(now, deadlineDate);
  const yearReceipts = receiptsInTaxYear(receipts, year, timeZone);
  const expenses = round2(
    yearReceipts.reduce((s, r) => s + (r.amount ?? 0), 0),
  );
  const income = 0;
  const netProfit = round2(income - expenses);
  const deductions = taxYearDeductions(receipts, year, timeZone);
  const projectedPayment =
    deductions > 0 ? round2((deductions * marginalRate) / 4) : null;

  return {
    quarterLabel: quarterLabelForDate(deadlineDate),
    daysLeft,
    urgency: deadlineUrgency(daysLeft),
    deadlineDate,
    projectedPayment,
    income,
    expenses,
    netProfit,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
