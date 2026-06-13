"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;
const DOUBLE_TAP_MS = 300;

interface ReceiptImageZoomViewerProps {
  src: string;
  onClose: () => void;
}

type Point = { x: number; y: number };

function touchDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

export function ReceiptImageZoomViewer({
  src,
  onClose,
}: ReceiptImageZoomViewerProps) {
  const copy = useUserCopy().receiptDetail;
  const [scale, setScale] = useState(MIN_SCALE);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef(MIN_SCALE);
  const panStart = useRef<Point | null>(null);
  const panStartTranslate = useRef<Point>({ x: 0, y: 0 });
  const lastTapAt = useRef(0);
  const scaleRef = useRef(MIN_SCALE);
  const translateRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  const resetTransform = useCallback(() => {
    setScale(MIN_SCALE);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const bumpScale = useCallback((delta: number) => {
    setScale((prev) => {
      const next = clampScale(prev + delta);
      if (next <= MIN_SCALE) {
        setTranslate({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const toggleDoubleTapZoom = useCallback(() => {
    setScale((prev) => {
      if (prev > MIN_SCALE) {
        setTranslate({ x: 0, y: 0 });
        return MIN_SCALE;
      }
      return 2;
    });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const a = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
      const b = { x: e.touches[1]!.clientX, y: e.touches[1]!.clientY };
      pinchStartDistance.current = touchDistance(a, b);
      pinchStartScale.current = scaleRef.current;
      panStart.current = null;
      return;
    }

    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapAt.current < DOUBLE_TAP_MS) {
        toggleDoubleTapZoom();
        lastTapAt.current = 0;
        return;
      }
      lastTapAt.current = now;

      if (scaleRef.current > MIN_SCALE) {
        panStart.current = {
          x: e.touches[0]!.clientX,
          y: e.touches[0]!.clientY,
        };
        panStartTranslate.current = { ...translateRef.current };
      }
    }
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistance.current != null) {
        e.preventDefault();
        const a = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
        const b = { x: e.touches[1]!.clientX, y: e.touches[1]!.clientY };
        const distance = touchDistance(a, b);
        const ratio = distance / pinchStartDistance.current;
        const next = clampScale(pinchStartScale.current * ratio);
        setScale(next);
        if (next <= MIN_SCALE) {
          setTranslate({ x: 0, y: 0 });
        }
        return;
      }

      if (
        e.touches.length === 1 &&
        scaleRef.current > MIN_SCALE &&
        panStart.current != null
      ) {
        e.preventDefault();
        const touch = e.touches[0]!;
        const dx = touch.clientX - panStart.current.x;
        const dy = touch.clientY - panStart.current.y;
        setTranslate({
          x: panStartTranslate.current.x + dx,
          y: panStartTranslate.current.y + dy,
        });
      }
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  const handleTouchEnd = () => {
    pinchStartDistance.current = null;
    panStart.current = null;
    setScale((prev) => {
      if (prev <= MIN_SCALE) {
        setTranslate({ x: 0, y: 0 });
        return MIN_SCALE;
      }
      return prev;
    });
  };

  const handleDoubleClick = () => {
    toggleDoubleTapZoom();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black"
      role="dialog"
      aria-label={copy.zoomAria}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-black/80 text-2xl font-black text-white active:scale-95"
        aria-label={copy.close}
      >
        ×
      </button>

      <div
        ref={viewportRef}
        className="flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden px-4 pt-20 pb-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={copy.receiptAlt}
            className="max-h-[65vh] max-w-[92vw] select-none object-contain"
            draggable={false}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 px-6 pb-10 pt-2">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => bumpScale(-SCALE_STEP)}
            disabled={scale <= MIN_SCALE}
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-zinc-600 bg-zinc-900 text-3xl font-black text-white disabled:opacity-40 active:scale-95"
            aria-label={copy.zoomOut}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => bumpScale(SCALE_STEP)}
            disabled={scale >= MAX_SCALE}
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-zinc-600 bg-zinc-900 text-3xl font-black text-white disabled:opacity-40 active:scale-95"
            aria-label={copy.zoomIn}
          >
            +
          </button>
        </div>
        {scale > MIN_SCALE && (
          <button
            type="button"
            onClick={resetTransform}
            className="text-xs font-bold uppercase tracking-wider text-zinc-500 active:text-zinc-300"
          >
            {copy.resetZoom}
          </button>
        )}
      </div>
    </div>
  );
}
