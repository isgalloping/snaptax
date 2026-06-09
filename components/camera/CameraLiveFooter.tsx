"use client";

import { BatchCountBadge } from "@/components/camera/BatchCountBadge";
import { CameraShutterControl } from "@/components/camera/CameraShutterControl";
import { FlashDoneButton } from "@/components/camera/FlashDoneButton";
import { FooterActionTile } from "@/components/camera/FooterActionTile";
import { ReviewDoneButton } from "@/components/camera/ReviewDoneButton";
import { homeVisual } from "@/lib/ui/homeVisual";

interface CameraLiveFooterProps {
  batchCount: number;
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
  const tileRow = homeVisual.snapCamera.footerTileRow;

  return (
    <div className="grid grid-cols-4 gap-x-1 gap-y-1 px-3 pb-3 pt-2">
      <div className={`flex justify-center ${tileRow}`}>
        <BatchCountBadge
          count={batchCount}
          latestId={latestId}
          onPress={
            batchCount > 0 && onBatchPreviewEnter
              ? onBatchPreviewEnter
              : undefined
          }
        />
      </div>

      <div className={`flex items-center justify-center ${tileRow}`}>
        <CameraShutterControl
          ready={ready}
          capturing={capturing}
          onClick={onShutter}
          showLabel={false}
          compact
        />
      </div>

      <div className={`flex justify-center ${tileRow}`}>
        {showDualDone ? (
          <FlashDoneButton
            disabled={doneDisabled}
            onClick={() => onFlashDone?.()}
          />
        ) : (
          <FooterActionTile placeholder>&nbsp;</FooterActionTile>
        )}
      </div>

      <div className={`flex justify-center ${tileRow}`}>
        {showDualDone ? (
          <ReviewDoneButton
            disabled={doneDisabled}
            onClick={() => onFinishCapture?.()}
          />
        ) : (
          <FooterActionTile placeholder>&nbsp;</FooterActionTile>
        )}
      </div>

      <div aria-hidden />
      <div className="flex justify-center">
        <span className="text-[9px] font-bold uppercase tracking-wide text-white">
          Take Photo
        </span>
      </div>
      <div aria-hidden />
      <div aria-hidden />
    </div>
  );
}
