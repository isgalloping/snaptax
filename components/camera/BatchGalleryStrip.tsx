"use client";

import { homeVisual } from "@/lib/ui/homeVisual";
import type { BatchThumb } from "@/lib/camera/batchSession";

interface BatchGalleryStripProps {
  thumbs: BatchThumb[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function BatchGalleryStrip({
  thumbs,
  selectedId,
  onSelect,
}: BatchGalleryStripProps) {
  if (thumbs.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto px-4 pb-2 pt-1">
      <div className="flex gap-2">
        {thumbs.map((thumb) => {
          const selected = thumb.id === selectedId;
          return (
            <button
              key={thumb.id}
              type="button"
              onClick={() => onSelect?.(thumb.id)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ${
                selected ? homeVisual.snapCamera.gallerySelected : "opacity-90"
              }`}
              aria-label={selected ? "Selected receipt photo" : "Receipt photo"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
