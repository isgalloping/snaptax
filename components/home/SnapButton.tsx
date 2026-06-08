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
import { CameraOverlay } from "@/components/camera/CameraOverlay";
import { ComplianceFootnote } from "@/components/legal/ComplianceFootnote";
import { LegalSheet } from "@/components/legal/LegalSheet";
import {
  createBatchThumb,
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
  resnapId?: string | null;
  onCameraOpenChange?: (open: boolean) => void;
  onSyncClick?: () => void;
  onSettingsClick?: () => void;
  syncing?: boolean;
  syncDisabled?: boolean;
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
      resnapId,
      onCameraOpenChange,
      onSyncClick,
      onSettingsClick,
      syncing = false,
      syncDisabled = false,
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const streamPromiseRef = useRef<Promise<MediaStream> | null>(null);
    const sessionIdsRef = useRef<string[]>([]);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
    const [sessionThumbs, setSessionThumbs] = useState<BatchThumb[]>([]);
    const [selectedId, setSelectedId] = useState<string | undefined>();

    const isBatchMode = !resnapId;

    const resetSession = useCallback(() => {
      setSessionThumbs((prev) => {
        revokeBatchThumbs(prev);
        return [];
      });
      sessionIdsRef.current = [];
      setSelectedId(undefined);
    }, []);

    const setCamera = useCallback(
      (open: boolean) => {
        setCameraOpen(open);
        onCameraOpenChange?.(open);
      },
      [onCameraOpenChange],
    );

    const openCamera = useCallback(() => {
      if (isCameraSupported()) {
        resetSession();
        streamPromiseRef.current = openCameraStream();
        setCamera(true);
      } else {
        inputRef.current?.click();
      }
    }, [resetSession, setCamera]);

    useImperativeHandle(ref, () => ({ openCamera }), [openCamera]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onCapture(file);
      e.target.value = "";
    };

    const handleBatchShot = async (file: File) => {
      const id = await onBatchShot(file);
      sessionIdsRef.current = [...sessionIdsRef.current, id];
      const thumb = createBatchThumb(id, file);
      setSessionThumbs((prev) => {
        const next = [...prev, thumb];
        return next;
      });
      setSelectedId(id);
    };

    const handleSingleShot = (file: File) => {
      streamPromiseRef.current = null;
      onCapture(file);
    };

    const handleDone = async () => {
      const ids = [...sessionIdsRef.current];
      resetSession();
      streamPromiseRef.current = null;
      setCamera(false);
      await onBatchDone(ids);
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
                Snap Receipt
              </span>
              <span className="mt-0.5 block text-xs font-bold opacity-80">
                {resnapId
                  ? "Resnap this receipt"
                  : "Take a photo of your receipt"}
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
            onSelectThumb={setSelectedId}
            onShot={isBatchMode ? handleBatchShot : handleSingleShot}
            onDone={isBatchMode ? handleDone : undefined}
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
