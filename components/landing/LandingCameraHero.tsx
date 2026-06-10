import { CameraIcon } from "@/components/icons/CameraIcon";

export function LandingCameraHero() {
  return (
    <div
      className="landing-camera-glow relative flex h-36 w-36 items-center justify-center"
      aria-hidden
    >
      <span className="absolute left-2 top-2 h-7 w-7 border-l-2 border-t-2 border-yellow-500/90" />
      <span className="absolute right-2 top-2 h-7 w-7 border-r-2 border-t-2 border-yellow-500/90" />
      <span className="absolute bottom-2 left-2 h-7 w-7 border-b-2 border-l-2 border-yellow-500/90" />
      <span className="absolute bottom-2 right-2 h-7 w-7 border-b-2 border-r-2 border-yellow-500/90" />
      <CameraIcon className="h-20 w-20 shrink-0 text-yellow-500 stroke-[1.5]" />
    </div>
  );
}
