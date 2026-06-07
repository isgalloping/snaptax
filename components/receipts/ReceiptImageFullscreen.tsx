"use client";

interface ReceiptImageFullscreenProps {
  src: string;
  onClose: () => void;
}

export function ReceiptImageFullscreen({
  src,
  onClose,
}: ReceiptImageFullscreenProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
      role="dialog"
      aria-label="Receipt photo"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-black/80 text-2xl font-black text-white active:scale-95"
        aria-label="Close"
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Receipt"
        className="max-h-full max-w-full object-contain p-4"
        onClick={onClose}
      />
    </div>
  );
}
