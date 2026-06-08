"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BatchCountBadge } from "@/components/camera/BatchCountBadge";
import { BatchGalleryStrip } from "@/components/camera/BatchGalleryStrip";
import { RefreshIcon } from "@/components/icons/RefreshIcon";
import { SlidersIcon } from "@/components/icons/SlidersIcon";
import { ComplianceFootnote } from "@/components/legal/ComplianceFootnote";
import { homeVisual } from "@/lib/ui/homeVisual";
import type { BatchThumb } from "@/lib/camera/batchSession";
import { USER_COPY } from "@/lib/copy/userFacing";
import {
  attachStreamToVideo,
  captureVideoFrame,
  getCameraErrorMessage,
  openCameraStream,
  stopCameraStream,
} from "@/lib/camera/capturePhoto";

const SHUTTER_COOLDOWN_MS = 1000;

export type CameraOverlayMode = "batch" | "single";

interface CameraOverlayProps {
  mode: CameraOverlayMode;
  initialStreamPromise: Promise<MediaStream>;
  sessionThumbs: BatchThumb[];
  selectedId?: string;
  onSelectThumb?: (id: string) => void;
  onShot: (file: File) => void | Promise<void>;
  onDone?: () => void | Promise<void>;
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
  onSelectThumb,
  onShot,
  onDone,
  onClose,
  onFallback,
  onSyncClick,
  onSettingsClick,
  syncing = false,
  syncDisabled = false,
  onOpenTerms,
  onOpenPrivacy,
}: CameraOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setError(USER_COPY.camera.openFailed);
          return;
        }

        await attachStreamToVideo(video, stream);
        setReady(true);
      } catch (err) {
        stopStream();
        setError(getCameraErrorMessage(err));
      }
    },
    [stopStream],
  );

  useEffect(() => {
    void startStream(initialStreamPromise);
    return () => stopStream();
  }, [initialStreamPromise, startStream, stopStream]);

  const handleShutter = async () => {
    const video = videoRef.current;
    if (!video || !ready || capturing) return;

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
      setError(USER_COPY.camera.captureFailed);
      setCapturing(false);
    }
  };

  const handleDone = () => {
    stopStream();
    void onDone?.();
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  const actionBtn =
    "flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-black/50 backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-40";

  const latestThumbUrl = sessionThumbs[sessionThumbs.length - 1]?.url;
  const batchCount = sessionThumbs.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
        <button
          type="button"
          onClick={handleClose}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-xl border-2 border-zinc-600 bg-black/60 px-3 text-xs font-black uppercase tracking-wider text-white backdrop-blur-sm transition-transform active:scale-95"
        >
          &lt; BACK
        </button>
        {mode === "batch" && (
          <div className="flex items-center gap-2">
            {onSyncClick && (
              <button
                type="button"
                onClick={onSyncClick}
                disabled={syncDisabled || syncing}
                className={actionBtn}
                aria-label="Sync receipts"
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
                aria-label="Settings"
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
          className={`h-full w-full object-cover ${error ? "hidden" : ""}`}
        />

        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <p className="text-lg font-bold text-yellow-400">
              {USER_COPY.camera.opening}
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
              {USER_COPY.camera.retry}
            </button>
            <button
              type="button"
              onClick={() => {
                stopStream();
                onFallback();
              }}
              className="min-h-16 text-sm font-bold text-zinc-400 active:scale-95"
            >
              {USER_COPY.camera.chooseGallery}
            </button>
          </div>
        )}
      </div>

      {!error && (
        <footer className="relative z-10 shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent pb-6 pt-4">
          {mode === "batch" && (
            <BatchGalleryStrip
              thumbs={sessionThumbs}
              selectedId={selectedId}
              onSelect={onSelectThumb}
            />
          )}

          <div className="flex items-end justify-between gap-3 px-6 pb-3 pt-2">
            {mode === "batch" ? (
              <BatchCountBadge
                count={batchCount}
                latestThumbUrl={latestThumbUrl}
              />
            ) : (
              <div className="h-16 w-16 shrink-0" aria-hidden />
            )}

            <button
              type="button"
              onClick={() => void handleShutter()}
              disabled={!ready || capturing}
              aria-label="Take photo"
              className={`flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full bg-zinc-950 ${homeVisual.snapCamera.shutterOuter} ${homeVisual.snapCamera.shutterRing} transition-transform active:scale-95 disabled:opacity-50`}
            >
              <span className="h-14 w-14 rounded-full border-4 border-zinc-800 bg-zinc-950" />
            </button>

            {mode === "batch" ? (
              <button
                type="button"
                onClick={handleDone}
                disabled={batchCount === 0}
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-green-500/50 bg-zinc-900/90 shadow-[0_0_16px_rgba(34,197,94,0.35)] transition-transform active:scale-95 disabled:opacity-40"
                aria-label="Done"
              >
                <span className="text-2xl font-black text-green-400">✓</span>
                <span className="text-[10px] font-bold uppercase text-white">
                  Done
                </span>
              </button>
            ) : (
              <div className="h-16 w-16 shrink-0" aria-hidden />
            )}
          </div>

          {mode === "batch" && onOpenTerms && onOpenPrivacy && (
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
