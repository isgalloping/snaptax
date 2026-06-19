import { isWithinFinalTaxPackWindow } from "@/lib/settings/filingDeadline";

export type ExportCardState =
  | "final_deadline"
  | "anon"
  | "unpaid"
  | "paid_new"
  | "paid_exported";

export function resolveExportCardState(input: {
  isSignedIn: boolean;
  seasonPaid: boolean;
  currentSeason: string;
  hasSeasonExportDone: boolean;
  now?: Date;
}): ExportCardState {
  const now = input.now ?? new Date();
  if (
    input.isSignedIn &&
    input.seasonPaid &&
    isWithinFinalTaxPackWindow(input.currentSeason, now)
  ) {
    return "final_deadline";
  }
  if (!input.isSignedIn) return "anon";
  if (!input.seasonPaid) return "unpaid";
  if (!input.hasSeasonExportDone) return "paid_new";
  return "paid_exported";
}
