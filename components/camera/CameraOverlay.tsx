"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BatchGalleryStrip } from "@/components/camera/BatchGalleryStrip";
import { CameraLiveFooter } from "@/components/camera/CameraLiveFooter";
import { CameraShutterControl } from "@/components/camera/CameraShutterControl";
import { ReceiptReviewControls } from "@/components/camera/ReceiptReviewControls";
import { ReceiptReviewViewport } from "@/components/camera/ReceiptReviewViewport";
import { RefreshIcon } from "@/components/icons/RefreshIcon";
import { SlidersIcon } from "@/components/icons/SlidersIcon";
import { ComplianceFootnote } from "@/components/legal/ComplianceFootnote";
import type { BatchThumb } from "@/lib/camera/batchSession";
import {
  attachStreamToVideo,
  captureVideoFrame,
  getCameraErrorMessage,
  openCameraStream,
  stopCameraStream,
} from "@/lib/camera/capturePhoto";
import { useTranslations } from "next-intl";
import { SHUTTER_COOLDOWN_MS } from "@/lib/camera/shutterCooldown";

export type CameraOverlayMode = "batch" | "single";
export type CameraPhase = "live" | "batchPreview" | "postReview" | "liveResnap";

interface CameraOverlayProps {
  mode: CameraOverlayMode;
  initialStreamPromise: Promise<MediaStream>;
  sessionThumbs: BatchThumb[];
  selectedId?: string;
  acceptedIds?: ReadonlySet<string>;
  phase?: CameraPhase;
  reviewId?: string;
  onSelectThumb?: (id: string) => void;
  onReviewDelete?: (id: string) => void | Promise<void>;
  onReviewResnap?: (id: string) => void | Promise<void>;
  onReviewAccept?: () => void;
  onFinishCapture?: () => void;
  onFlashDone?: () => void;
  onBatchPreviewEnter?: (id: string) => void;
  onBatchPreviewBack?: () => void;
  onPostReviewBack?: () => void;
  onShot: (file: File) => void | Promise<void>;
  onClose: () => void;
  onFallback: () => void;
  onSyncClick?: () => void;
  onSettingsClick?: () => void;
  syncing?: boolean;
  syncDisabled?: boolean;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export function CameraOverlay({
  mode,
  initialStreamPromise,
  sessionThumbs,
  selectedId,
  acceptedIds,
  phase = "live",
  reviewId,
  onSelectThumb,
  onReviewDelete,
  onReviewResnap,
  onReviewAccept,
  onFinishCapture,
  onFlashDone,
  onBatchPreviewEnter,
  onBatchPreviewBack,
  onPostReviewBack,
  onShot,
  onClose,
  onFallback,
  onSyncClick,
  onSettingsClick,
  syncing = false,
  syncDisabled = false,
  onOpenTerms,
  onOpenPrivacy,
}: CameraOverlayProps) {
  const t = useTranslations("Camera");
  const tHome = useTranslations("Home");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPostReview = mode === "batch" && phase === "postReview";
  const isBatchPreview = mode === "batch" && phase === "batchPreview";
  const isLiveResnap = mode === "batch" && phase === "liveResnap";
  const isLiveBatch = mode === "batch" && phase === "live";
  const showLiveControls = isLiveBatch || isLiveResnap;
  const hideVideo = isPostReview || isBatchPreview;

  const gallerySelectedId =
    isPostReview || isBatchPreview ? reviewId : selectedId;
  const reviewThumb = sessionThumbs.find((t) => t.id === reviewId);

  const stopStream = useCallback(() => {
    stopCameraStream(streamRef.current);
    streamRef.current = null;
    setReady(false);
  }, []);

  const startStream = useCallback(
    async (streamSource?: Promise<MediaStream>) => {
      setError(null);
      setReady(false);
      stopStream();

      try {
        const stream = await (streamSource ?? openCameraStream());
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) {
          stopCameraStream(stream);
          setError(t("openFailed"));
          return;
        }

        await attachStreamToVideo(video, stream);
        setReady(true);
      } catch (err) {
        stopStream();
        setError(getCameraErrorMessage(err, {
          notAllowed: t("errorNotAllowed"),
          notFound: t("errorNotFound"),
          notReadable: t("errorNotReadable"),
          default: t("errorDefault"),
        }));
      }
    },
    [stopStream, t],
  );

  useEffect(() => {
    void startStream(initialStreamPromise);
    return () => stopStream();
  }, [initialStreamPromise, startStream, stopStream]);

  const handleShutter = async () => {
    const video = videoRef.current;
    if (!video || !ready || capturing || hideVideo) return;

    setCapturing(true);
    try {
      const file = await captureVideoFrame(video);

      if (mode === "single") {
        stopStream();
        await onShot(file);
        onClose();
        return;
      }

      await onShot(file);
      window.setTimeout(() => setCapturing(false), SHUTTER_COOLDOWN_MS);
    } catch {
      setError(t("captureFailed"));
      setCapturing(false);
    }
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  const handleBack = () => {
    if (isBatchPreview) {
      onBatchPreviewBack?.();
      return;
    }
    if (isPostReview) {
      onPostReviewBack?.();
      return;
    }
    handleClose();
  };

  const runReviewAction = async (
    action: ((id: string) => void | Promise<void>) | undefined,
  ) => {
    if (!reviewId || !action || reviewBusy) return;
    setReviewBusy(true);
    try {
      await action(reviewId);
    } finally {
      setReviewBusy(false);
    }
  };

  const actionBtn =
    "flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-black/50 backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-40";

  const latestThumb = sessionThumbs[sessionThumbs.length - 1];
  const latestId = latestThumb?.id;
  const batchCount = sessionThumbs.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-xl border-2 border-zinc-600 bg-black/60 px-3 text-xs font-black uppercase tracking-wider text-white backdrop-blur-sm transition-transform active:scale-95"
        >
          {t("back")}
        </button>
        {mode === "batch" && (
          <div className="flex items-center gap-2">
            {onSyncClick && (
              <button
                type="button"
                onClick={onSyncClick}
                disabled={syncDisabled || syncing}
                className={actionBtn}
                aria-label={tHome("syncReceipts")}
              >
                <RefreshIcon
                  className={`h-5 w-5 text-white ${syncing ? "animate-spin" : ""}`}
                />
              </button>
            )}
            {onSettingsClick && (
              <button
                type="button"
                onClick={onSettingsClick}
                className={actionBtn}
                aria-label={tHome("settings")}
              >
                <SlidersIcon className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover ${error ? "hidden" : ""} ${hideVideo ? "invisible" : ""}`}
        />

        {(isPostReview || isBatchPreview) && reviewThumb && (
          <ReceiptReviewViewport imageUrl={reviewThumb.url} />
        )}

        {!ready && !error && !hideVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <p className="text-lg font-bold text-yellow-400">
              {t("opening")}
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black px-8 text-center">
            <p className="text-lg font-bold text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => void startStream()}
              className="min-h-16 rounded-xl bg-yellow-500 px-8 py-4 text-lg font-black text-black active:scale-95"
            >
              {t("retry")}
            </button>
            <button
              type="button"
              onClick={() => {
                stopStream();
                onFallback();
              }}
              className="min-h-16 text-sm font-bold text-zinc-400 active:scale-95"
            >
              {t("chooseGallery")}
            </button>
          </div>
        )}
      </div>

      {!error && (
        <footer className="relative z-10 shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent pb-6 pt-4">
          {isBatchPreview && (
            <BatchGalleryStrip
              thumbs={sessionThumbs}
              selectedId={gallerySelectedId}
              latestId={latestId}
              acceptedIds={acceptedIds}
              onSelect={onSelectThumb}
            />
          )}

          {isPostReview && (
            <>
              <ReceiptReviewControls
                busy={reviewBusy}
                onDelete={() => void runReviewAction(onReviewDelete)}
                onResnap={() => void runReviewAction(onReviewResnap)}
                onAccept={() => onReviewAccept?.()}
              />
              <BatchGalleryStrip
                thumbs={sessionThumbs}
                selectedId={gallerySelectedId}
                latestId={latestId}
                acceptedIds={acceptedIds}
                onSelect={onSelectThumb}
              />
            </>
          )}

          {showLiveControls && (
            <>
              <BatchGalleryStrip
                thumbs={sessionThumbs}
                selectedId={gallerySelectedId}
                latestId={latestId}
                acceptedIds={acceptedIds}
                onSelect={onSelectThumb}
              />
              <CameraLiveFooter
                batchCount={batchCount}
                latestId={latestId}
                ready={ready}
                capturing={capturing}
                showDualDone={isLiveBatch}
                onBatchPreviewEnter={onBatchPreviewEnter}
                onShutter={() => void handleShutter()}
                onFlashDone={onFlashDone}
                onFinishCapture={onFinishCapture}
              />
            </>
          )}

          {mode === "single" && (
            <div className="flex items-end justify-center gap-3 px-6 pb-3 pt-2">
              <CameraShutterControl
                ready={ready}
                capturing={capturing}
                onClick={() => void handleShutter()}
              />
            </div>
          )}

          {showLiveControls && onOpenTerms && onOpenPrivacy && (
            <ComplianceFootnote
              className="px-4 text-[10px] leading-tight"
              onOpenTerms={onOpenTerms}
              onOpenPrivacy={onOpenPrivacy}
            />
          )}
        </footer>
      )}
    </div>
  );
}
