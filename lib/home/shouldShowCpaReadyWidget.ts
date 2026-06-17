import { nextEstimatedTaxDeadline } from "./computeTaxDeadline";
import { clientTimeZone } from "@/lib/time/timeZone";

/** Jan–Apr filing window (aligned with `currentTaxSeason` sell period). */
export function isFilingTaxSeason(
  now: Date,
  timeZone: string = clientTimeZone(),
): boolean {
  const month = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, month: "numeric" }).format(now),
  );
  return month >= 1 && month <= 4;
}

/** Within N calendar days before the next US estimated tax due date. */
export function isWithinEstimatedTaxDeadlineWindow(
  now: Date,
  daysBefore = 15,
  timeZone: string = clientTimeZone(),
): boolean {
  const deadline = nextEstimatedTaxDeadline(now, timeZone);
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
  return daysLeft >= 0 && daysLeft <= daysBefore;
}

export function shouldShowCpaReadyWidget(
  now: Date = new Date(),
  timeZone: string = clientTimeZone(),
): boolean {
  return (
    isFilingTaxSeason(now, timeZone) ||
    isWithinEstimatedTaxDeadlineWindow(now, 15, timeZone)
  );
}
