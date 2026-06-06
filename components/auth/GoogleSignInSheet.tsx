"use client";

import { useState } from "react";

export type GoogleSignInMode = "soft" | "hard-export" | "hard-sync";

const COPY: Record<
  GoogleSignInMode,
  { title: string; body: string; showNotNow: boolean }
> = {
  soft: {
    title: "Save your receipts",
    body: "Sign in with Google to back up your receipts and tax data. Required before switching phones.",
    showNotNow: true,
  },
  "hard-export": {
    title: "Sign in to export",
    body: "Exporting your tax pack requires identity verification. Please sign in with Google.",
    showNotNow: false,
  },
  "hard-sync": {
    title: "View on all devices",
    body: "To sync across phone, tablet, or computer, sign in with Google.",
    showNotNow: false,
  },
};

interface GoogleSignInSheetProps {
  mode: GoogleSignInMode;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  onFailure?: (message: string) => void;
}

export function GoogleSignInSheet({
  mode,
  onClose,
  onSuccess,
  onFailure,
}: GoogleSignInSheetProps) {
  const [loading, setLoading] = useState(false);
  const copy = COPY[mode];

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await onSuccess();
    } catch {
      onFailure?.("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <p className="text-lg font-black uppercase tracking-wider text-white">
          {copy.title}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{copy.body}</p>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGoogle()}
          className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        {copy.showNotNow ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
          >
            Not now
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full min-h-16 py-3 text-sm font-black uppercase tracking-wider text-zinc-400 transition-transform active:scale-95"
          >
            &lt; BACK
          </button>
        )}
      </div>
    </div>
  );
}
