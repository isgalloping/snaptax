import { LandingRouter } from "@/components/landing/LandingRouter";
import { StartupShell } from "@/components/landing/StartupShell";

export default function Home() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        id="landing-ssr-layer"
        className="landing-overlay fixed inset-0 z-40 flex flex-col bg-black"
      >
        <LandingRouter />
      </div>
      <StartupShell />
    </div>
  );
}
