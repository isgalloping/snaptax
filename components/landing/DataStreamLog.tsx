import { DATA_STREAM_LOG_LINES } from "./dataStreamCopy";

export function DataStreamLog() {
  return (
    <section
      className="data-stream-log mt-3 flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-black/60 px-3 py-2"
      aria-hidden
    >
      <div className="flex shrink-0 items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-500">
          SNAPTAX SYSTEM LOG
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-green-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
          ONLINE
        </span>
      </div>
      <div className="data-stream-log-viewport relative mt-2 min-h-[5.5rem] flex-1 overflow-hidden">
        <div className="data-stream-log-scroll space-y-1 font-mono text-[11px] leading-relaxed text-green-400">
          {DATA_STREAM_LOG_LINES.map((line) => (
            <p key={line} className="data-stream-log-line">
              {`> ${line}`}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
