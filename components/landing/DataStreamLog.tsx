import { getTranslations } from "next-intl/server";

const LOG_KEYS = [
  "logLine1",
  "logLine2",
  "logLine3",
  "logLine4",
  "logLine5",
  "logLine6",
  "logLine7",
] as const;

export async function DataStreamLog() {
  const t = await getTranslations("Landing");

  const lines = LOG_KEYS.map((key) => t(key));

  return (
    <section
      className="data-stream-log mt-3 flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-black/60 px-3 py-2"
      aria-hidden
    >
      <div className="flex shrink-0 items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-500">
          {t("snaptaxSystemLog")}
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-green-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
          {t("logOnline")}
        </span>
      </div>
      <div className="data-stream-log-viewport relative mt-2 min-h-[5.5rem] flex-1 overflow-hidden">
        <div className="data-stream-log-scroll space-y-1 font-mono text-[11px] leading-relaxed text-green-400">
          {lines.map((line) => (
            <p key={line} className="data-stream-log-line">
              {`> ${line}`}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
