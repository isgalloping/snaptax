export function DataStreamProgress() {
  return (
    <div className="data-stream-progress mt-5 px-1">
      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900">
          <div className="data-stream-progress-fill h-full rounded-full" />
        </div>
        <span className="relative w-10 shrink-0 text-right font-mono text-xs font-bold text-yellow-500">
          <span className="data-stream-pct-start absolute inset-0">0%</span>
          <span className="data-stream-pct-end absolute inset-0">92%</span>
        </span>
      </div>
    </div>
  );
}
