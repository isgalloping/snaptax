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
import { isCameraSupported, openCameraStream } from "@/lib/camera/capturePhoto";
import type { LegalDoc } from "@/lib/legal/content";

interface SnapButtonProps {
  onCapture: (file: File) => void;
  resnapId?: string | null;
  onCameraOpenChange?: (open: boolean) => void;
}

export interface SnapButtonHandle {
  openCamera: () => void;
}

export const SnapButton = forwardRef<SnapButtonHandle, SnapButtonProps>(
  function SnapButton({ onCapture, resnapId, onCameraOpenChange }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const streamPromiseRef = useRef<Promise<MediaStream> | null>(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);

    const setCamera = useCallback(
      (open: boolean) => {
        setCameraOpen(open);
        onCameraOpenChange?.(open);
      },
      [onCameraOpenChange],
    );

    const openCamera = useCallback(() => {
      if (isCameraSupported()) {
        streamPromiseRef.current = openCameraStream();
        setCamera(true);
      } else {
        inputRef.current?.click();
      }
    }, [setCamera]);

    useImperativeHandle(ref, () => ({ openCamera }), [openCamera]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onCapture(file);
      e.target.value = "";
    };

    const handleCapture = (file: File) => {
      setCamera(false);
      streamPromiseRef.current = null;
      onCapture(file);
    };

    const handleClose = () => {
      setCamera(false);
      streamPromiseRef.current = null;
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
            initialStreamPromise={streamPromiseRef.current}
            onCapture={handleCapture}
            onClose={handleClose}
            onFallback={() => {
              handleClose();
              inputRef.current?.click();
            }}
          />
        )}

        <LegalSheet doc={legalDoc} onClose={() => setLegalDoc(null)} />
      </>
    );
  },
);
