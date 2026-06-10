"use client";

import { useCallback, useEffect, useState } from "react";
import type { Receipt } from "@/lib/types";
import { sumLocalTaxSaved } from "@/lib/client/receiptApi";
import { top100ByUpdatedAt } from "@/lib/client/receiptSync";
import { withFreshBudget, isSyncStuck } from "@/lib/client/receiptSyncBudget";
import { ensureTaxRegionCandidate } from "@/lib/client/taxRegion";
import { utcNow } from "@/lib/time/utc";
import {
  loadReceipts,
  savePhoto,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import { sumDoneExpenses } from "@/lib/receipts/receiptStats";
import { TaxHeader } from "./TaxHeader";
import { SnapButton } from "./SnapButton";
import { ReceiptList } from "./ReceiptList";
import { logStartupMarks } from "@/lib/landing/startupMetrics";

function stuckIdsFromReceipts(receipts: StoredReceipt[]): Set<string> {
  return new Set(receipts.filter(isSyncStuck).map((r) => r.id));
}

export function OfflineHomeShell() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [taxSaved, setTaxSaved] = useState<number | null>(null);
  const [syncStuckIds, setSyncStuckIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    performance.mark("startup:offline-home");
    logStartupMarks();

    void (async () => {
      ensureTaxRegionCandidate();
      const stored = await loadReceipts();
      const visible = top100ByUpdatedAt(stored);
      setSyncStuckIds(stuckIdsFromReceipts(stored));
      setReceipts(visible);
      setTaxSaved(sumLocalTaxSaved(visible));
    })();
  }, []);

  const handleCapture = useCallback(async (file: File) => {
    const id = crypto.randomUUID();
    const snapAt = utcNow();
    const processingReceipt: StoredReceipt = withFreshBudget({
      id,
      status: "processing",
      merchant: "Scanning",
      timestamp: snapAt,
      updatedAt: snapAt,
      pendingUpload: true,
    });

    await savePhoto(id, file);
    await saveReceipt(processingReceipt);

    setReceipts((prev) => {
      const next = top100ByUpdatedAt([processingReceipt, ...prev]);
      setTaxSaved(sumLocalTaxSaved(next));
      return next;
    });
  }, []);

  const noopAsync = useCallback(async () => {}, []);
  const noopBatchShot = useCallback(async () => crypto.randomUUID(), []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-black font-sans text-white select-none">
      <TaxHeader
        taxSaved={taxSaved}
        totalExpenses={sumDoneExpenses(receipts)}
        receiptCount={receipts.length}
        animating={false}
        onSettingsClick={() => {}}
        showSettings={false}
      />

      <div className="shrink-0 px-4 py-2">
        <SnapButton
          onCapture={handleCapture}
          onBatchShot={noopBatchShot}
          onBatchDone={noopAsync}
          onBatchClose={noopAsync}
          onReviewDelete={noopAsync}
          syncDisabled
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ReceiptList
          receipts={receipts}
          syncStuckIds={syncStuckIds}
          onSelect={() => {}}
          onResnap={() => {}}
          onRetrySync={() => {}}
          syncDisabled
        />
      </div>
    </div>
  );
}
