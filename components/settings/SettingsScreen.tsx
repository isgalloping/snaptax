"use client";

import { useState } from "react";
import type { Industry } from "@/lib/types";
import { INDUSTRIES } from "@/lib/types";

import { PrivacyDataSection } from "@/components/settings/PrivacyDataSection";

interface SettingsScreenProps {
  industry: Industry | null;
  onIndustryChange: (industry: Industry) => void;
  onBack: () => void;
  onLocalDataCleared?: () => void;
}

export function SettingsScreen({
  industry,
  onIndustryChange,
  onBack,
  onLocalDataCleared,
}: SettingsScreenProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [paid, setPaid] = useState(false);

  const handleExport = () => {
    setShowPaywall(true);
  };

  const handlePay = () => {
    setPaid(true);
    setShowPaywall(false);
    if (navigator.share) {
      void navigator.share({
        title: "Snap1099 Tax Pack 2026",
        text: "Your IRS-ready expense export",
      }).catch(() => {});
    }
  };

  return (
    <div className="flex h-full flex-col bg-black text-white">
      <header className="flex items-center border-b-4 border-yellow-500 bg-zinc-900 p-4">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider transition-transform active:scale-95"
        >
          &lt; BACK
        </button>
        <h1 className="ml-4 text-lg font-black uppercase tracking-wider">
          Settings
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            Your Industry
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {INDUSTRIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onIndustryChange(item.id)}
                className={`min-h-16 rounded-xl border-2 p-4 text-left text-sm font-bold transition-transform active:scale-95 ${
                  industry === item.id
                    ? "border-yellow-500 bg-yellow-950 text-yellow-400"
                    : "border-zinc-600 bg-zinc-800 text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <PrivacyDataSection onLocalDataCleared={onLocalDataCleared} />

        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            Tax Season Export
          </h2>
          <button
            type="button"
            onClick={handleExport}
            disabled={paid}
            className="w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
          >
            {paid ? "Exported ✓" : "Export IRS Tax Pack"}
          </button>
          {paid && (
            <p className="mt-3 text-center text-sm text-green-400">
              2026 报税包已就绪，可通过分享发送给 CPA
            </p>
          )}
        </section>
      </div>

      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70">
          <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
            <p className="text-4xl font-black text-white">$49.00</p>
            <p className="mt-1 text-sm text-zinc-400">
              One-Time for 2026 Tax Season / 一次性付清
            </p>
            <p className="mt-4 text-base leading-relaxed text-zinc-300">
              一键导出符合美国国税局标准的 Excel 表格，直接发给你的 CPA
              会计或者导入 TurboTax，帮你省去几小时的对账麻烦。
            </p>
            <button
              type="button"
              onClick={handlePay}
              className="mt-6 w-full min-h-16 rounded-xl bg-white py-4 text-lg font-black text-black transition-transform active:scale-95"
            >
              Pay with Apple Pay / Google Pay
            </button>
            <button
              type="button"
              onClick={() => setShowPaywall(false)}
              className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
            >
              稍后再说
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
