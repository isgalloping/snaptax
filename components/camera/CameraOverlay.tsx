"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  captureVideoFrame,
  getCameraErrorMessage,
  openCameraStream,
  stopCameraStream,
} from "@/lib/camera/capturePhoto";

interface CameraOverlayProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  onFallback: () => void;
}

export function CameraOverlay({
  onCapture,
  onClose,
  onFallback,
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

  const startStream = useCallback(async () => {
    setError(null);
    setReady(false);
    stopStream();

    try {
      const stream = await openCameraStream();
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stopCameraStream(stream);
        return;
      }

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      setReady(true);
    } catch (err) {
      setError(getCameraErrorMessage(err));
    }
  }, [stopStream]);

  useEffect(() => {
    void startStream();
    return () => stopStream();
  }, [startStream, stopStream]);

  const handleShutter = async () => {
    const video = videoRef.current;
    if (!video || !ready || capturing) return;

    setCapturing(true);
    try {
      const file = await captureVideoFrame(video);
      stopStream();
      onCapture(file);
    } catch {
      setError("拍照失败，请重试");
      setCapturing(false);
    }
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center p-4">
        <button
          type="button"
          onClick={handleClose}
          className="flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-black/60 px-4 text-sm font-black uppercase tracking-wider text-white backdrop-blur-sm transition-transform active:scale-95"
        >
          &lt; BACK
        </button>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {!error && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        )}

        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <p className="text-lg font-bold text-yellow-400">正在打开相机…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-6 px-8 text-center">
            <p className="text-lg font-bold text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => void startStream()}
              className="min-h-16 rounded-xl bg-yellow-500 px-8 py-4 text-lg font-black text-black active:scale-95"
            >
              重试
            </button>
            <button
              type="button"
              onClick={() => {
                stopStream();
                onFallback();
              }}
              className="min-h-16 text-sm font-bold text-zinc-400 active:scale-95"
            >
              从相册选择
            </button>
          </div>
        )}
      </div>

      {!error && (
        <footer className="flex justify-center pb-10 pt-6">
          <button
            type="button"
            onClick={() => void handleShutter()}
            disabled={!ready || capturing}
            aria-label="Take photo"
            className="flex h-24 w-24 items-center justify-center rounded-full border-8 border-white bg-yellow-500 transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="h-20 w-20 rounded-full border-4 border-black/20 bg-yellow-400" />
          </button>
        </footer>
      )}
    </div>
  );
}
