import { LandingCameraHero } from "./LandingCameraHero";

export function DataStreamHero() {
  return (
    <div className="data-stream-hero flex flex-col items-center pt-4">
      <LandingCameraHero />
      <h1 className="mt-3 text-center text-2xl font-black tracking-tight sm:text-3xl">
        <span className="text-white">SNAP</span>
        <span className="text-yellow-500">TAX</span>
      </h1>
      <p className="mt-1 font-mono text-xs tracking-[0.2em] text-yellow-500/90">
        — ENGINE v1.0 —
      </p>
    </div>
  );
}
