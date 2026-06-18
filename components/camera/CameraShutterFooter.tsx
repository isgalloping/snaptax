"use client";

import { CameraShutterControl } from "@/components/camera/CameraShutterControl";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

interface CameraShutterColumnProps {
  ready: boolean;
  capturing: boolean;
  onShutter: () => void;
}

/** Hero shutter + TAKE PHOTO label (center column content). */
export function CameraShutterColumn({
  ready,
  capturing,
  onShutter,
}: CameraShutterColumnProps) {
  const copy = useUserCopy().camera;

  return (
    <>
      <CameraShutterControl
        ready={ready}
        capturing={capturing}
        onClick={onShutter}
        showLabel={false}
        size="hero"
      />
      <span className="text-[9px] font-bold uppercase tracking-wide text-white">
        {copy.takePhoto}
      </span>
    </>
  );
}

interface CameraShutterFooterProps {
  ready: boolean;
  capturing: boolean;
  onShutter: () => void;
}

/** footerDock wrapper for resnap single mode (shutter only, no batch/done columns). */
export function CameraShutterFooter({
  ready,
  capturing,
  onShutter,
}: CameraShutterFooterProps) {
  const rowMin = homeVisual.snapCamera.footerRowMin;

  return (
    <div className={`mx-3 mb-2 ${homeVisual.snapCamera.footerDock}`}>
      <div
        className={`flex flex-col items-center justify-center gap-1 px-2.5 py-2 ${rowMin}`}
      >
        <CameraShutterColumn
          ready={ready}
          capturing={capturing}
          onShutter={onShutter}
        />
      </div>
    </div>
  );
}
