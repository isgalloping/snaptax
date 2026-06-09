"use client";

import { BatchCountBadge } from "@/components/camera/BatchCountBadge";
import { CameraShutterControl } from "@/components/camera/CameraShutterControl";
import { FlashDoneButton } from "@/components/camera/FlashDoneButton";
import { ReviewDoneButton } from "@/components/camera/ReviewDoneButton";

interface CameraLiveFooterProps {
  batchCount: number;
  latestThumbUrl?: string;
  latestId?: string;
  ready: boolean;
  capturing: boolean;
  showDualDone: boolean;
  onBatchPreviewEnter?: (id: string) => void;
  onShutter: () => void;
  onFlashDone?: () => void;
  onFinishCapture?: () => void;
}

export function CameraLiveFooter({
  batchCount,
  latestThumbUrl,
  latestId,
  ready,
  capturing,
  showDualDone,
  onBatchPreviewEnter,
  onShutter,
  onFlashDone,
  onFinishCapture,
}: CameraLiveFooterProps) {
  const doneDisabled = batchCount === 0;

  return (
    <div className="flex items-end justify-between gap-1 px-3 pb-3 pt-2">
      <BatchCountBadge
        count={batchCount}
        latestThumbUrl={latestThumbUrl}
        latestId={latestId}
        onPress={
          batchCount > 0 && onBatchPreviewEnter ? onBatchPreviewEnter : undefined
        }
      />

      <CameraShutterControl
        ready={ready}
        capturing={capturing}
        onClick={onShutter}
      />

      {showDualDone ? (
        <>
          <FlashDoneButton
            disabled={doneDisabled}
            onClick={() => onFlashDone?.()}
          />
          <ReviewDoneButton
            disabled={doneDisabled}
            onClick={() => onFinishCapture?.()}
          />
        </>
      ) : (
        <div className="h-14 w-[8.75rem] shrink-0" aria-hidden />
      )}
    </div>
  );
}
