const MS_PER_DAY = 86_400_000;

function filingDeadlineUtc(season: string): Date {
  const year = Number(season);
  return new Date(Date.UTC(year, 3, 15, 0, 0, 0));
}

export function daysUntilFilingDeadline(
  season: string,
  now: Date = new Date(),
): number {
  const deadline = filingDeadlineUtc(season);
  return Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_DAY);
}

export function isWithinFinalTaxPackWindow(
  season: string,
  now: Date = new Date(),
): boolean {
  const days = daysUntilFilingDeadline(season, now);
  return days >= 0 && days <= 7;
}
