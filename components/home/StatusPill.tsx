"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

type PillVariant = "analyzing" | "uploading" | "paused" | "done" | "none";

const COLOR: Record<Exclude<PillVariant, "none">, string> = {
  analyzing: homeVisual.status.analyzing,
  uploading: homeVisual.status.uploading,
  paused: homeVisual.status.paused,
  done: homeVisual.status.done,
};

export function StatusPill({
  variant,
  doneLabel,
}: {
  variant: PillVariant;
  doneLabel?: string;
}) {
  const label = useUserCopy().home.receiptList.status;

  if (variant === "none") return null;
  if (variant === "done" && doneLabel) {
    return (
      <span className={`text-sm font-extrabold ${COLOR.done}`}>{doneLabel}</span>
    );
  }
  const key = variant as keyof typeof label;
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider ${COLOR[key]}`}
    >
      {label[key]}
    </span>
  );
}
