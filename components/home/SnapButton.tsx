"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CameraIcon } from "@/components/icons/CameraIcon";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { homeVisual } from "@/lib/ui/homeVisual";
import {
  CameraOverlay,
  type CameraPhase,
} from "@/components/camera/CameraOverlay";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { ComplianceFootnote } from "@/components/legal/ComplianceFootnote";
import { LegalSheet } from "@/components/legal/LegalSheet";
import {
  isReviewComplete,
  nextUnreviewedId,
  unreviewedIds,
} from "@/lib/camera/batchReviewQueue";
import {
  createBatchThumb,
  revokeBatchThumb,
  revokeBatchThumbs,
  type BatchThumb,
} from "@/lib/camera/batchSession";
import { isCameraSupported, openCameraStream } from "@/lib/camera/capturePhoto";
import type { LegalDoc } from "@/lib/legal/content";

interface SnapButtonProps {
  onCapture: (file: File) => void;
  onBatchShot: (file: File) => Promise<string>;
  onBatchDone: (sessionIds: string[]) => Promise<void>;
  onBatchClose: (sessionIds: string[]) => Promise<void>;
  onReviewDelete: (id: string) => Promise<void>;
  resnapId?: string | null;
  onCameraOpenChange?: (open: boolean) => void;
  onSyncClick?: () => void;
  onSettingsClick?: () => void;
  syncing?: boolean;
  syncDisabled?: boolean;
  onSnapIntent?: () => boolean;
}

export interface SnapButtonHandle {
  openCamera: () => void;
}

export const SnapButton = forwardRef<SnapButtonHandle, SnapButtonProps>(
  function SnapButton(
    {
      onCapture,
      onBatchShot,
      onBatchDone,
      onBatchClose,
      onReviewDelete,
      resnapId,
      onCameraOpenChange,
      onSyncClick,
      onSettingsClick,
      syncing = false,
      syncDisabled = false,
      onSnapIntent,
    },
    ref,
  ) {
    const copy = useUserCopy();
    const inputRef = useRef<HTMLInputElement>(null);
    const streamPromiseRef = useRef<Promise<MediaStream> | null>(null);
    const sessionIdsRef = useRef<string[]>([]);
    const resnapSlotIndexRef = useRef<number | null>(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
    const [sessionThumbs, setSessionThumbs] = useState<BatchThumb[]>([]);
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [phase, setPhase] = useState<CameraPhase>("live");
    const [reviewId, setReviewId] = useState<string | undefined>();
    const [acceptedIds, setAcceptedIds] = useState<Set<string>>(() => new Set());

    const isBatchMode = !resnapId;

    const resetSession = useCallback(() => {
      setSessionThumbs((prev) => {
        revokeBatchThumbs(prev);
        return [];
      });
      sessionIdsRef.current = [];
      resnapSlotIndexRef.current = null;
      setSelectedId(undefined);
      setPhase("live");
      setReviewId(undefined);
      setAcceptedIds(new Set());
    }, []);

    const setCamera = useCallback(
      (open: boolean) => {
        setCameraOpen(open);
        onCameraOpenChange?.(open);
      },
      [onCameraOpenChange],
    );

    const openCamera = useCallback(() => {
      if (onSnapIntent && !onSnapIntent()) return;
      if (isCameraSupported()) {
        resetSession();
        streamPromiseRef.current = openCameraStream();
        setCamera(true);
      } else {
        inputRef.current?.click();
      }
    }, [onSnapIntent, resetSession, setCamera]);

    useImperativeHandle(ref, () => ({ openCamera }), [openCamera]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onCapture(file);
      e.target.value = "";
    };

    const removeFromSession = useCallback((id: string) => {
      setSessionThumbs((prev) => {
        const thumb = prev.find((t) => t.id === id);
        if (thumb) revokeBatchThumb(thumb);
        return prev.filter((t) => t.id !== id);
      });
      sessionIdsRef.current = sessionIdsRef.current.filter((sid) => sid !== id);
      const remaining = sessionIdsRef.current;
      setSelectedId(remaining[remaining.length - 1]);
    }, []);

    const finishSession = useCallback(async () => {
      const ids = [...sessionIdsRef.current];
      resetSession();
      streamPromiseRef.current = null;
      setCamera(false);
      await onBatchDone(ids);
    }, [onBatchDone, resetSession, setCamera]);

    const advanceAfterReviewAction = useCallback(
      async (removedId: string, nextAccepted: Set<string>) => {
        setAcceptedIds(nextAccepted);
        if (isReviewComplete(sessionIdsRef.current, nextAccepted)) {
          await finishSession();
          return;
        }
        const nextId = nextUnreviewedId(
          sessionIdsRef.current,
          nextAccepted,
          removedId,
        );
        setReviewId(nextId);
        setSelectedId(nextId);
      },
      [finishSession],
    );

    const handleBatchShot = async (file: File) => {
      const id = await onBatchShot(file);
      const slot = resnapSlotIndexRef.current;

      if (slot !== null) {
        sessionIdsRef.current = [
          ...sessionIdsRef.current.slice(0, slot),
          id,
          ...sessionIdsRef.current.slice(slot),
        ];
        resnapSlotIndexRef.current = null;
        const thumb = createBatchThumb(id, file);
        setSessionThumbs((prev) => [
          ...prev.slice(0, slot),
          thumb,
          ...prev.slice(slot),
        ]);
        setPhase("postReview");
        setReviewId(id);
        setSelectedId(id);
        return;
      }

      sessionIdsRef.current = [...sessionIdsRef.current, id];
      const thumb = createBatchThumb(id, file);
      setSessionThumbs((prev) => [...prev, thumb]);
      setSelectedId(id);
    };

    const handleSingleShot = (file: File) => {
      streamPromiseRef.current = null;
      onCapture(file);
    };

    const handleFlashDone = async () => {
      if (sessionIdsRef.current.length === 0) return;
      await finishSession();
    };

    const handleBatchPreviewEnter = (_id: string) => {
      const id =
        selectedId ?? sessionIdsRef.current[sessionIdsRef.current.length - 1];
      if (!id) return;
      setPhase("batchPreview");
      setReviewId(id);
      setSelectedId(id);
    };

    const handleBatchPreviewBack = () => {
      setPhase("live");
      setReviewId(undefined);
    };

    const handlePreviewSelect = (id: string) => {
      setReviewId(id);
      setSelectedId(id);
    };

    const handleFinishCapture = async () => {
      if (sessionIdsRef.current.length === 0) return;

      if (isReviewComplete(sessionIdsRef.current, acceptedIds)) {
        await finishSession();
        return;
      }

      const first = unreviewedIds(sessionIdsRef.current, acceptedIds)[0];
      if (!first) return;

      setPhase("postReview");
      setReviewId(first);
      setSelectedId(first);
    };

    const handleReviewDelete = async (id: string) => {
      await onReviewDelete(id);
      removeFromSession(id);
      const nextAccepted = new Set(acceptedIds);
      nextAccepted.delete(id);
      await advanceAfterReviewAction(id, nextAccepted);
    };

    const handleReviewResnap = async (id: string) => {
      const slot = sessionIdsRef.current.indexOf(id);
      await onReviewDelete(id);
      removeFromSession(id);
      const nextAccepted = new Set(acceptedIds);
      nextAccepted.delete(id);
      setAcceptedIds(nextAccepted);
      resnapSlotIndexRef.current =
        slot >= 0 ? slot : sessionIdsRef.current.length;
      setPhase("liveResnap");
      setReviewId(undefined);
    };

    const handleReviewAccept = async () => {
      if (!reviewId) return;
      const nextAccepted = new Set(acceptedIds).add(reviewId);
      await advanceAfterReviewAction(reviewId, nextAccepted);
    };

    const handleLiveGallerySelect = (id: string) => {
      setSelectedId(id);
    };

    const handlePostReviewBack = () => {
      setPhase("live");
      setReviewId(undefined);
    };

    const handleClose = async () => {
      const ids = [...sessionIdsRef.current];
      resetSession();
      streamPromiseRef.current = null;
      setCamera(false);
      await onBatchClose(ids);
    };

    const handleFallback = () => {
      streamPromiseRef.current = null;
      setCamera(false);
      inputRef.current?.click();
    };

    return (
      <>
        <main className="flex w-full shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={openCamera}
            className={`flex ${homeVisual.snap.height} ${homeVisual.snap.maxHeight} w-full cursor-pointer flex-row items-center justify-between rounded-2xl border-4 border-white bg-yellow-500 px-5 text-black shadow-xl transition-all active:scale-[0.99] active:bg-yellow-400`}
          >
            <CameraIcon className="h-10 w-10 shrink-0 stroke-[2.5]" />
            <div className="min-w-0 flex-1 px-3 text-left">
              <span className="block text-lg font-black uppercase tracking-wider">
                {copy.home.snapButton.title}
              </span>
              <span className="mt-0.5 block text-xs font-bold opacity-80">
                {resnapId
                  ? copy.home.snapButton.resnapSubtitle
                  : copy.home.snapButton.subtitle}
              </span>
            </div>
            <ChevronRightIcon className="h-6 w-6 shrink-0" />
          </button>

          <ComplianceFootnote
            className="mt-1.5 text-[10px] leading-tight"
            onOpenTerms={() => setLegalDoc("terms")}
            onOpenPrivacy={() => setLegalDoc("privacy")}
          />

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            aria-hidden
          />
        </main>

        {cameraOpen && streamPromiseRef.current && (
          <CameraOverlay
            mode={isBatchMode ? "batch" : "single"}
            initialStreamPromise={streamPromiseRef.current}
            sessionThumbs={sessionThumbs}
            selectedId={selectedId}
            acceptedIds={acceptedIds}
            phase={isBatchMode ? phase : "live"}
            reviewId={reviewId}
            onSelectThumb={
              isBatchMode
                ? phase === "postReview" || phase === "batchPreview"
                  ? handlePreviewSelect
                  : handleLiveGallerySelect
                : undefined
            }
            onReviewDelete={isBatchMode ? handleReviewDelete : undefined}
            onReviewResnap={isBatchMode ? handleReviewResnap : undefined}
            onReviewAccept={
              isBatchMode ? () => void handleReviewAccept() : undefined
            }
            onFinishCapture={
              isBatchMode ? () => void handleFinishCapture() : undefined
            }
            onFlashDone={isBatchMode ? () => void handleFlashDone() : undefined}
            onBatchPreviewEnter={
              isBatchMode ? handleBatchPreviewEnter : undefined
            }
            onBatchPreviewBack={
              isBatchMode ? handleBatchPreviewBack : undefined
            }
            onPostReviewBack={isBatchMode ? handlePostReviewBack : undefined}
            onShot={isBatchMode ? handleBatchShot : handleSingleShot}
            onClose={
              isBatchMode
                ? handleClose
                : () => {
                    streamPromiseRef.current = null;
                    setCamera(false);
                  }
            }
            onFallback={handleFallback}
            onSyncClick={onSyncClick}
            onSettingsClick={
              onSettingsClick
                ? () => {
                    void handleClose().then(() => onSettingsClick());
                  }
                : undefined
            }
            syncing={syncing}
            syncDisabled={syncDisabled}
            onOpenTerms={() => setLegalDoc("terms")}
            onOpenPrivacy={() => setLegalDoc("privacy")}
          />
        )}

        <LegalSheet doc={legalDoc} onClose={() => setLegalDoc(null)} />
      </>
    );
  },
);
