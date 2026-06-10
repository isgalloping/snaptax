import { DATA_STREAM_FOOTER_COLUMNS } from "./dataStreamCopy";
import { DataStreamIcon } from "./DataStreamIcon";

export function DataStreamFooter() {
  return (
    <footer className="data-stream-footer mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-3 pb-4">
      {DATA_STREAM_FOOTER_COLUMNS.map((col) => (
        <div key={col.title} className="flex flex-col items-center text-center">
          <DataStreamIcon name={col.icon} />
          <p className="mt-1.5 text-[9px] font-bold leading-tight text-white">
            {col.title}
          </p>
          <p className="mt-1 text-[8px] leading-snug text-zinc-500">{col.subcopy}</p>
        </div>
      ))}
    </footer>
  );
}
