import { DataStreamChecklist } from "./DataStreamChecklist";
import { DataStreamFooter } from "./DataStreamFooter";
import { DataStreamHero } from "./DataStreamHero";
import { DataStreamLog } from "./DataStreamLog";
import { DataStreamProgress } from "./DataStreamProgress";

export function DataStreamLanding() {
  return (
    <div className="data-stream-landing relative flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950 px-4 pb-2">
      <div className="data-stream-grid-bg pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <DataStreamHero />
        <DataStreamProgress />
        <DataStreamChecklist />
        <DataStreamLog />
        <DataStreamFooter />
      </div>
    </div>
  );
}
