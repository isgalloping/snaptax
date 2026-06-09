"use client";

import { homeVisual } from "@/lib/ui/homeVisual";
import type { BatchThumb } from "@/lib/camera/batchSession";

interface BatchGalleryStripProps {
  thumbs: BatchThumb[];
  selectedId?: string;
  latestId?: string;
  acceptedIds?: ReadonlySet<string>;
  onSelect?: (id: string) => void;
}

export function BatchGalleryStrip({
  thumbs,
  selectedId,
  latestId,
  acceptedIds,
  onSelect,
}: BatchGalleryStripProps) {
  if (thumbs.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto px-4 pb-2 pt-1">
      <div className="flex gap-2">
        {thumbs.map((thumb) => {
          const isLatest = latestId != null && thumb.id === latestId;
          const selected = thumb.id === selectedId && !isLatest;
          const accepted = acceptedIds?.has(thumb.id) ?? false;
          const ringClass = isLatest
            ? homeVisual.snapCamera.galleryLatest
            : selected
              ? homeVisual.snapCamera.gallerySelected
              : accepted
                ? "opacity-60 ring-1 ring-green-500/70"
                : "opacity-90";
          return (
            <button
              key={thumb.id}
              type="button"
              onClick={() => onSelect?.(thumb.id)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ${ringClass}`}
              aria-label={
                isLatest
                  ? "Latest receipt photo"
                  : selected
                    ? "Selected receipt photo"
                    : accepted
                      ? "Accepted receipt photo"
                      : "Receipt photo"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb.url}
                alt=""
                className="h-full w-full object-cover"
              />
              {accepted && (
                <span
                  className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-black text-white"
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
