"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type GoogleSignInMode = "soft" | "hard-export" | "hard-sync";

const TITLE_KEY: Record<GoogleSignInMode, string> = {
  soft: "softTitle",
  "hard-export": "hardExportTitle",
  "hard-sync": "hardSyncTitle",
};

const BODY_KEY: Record<GoogleSignInMode, string> = {
  soft: "softBody",
  "hard-export": "hardExportBody",
  "hard-sync": "hardSyncBody",
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
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");

  const [loading, setLoading] = useState(false);
  const showNotNow = mode === "soft";

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await onSuccess();
    } catch {
      onFailure?.(t("signInFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <p className="text-lg font-black uppercase tracking-wider text-white">
          {t(TITLE_KEY[mode])}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{t(BODY_KEY[mode])}</p>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleGoogle()}
          className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
        >
          {loading ? t("signingIn") : t("continueWithGoogle")}
        </button>

        {showNotNow ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
          >
            {tCommon("notNow")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full min-h-16 py-3 text-sm font-black uppercase tracking-wider text-zinc-400 transition-transform active:scale-95"
          >
            {"< "}{tCommon("back")}
          </button>
        )}
      </div>
    </div>
  );
}
