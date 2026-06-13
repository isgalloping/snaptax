"use client";

import { useState } from "react";
import type { Receipt } from "@/lib/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatCurrency } from "@/lib/format";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";
import {
  apiReceiptToLocal,
  patchReceiptCategory,
} from "@/lib/client/receiptApi";

interface ExportCategoryReviewProps {
  receipts: Receipt[];
  onReceiptUpdated: (receipt: Receipt) => void;
}

export function ExportCategoryReview({
  receipts,
  onReceiptUpdated,
}: ExportCategoryReviewProps) {
  const { copy } = useI18n();
  const t = copy.exportEngine;
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const handleCategoryChange = async (receipt: Receipt, category: string) => {
    if (receipt.category?.toUpperCase() === category) return;
    setSavingId(receipt.id);
    setErrorId(null);
    try {
      const updated = await patchReceiptCategory(receipt.id, category);
      onReceiptUpdated(apiReceiptToLocal(updated));
    } catch {
      setErrorId(receipt.id);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-zinc-400">{t.reviewHint}</p>
      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">
                {receipt.merchant || t.reviewUnknownMerchant}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {formatCurrency(Number(receipt.amount ?? 0))}
              </p>
            </div>
            {savingId === receipt.id && (
              <p className="text-xs font-bold text-yellow-400">{t.reviewSaving}</p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {US_EXPORT_CATEGORIES.map((category) => {
              const selected =
                (receipt.category ?? "OTHER").toUpperCase() === category;
              return (
                <button
                  key={category}
                  type="button"
                  disabled={savingId === receipt.id}
                  onClick={() => void handleCategoryChange(receipt, category)}
                  className={`min-h-10 rounded-lg border-2 px-3 py-2 text-xs font-black uppercase tracking-wide transition-transform active:scale-95 disabled:opacity-50 ${
                    selected
                      ? "border-yellow-500 bg-yellow-950 text-yellow-300"
                      : "border-zinc-600 bg-zinc-900 text-zinc-300"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          {errorId === receipt.id && (
            <p className="mt-2 text-xs font-bold text-red-500">{t.reviewSaveFailed}</p>
          )}
        </div>
      ))}
    </div>
  );
}
