"use client";

import { useEffect } from "react";
import type { Receipt } from "@/lib/types";
import { useUserCopy } from "@/components/i18n/I18nProvider";

interface FirstReceiptCoachProps {
  receipt: Receipt;
  onComplete: () => void;
}

export function FirstReceiptCoach({ receipt, onComplete }: FirstReceiptCoachProps) {
  const copy = useUserCopy().onboarding.firstReceipt;

  const message =
    receipt.status === "done"
      ? copy.done
      : receipt.status === "blurry"
        ? copy.blurry
        : copy.processing;

  useEffect(() => {
    const timer = window.setTimeout(onComplete, 5000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="mb-2 border-l-4 border-yellow-500 bg-zinc-800/80 px-3 py-2">
      <p className="text-xs font-bold leading-snug text-zinc-100">{message}</p>
    </div>
  );
}
