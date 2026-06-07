import type { TaxRegion } from "@/lib/tax/types";

/** BCP 47 locale for date/time display (English UI, US vs EU conventions). */
export function localeForRegion(region: TaxRegion = "us"): string {
  return region === "eu" ? "en-GB" : "en-US";
}

export function formatCurrency(amount: number): string {
  return formatCurrencyForRegion(amount, "USD", "us");
}

export function formatCurrencyForRegion(
  amount: number,
  currency: string,
  region: TaxRegion,
): string {
  const code = region === "eu" ? currency || "EUR" : "USD";
  return amount.toLocaleString(localeForRegion(region), {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
  });
}

function formatClockTime(date: Date, region: TaxRegion): string {
  return date.toLocaleTimeString(localeForRegion(region), {
    hour: "numeric",
    minute: "2-digit",
    hour12: region === "us",
  });
}

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/** Recent list: local calendar day + clock (Today / Yesterday / short date). */
export function formatReceiptTime(date: Date, region: TaxRegion = "us"): string {
  const now = new Date();
  const locale = localeForRegion(region);
  const time = formatClockTime(date, region);

  if (isSameLocalCalendarDay(date, now)) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameLocalCalendarDay(date, yesterday)) return `Yesterday, ${time}`;

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Receipt detail: local date + time (`06/07/2026, 2:30 PM` US · `07/06/2026, 14:30` EU). */
export function formatReceiptDetailDateTime(
  date: Date,
  region: TaxRegion = "us",
): string {
  return new Intl.DateTimeFormat(localeForRegion(region), {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: region === "us",
  }).format(date);
}

/** Excel export date column in the user's IANA timezone. */
export function formatLocalDate(
  date: Date,
  timeZone = "UTC",
  region: TaxRegion = "us",
): string {
  return new Intl.DateTimeFormat(localeForRegion(region), {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Summary export timestamp in the user's IANA timezone. */
export function formatLocalDateTime(
  date: Date,
  timeZone = "UTC",
  region: TaxRegion = "us",
): string {
  return new Intl.DateTimeFormat(localeForRegion(region), {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: region === "us",
  }).format(date);
}
