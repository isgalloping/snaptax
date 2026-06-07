"use client";

import { useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import { countByStatus } from "@/lib/receipts/receiptStats";
import { ReceiptFilterBar, type ReceiptFilter } from "./ReceiptFilterBar";
import { ReceiptListCard } from "./ReceiptListCard";

interface ReceiptListProps {
  receipts: Receipt[];
  onSelect: (receipt: Receipt) => void;
  onResnap: (id: string) => void;
}

function filterReceipts(receipts: Receipt[], filter: ReceiptFilter): Receipt[] {
  if (filter === "all") return receipts;
  return receipts.filter((r) => r.status === filter);
}

export function ReceiptList({ receipts, onSelect, onResnap }: ReceiptListProps) {
  const [filter, setFilter] = useState<ReceiptFilter>("all");
  const counts = useMemo(() => countByStatus(receipts), [receipts]);
  const visible = useMemo(
    () => filterReceipts(receipts, filter),
    [receipts, filter],
  );

  return (
    <footer className="flex min-h-0 flex-1 flex-col rounded-t-3xl border-t-2 border-zinc-800 bg-zinc-900 p-6">
      <ReceiptFilterBar counts={counts} active={filter} onChange={setFilter} />

      <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
        All Local Receipts
      </h2>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            {receipts.length === 0
              ? "Snap your first receipt to get started"
              : "No receipts in this filter"}
          </p>
        ) : (
          visible.map((receipt) => (
            <ReceiptListCard
              key={receipt.id}
              receipt={receipt}
              onSelect={onSelect}
              onResnap={onResnap}
            />
          ))
        )}
      </div>
    </footer>
  );
}
