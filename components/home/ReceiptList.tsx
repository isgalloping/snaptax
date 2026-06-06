"use client";

import { useEffect, useState } from "react";
import type { Receipt } from "@/lib/types";
import { ReceiptCard } from "./ReceiptCard";

interface ReceiptListProps {
  receipts: Receipt[];
  onResnap: (id: string) => void;
}

export function ReceiptList({ receipts, onResnap }: ReceiptListProps) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const visible = receipts.slice(0, 3);

  return (
    <footer className="flex max-h-[35vh] flex-col rounded-t-3xl border-t-2 border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Recent Receipts
        </h2>
        <span
          className={`flex items-center rounded-full px-2 py-1 text-xs font-bold ${
            online
              ? "bg-green-950 text-green-400"
              : "bg-yellow-950 text-yellow-400"
          }`}
        >
          <span
            className={`mr-1.5 h-2 w-2 rounded-full ${
              online ? "animate-pulse bg-green-400" : "bg-yellow-400"
            }`}
          />
          {online ? "Ready / Online" : "Offline · Queued"}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            Snap your first receipt to get started
          </p>
        ) : (
          visible.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onResnap={onResnap}
            />
          ))
        )}
      </div>
    </footer>
  );
}
