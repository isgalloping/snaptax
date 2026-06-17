"use client";

import { useMemo, useState, type ReactNode, type RefObject } from "react";
import type { Receipt } from "@/lib/types";
import { countByStatus } from "@/lib/receipts/receiptStats";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { RefreshIcon } from "@/components/icons/RefreshIcon";
import { ReceiptFilterBar, type ReceiptFilter } from "./ReceiptFilterBar";
import { ReceiptListCard } from "./ReceiptListCard";

interface ReceiptListProps {
  receipts: Receipt[];
  syncStuckIds: Set<string>;
  listHeader?: ReactNode;
  onSelect: (receipt: Receipt) => void;
  onResnap: (id: string) => void;
  onRetrySync: (id: string) => void;
  onSyncClick?: () => void;
  syncing?: boolean;
  syncDisabled?: boolean;
  ahaCoachActive?: boolean;
  onAhaCoachDismiss?: () => void;
  filterBarRef?: RefObject<HTMLDivElement | null>;
}

function filterReceipts(
  receipts: Receipt[],
  filter: ReceiptFilter,
  syncStuckIds: Set<string>,
): Receipt[] {
  if (filter === "stuck") {
    return receipts.filter((r) => syncStuckIds.has(r.id));
  }
  if (filter === "all") return receipts;
  return receipts.filter((r) => r.status === filter);
}

export function ReceiptList({
  receipts,
  syncStuckIds,
  listHeader,
  onSelect,
  onResnap,
  onRetrySync,
  onSyncClick,
  syncing = false,
  syncDisabled = false,
  ahaCoachActive = false,
  onAhaCoachDismiss,
  filterBarRef,
}: ReceiptListProps) {
  const copy = useUserCopy().home.receiptList;
  const [filter, setFilter] = useState<ReceiptFilter>("all");
  const counts = useMemo(() => countByStatus(receipts), [receipts]);
  const visible = useMemo(
    () => filterReceipts(receipts, filter, syncStuckIds),
    [receipts, filter, syncStuckIds],
  );

  return (
    <div className="rounded-t-3xl border-t-2 border-zinc-800 bg-zinc-900 px-4 pb-4 pt-3">
      <div ref={filterBarRef} className="scroll-mt-2 rounded-xl transition-shadow">
        <ReceiptFilterBar
          counts={counts}
          active={filter}
          stuckCount={syncStuckIds.size}
          onChange={setFilter}
        />
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          {copy.title}
        </h2>
        {onSyncClick && (
          <button
            type="button"
            onClick={onSyncClick}
            disabled={syncDisabled || syncing}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 disabled:opacity-40"
          >
            {copy.refresh}
            <RefreshIcon
              className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>

      <div className="space-y-1.5 pr-1">
        {listHeader}
        {visible.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            {receipts.length === 0
              ? copy.emptyFirst
              : copy.emptyFilter}
          </p>
        ) : (
          visible.map((receipt) => (
            <ReceiptListCard
              key={receipt.id}
              receipt={receipt}
              syncStuck={syncStuckIds.has(receipt.id)}
              ahaCoach={ahaCoachActive}
              onAhaCoachDismiss={onAhaCoachDismiss}
              onSelect={onSelect}
              onResnap={onResnap}
              onRetrySync={onRetrySync}
            />
          ))
        )}
      </div>
    </div>
  );
}
