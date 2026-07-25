"use client";

import { useCallback, useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { detectExportPlatform } from "@/lib/export/detectExportPlatform";
import {
  shareTaxPackFile,
  type ShareTaxPackResult,
} from "@/lib/export/shareTaxPack";
import { PostDownloadPlatformIllustration } from "@/components/export/PostDownloadPlatformIllustration";

interface PostDownloadGuideProps {
  fileName: string;
  file?: File | null;
  shareTitle?: string;
  shareText?: string;
  showShare?: boolean;
  onDismiss: () => void;
}

type ShareFeedbackTone = "success" | "error" | "neutral";

export function PostDownloadGuide({
  fileName,
  file,
  shareTitle = "SnapTax Export",
  shareText = "",
  showShare = true,
  onDismiss,
}: PostDownloadGuideProps) {
  const copy = useUserCopy().exportEngine.postDownloadGuide;
  const platform = detectExportPlatform();
  const steps =
    platform === "android-chrome"
      ? copy.steps.androidChrome
      : platform === "ios-safari"
        ? copy.steps.iosSafari
        : platform === "desktop-chrome"
          ? copy.steps.desktopChrome
          : copy.steps.other;

  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<{
    tone: ShareFeedbackTone;
    message: string;
  } | null>(null);
  const [sharing, setSharing] = useState(false);

  const shareAvailable = Boolean(
    file && showShare && typeof navigator !== "undefined" && navigator.share,
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fileName);
      setCopyStatus(copy.copySuccess);
      window.setTimeout(() => setCopyStatus(null), 3000);
    } catch {
      setCopyStatus(copy.copyFailed);
    }
  }, [copy.copyFailed, copy.copySuccess, fileName]);

  const handleShare = useCallback(async () => {
    if (!file || !shareAvailable) return;
    setSharing(true);
    setShareFeedback(null);
    try {
      const result: ShareTaxPackResult = await shareTaxPackFile(
        file,
        shareTitle,
        shareText,
      );
      if (result === "shared") {
        setShareFeedback({ tone: "success", message: copy.sendSuccess });
      } else if (result === "cancelled") {
        setShareFeedback(null);
      } else if (result === "unsupported") {
        setShareFeedback({ tone: "neutral", message: copy.sendUnsupported });
      } else {
        setShareFeedback({ tone: "error", message: copy.sendFailed });
      }
    } finally {
      setSharing(false);
    }
  }, [
    copy.sendFailed,
    copy.sendSuccess,
    copy.sendUnsupported,
    file,
    shareAvailable,
    shareText,
    shareTitle,
  ]);

  return (
    <section
      className="mb-4 rounded-xl border-2 border-yellow-500 bg-zinc-900 p-4 text-left"
      aria-label={copy.title}
    >
      <p className="text-xs font-black uppercase tracking-wider text-yellow-400">
        {copy.title}
      </p>

      <div className="mt-3">
        <PostDownloadPlatformIllustration platform={platform} />
      </div>

      <ol className="mt-4 space-y-2 text-sm leading-snug text-zinc-300">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-3">
        <p className="break-all text-sm font-bold text-white">{fileName}</p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="mt-2 min-h-12 rounded-lg border-2 border-zinc-600 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-transform active:scale-95"
        >
          {copy.copyButton}
        </button>
        {copyStatus && (
          <p className="mt-2 text-xs font-bold text-yellow-400" role="status">
            {copyStatus}
          </p>
        )}
        <p className="mt-2 text-xs text-zinc-500">{copy.searchTip}</p>
      </div>

      {showShare && (
        <>
          <button
            type="button"
            disabled={sharing || !shareAvailable}
            onClick={() => void handleShare()}
            className="mt-4 w-full min-h-14 rounded-xl border-2 border-zinc-600 bg-zinc-800 py-3 text-sm font-black uppercase tracking-wider text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copy.sendToApp}
          </button>
          {shareFeedback && (
            <p
              className={`mt-2 text-center text-xs font-bold ${
                shareFeedback.tone === "success"
                  ? "text-green-400"
                  : shareFeedback.tone === "error"
                    ? "text-amber-400"
                    : "text-zinc-400"
              }`}
              role="status"
            >
              {shareFeedback.message}
            </p>
          )}
        </>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 w-full min-h-14 rounded-xl border-2 border-zinc-600 py-3 text-sm font-black uppercase tracking-wider text-zinc-300 transition-transform active:scale-95"
      >
        {copy.gotIt}
      </button>
    </section>
  );
}
