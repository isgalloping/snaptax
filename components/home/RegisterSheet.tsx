"use client";

import { useState } from "react";

interface RegisterSheetProps {
  onClose: () => void;
  onComplete: () => void;
}

export function RegisterSheet({ onClose, onComplete }: RegisterSheetProps) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const handleSendCode = () => {
    if (phone.replace(/\D/g, "").length >= 10) {
      setStep("code");
    }
  };

  const handleVerify = () => {
    if (code.length === 4) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">保存你的数据</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-16 min-w-16 text-2xl font-bold text-zinc-400 active:scale-95"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {step === "phone" ? (
          <>
            <label className="mb-2 block text-sm font-bold text-zinc-400">
              手机号
            </label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mb-4 w-full rounded-xl border-2 border-zinc-600 bg-black px-4 py-4 text-xl font-bold text-white outline-none focus:border-yellow-500"
            />
            <button
              type="button"
              onClick={handleSendCode}
              className="w-full min-h-16 rounded-xl bg-yellow-500 py-4 text-lg font-black text-black active:scale-95"
            >
              发送验证码
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              验证码已发送至 {phone}
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="mb-4 w-full rounded-xl border-2 border-zinc-600 bg-black px-4 py-4 text-center text-3xl font-black tracking-[0.5em] text-yellow-400 outline-none focus:border-yellow-500"
            />
            <button
              type="button"
              onClick={handleVerify}
              className="w-full min-h-16 rounded-xl bg-yellow-500 py-4 text-lg font-black text-black active:scale-95"
            >
              确认绑定
            </button>
          </>
        )}
      </div>
    </div>
  );
}
