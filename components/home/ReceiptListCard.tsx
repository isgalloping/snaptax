"use client";

import type { Receipt } from "@/lib/types";
import {
  formatCurrencyForRegion,
  formatLocalDate,
  formatReceiptTime,
} from "@/lib/format";
import { clientTimeZone } from "@/lib/time/timeZone";
import { irsScheduleLineBadge } from "@/lib/tax/irsScheduleLabel";

interface ReceiptListCardProps {
  receipt: Receipt;
  onSelect: (receipt: Receipt) => void;
  onResnap: (id: string) => void;
}

function listSubtitle(receipt: Receipt, contextLabel: string): string {
  return `${formatReceiptTime(receipt.timestamp, receipt.dataRegion ?? "us")} · ${contextLabel}`;
}

export function ReceiptListCard({
  receipt,
  onSelect,
  onResnap,
}: ReceiptListCardProps) {
  const region = receipt.dataRegion ?? "us";
  const currency = receipt.currency ?? (region === "eu" ? "EUR" : "USD");
  const timeZone = clientTimeZone();
  const listDate = formatLocalDate(receipt.timestamp, timeZone, region);

  if (receipt.status === "processing") {
    return (
      <button
        type="button"
        onClick={() => onSelect(receipt)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-left transition-transform active:scale-[0.98]"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-extrabold text-yellow-500">Uploading...</p>
          <span className="animate-pulse text-xs font-bold uppercase tracking-wider text-yellow-400">
            Analyzing
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          {listSubtitle(receipt, "Processing")}
        </p>
      </button>
    );
  }

  if (receipt.status === "blurry") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(receipt)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(receipt);
          }
        }}
        className="w-full cursor-pointer rounded-xl border border-red-900/50 bg-zinc-800 p-4 text-left transition-transform active:scale-[0.98]"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-extrabold text-red-500">Receipt Blurry</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResnap(receipt.id);
            }}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white active:scale-95"
          >
            Resnap
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          {listSubtitle(receipt, "Need Action")}
        </p>
      </div>
    );
  }

  const tax = receipt.taxAmount ?? 0;
  const deductible = receipt.deductible !== false && tax > 0;
  const taxLabel = deductible
    ? `-${formatCurrencyForRegion(tax, currency, region)}`
    : formatCurrencyForRegion(0, currency, region);
  const lineBadge = irsScheduleLineBadge(receipt.category);
  const categoryLabel = receipt.category ?? "OTHER";

  return (
    <button
      type="button"
      onClick={() => onSelect(receipt)}
      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-left transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-base font-extrabold text-white">
          {receipt.merchant ?? "Unknown merchant"}
        </p>
        <p
          className={`shrink-0 text-base font-extrabold ${
            deductible ? "text-green-400" : "text-zinc-500"
          }`}
        >
          {taxLabel}
        </p>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="truncate text-xs text-zinc-400">
          {listDate} · {categoryLabel}
        </p>
        <span className="shrink-0 rounded bg-zinc-700 px-2 py-0.5 text-xs font-bold text-zinc-200">
          {lineBadge}
        </span>
      </div>
    </button>
  );
}
