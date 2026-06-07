"use client";

import type { Receipt } from "@/lib/types";
import { formatCurrency, formatReceiptTime } from "@/lib/format";

interface ReceiptCardProps {
  receipt: Receipt;
  onSelect: (receipt: Receipt) => void;
}

function receiptListSubtitle(receipt: Receipt, contextLabel: string): string {
  return `${formatReceiptTime(receipt.timestamp, receipt.dataRegion ?? "us")} · ${contextLabel}`;
}

export function ReceiptCard({ receipt, onSelect }: ReceiptCardProps) {
  if (receipt.status === "processing") {
    return (
      <button
        type="button"
        onClick={() => onSelect(receipt)}
        className="flex w-full items-center justify-between rounded-xl border-l-4 border-yellow-500 bg-zinc-800 p-4 text-left transition-transform active:scale-[0.98]"
      >
        <div>
          <p className="text-lg font-extrabold text-yellow-500">Processing...</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {receiptListSubtitle(receipt, receipt.merchant ?? "Scanning")}
          </p>
        </div>
        <span className="rounded border border-yellow-800 bg-yellow-950 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-yellow-400">
          Uploading
        </span>
      </button>
    );
  }

  if (receipt.status === "blurry") {
    return (
      <button
        type="button"
        onClick={() => onSelect(receipt)}
        className="flex w-full items-center justify-between rounded-xl border-l-4 border-red-500 bg-zinc-800 p-4 text-left transition-transform active:scale-[0.98]"
      >
        <div>
          <p className="text-lg font-extrabold text-red-500">
            Receipt blurry. Tap to resnap
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {receiptListSubtitle(receipt, "Tap for details")}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(receipt)}
      className="flex w-full items-center justify-between rounded-xl border-l-4 border-zinc-600 bg-zinc-800 p-4 text-left transition-transform active:scale-[0.98]"
    >
      <div>
        <p className="text-lg font-extrabold text-white">
          {formatCurrency(receipt.amount ?? 0)}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">
          {receiptListSubtitle(receipt, receipt.merchant ?? "—")}
        </p>
      </div>
      <span className="rounded bg-white px-3 py-1 text-sm font-black uppercase tracking-wide text-black">
        {receipt.category}
      </span>
    </button>
  );
}
