"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon } from "@/components/icons/CameraIcon";
import { CameraOverlay } from "@/components/camera/CameraOverlay";
import { ComplianceFootnote } from "@/components/legal/ComplianceFootnote";
import { LegalSheet } from "@/components/legal/LegalSheet";
import { isCameraSupported } from "@/lib/camera/capturePhoto";
import type { LegalDoc } from "@/lib/legal/content";

interface SnapButtonProps {
  onCapture: (file: File) => void;
  resnapId?: string | null;
}

export function SnapButton({ onCapture, resnapId }: SnapButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);

  const openCamera = () => {
    if (isCameraSupported()) {
      setCameraOpen(true);
    } else {
      inputRef.current?.click();
    }
  };

  useEffect(() => {
    if (resnapId) {
      if (isCameraSupported()) {
        setCameraOpen(true);
      } else {
        inputRef.current?.click();
      }
    }
  }, [resnapId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    e.target.value = "";
  };

  const handleCapture = (file: File) => {
    setCameraOpen(false);
    onCapture(file);
  };

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <button
          type="button"
          onClick={openCamera}
          className="flex aspect-square w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-3xl border-8 border-white bg-yellow-500 text-black shadow-2xl transition-all active:scale-95 active:bg-yellow-400"
        >
          <CameraIcon className="h-24 w-24 stroke-[2.5]" />
          <span className="mt-4 text-2xl font-black uppercase tracking-wider">
            SNAP RECEIPT
          </span>
          <span className="mt-1 text-xs font-bold opacity-80">
            {resnapId ? "Resnap receipt" : "Auto-categorize on snap"}
          </span>
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

      {cameraOpen && (
        <CameraOverlay
          onCapture={handleCapture}
          onClose={() => setCameraOpen(false)}
          onFallback={() => {
            setCameraOpen(false);
            inputRef.current?.click();
          }}
        />
      )}

      <LegalSheet doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}
