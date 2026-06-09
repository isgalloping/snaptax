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
  const rowMin = homeVisual.snapCamera.footerRowMin;
  const gridCols = homeVisual.snapCamera.footerGridCols;

  return (
    <div className={`mx-3 mb-2 ${homeVisual.snapCamera.footerDock}`}>
      <div className={`grid ${gridCols} gap-1.5 px-2.5 py-2 ${rowMin}`}>
        <div className={rowMin}>
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

        <div
          className={`flex flex-col items-center justify-center gap-1 ${rowMin}`}
        >
          <CameraShutterControl
            ready={ready}
            capturing={capturing}
            onClick={onShutter}
            showLabel={false}
            size="hero"
          />
          <span className="text-[9px] font-bold uppercase tracking-wide text-white">
            Take Photo
          </span>
        </div>

        <div className={rowMin}>
          {showDualDone ? (
            <FlashDoneButton
              disabled={doneDisabled}
              onClick={() => onFlashDone?.()}
            />
          ) : (
            <FooterActionTile fill placeholder>
              &nbsp;
            </FooterActionTile>
          )}
        </div>

        <div className={rowMin}>
          {showDualDone ? (
            <ReviewDoneButton
              disabled={doneDisabled}
              onClick={() => onFinishCapture?.()}
            />
          ) : (
            <FooterActionTile fill placeholder>
              &nbsp;
            </FooterActionTile>
          )}
        </div>
      </div>
    </div>
  );
}
