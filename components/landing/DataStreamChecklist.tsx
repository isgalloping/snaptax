import { DATA_STREAM_CHECKLIST_ITEMS, DATA_STREAM_CHECKLIST_TITLE } from "./dataStreamCopy";
import { DataStreamIcon } from "./DataStreamIcon";

export function DataStreamChecklist() {
  return (
    <section className="data-stream-checklist mt-3 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5">
      <h2 className="text-sm font-semibold text-yellow-500">
        {DATA_STREAM_CHECKLIST_TITLE}
      </h2>
      <ul className="mt-2 divide-y divide-zinc-800/80">
        {DATA_STREAM_CHECKLIST_ITEMS.map((item, index) => (
          <li
            key={item.label}
            className="data-stream-checklist-row flex items-center gap-2 py-2"
            style={{ animationDelay: `${500 + index * 300}ms` }}
          >
            <DataStreamIcon name={item.icon} />
            <span className="font-mono text-xs text-yellow-500/90">[ ✓ ]</span>
            <span className="text-sm text-white">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
