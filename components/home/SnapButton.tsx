"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CameraIcon } from "@/components/icons/CameraIcon";
import { CameraOverlay } from "@/components/camera/CameraOverlay";
import { ComplianceFootnote } from "@/components/legal/ComplianceFootnote";
import { LegalSheet } from "@/components/legal/LegalSheet";
import { isCameraSupported, openCameraStream } from "@/lib/camera/capturePhoto";
import type { LegalDoc } from "@/lib/legal/content";

interface SnapButtonProps {
  onCapture: (file: File) => void;
  resnapId?: string | null;
}

export interface SnapButtonHandle {
  openCamera: () => void;
}

export const SnapButton = forwardRef<SnapButtonHandle, SnapButtonProps>(
  function SnapButton({ onCapture, resnapId }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const streamPromiseRef = useRef<Promise<MediaStream> | null>(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);

    const openCamera = useCallback(() => {
      if (isCameraSupported()) {
        streamPromiseRef.current = openCameraStream();
        setCameraOpen(true);
      } else {
        inputRef.current?.click();
      }
    }, []);

    useImperativeHandle(ref, () => ({ openCamera }), [openCamera]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onCapture(file);
      e.target.value = "";
    };

    const handleCapture = (file: File) => {
      setCameraOpen(false);
      streamPromiseRef.current = null;
      onCapture(file);
    };

    const handleClose = () => {
      setCameraOpen(false);
      streamPromiseRef.current = null;
    };

    return (
      <>
        <main className="flex shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={openCamera}
            className="flex h-56 w-56 cursor-pointer flex-col items-center justify-center rounded-full border-8 border-white bg-yellow-500 text-black shadow-2xl transition-all active:scale-95 active:bg-yellow-400"
          >
            <CameraIcon className="h-14 w-14 stroke-[2.5]" />
            <span className="mt-3 text-2xl font-black uppercase tracking-wider">
              Snap
            </span>
            {resnapId && (
              <span className="mt-1 text-xs font-bold opacity-80">Resnap</span>
            )}
          </button>

          <ComplianceFootnote
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
