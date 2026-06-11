import { getTranslations } from "next-intl/server";
import { DataStreamIcon } from "./DataStreamIcon";

const FOOTER_COLUMNS = [
  { icon: "shield", titleKey: "privateSecure", subKey: "privateSecureDesc" },
  { icon: "offline", titleKey: "worksOffline", subKey: "worksOfflineDesc" },
  { icon: "workers", titleKey: "builtForWorkers", subKey: "builtForWorkersDesc" },
] as const;

export async function DataStreamFooter() {
  const t = await getTranslations("Landing");

  return (
    <footer className="data-stream-footer mt-auto grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-3 pb-4">
      {FOOTER_COLUMNS.map((col) => (
        <div key={col.titleKey} className="flex flex-col items-center text-center">
          <DataStreamIcon name={col.icon} />
          <p className="mt-1.5 text-[9px] font-bold leading-tight text-white">
            {t(col.titleKey)}
          </p>
          <p className="mt-1 text-[8px] leading-snug text-zinc-500">{t(col.subKey)}</p>
        </div>
      ))}
    </footer>
  );
}
