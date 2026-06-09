"use client";

interface ReceiptReviewViewportProps {
  imageUrl: string;
}

export function ReceiptReviewViewport({ imageUrl }: ReceiptReviewViewportProps) {
  return (
    <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Receipt preview"
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}
