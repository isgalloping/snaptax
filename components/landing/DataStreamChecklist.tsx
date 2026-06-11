import { getTranslations } from "next-intl/server";
import { DataStreamIcon } from "./DataStreamIcon";

const CHECKLIST_ICONS = ["database", "gauge", "briefcase", "camera", "shield"] as const;
const CHECKLIST_KEYS = [
  "irsDeductionLoaded",
  "mileageLoaded",
  "equipmentLoaded",
  "scannerReady",
  "vaultOnline",
] as const;

export async function DataStreamChecklist() {
  const t = await getTranslations("Landing");

  return (
    <section className="data-stream-checklist mt-3 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5">
      <h2 className="text-sm font-semibold text-yellow-500">
        {t("loadingToolkit")}
      </h2>
      <ul className="mt-2 divide-y divide-zinc-800/80">
        {CHECKLIST_ICONS.map((icon, index) => (
          <li
            key={icon}
            className="data-stream-checklist-row flex items-center gap-2 py-2"
            style={{ animationDelay: `${500 + index * 300}ms` }}
          >
            <DataStreamIcon name={icon} />
            <span className="font-mono text-xs text-yellow-500/90">[ ✓ ]</span>
            <span className="text-sm text-white">{t(CHECKLIST_KEYS[index])}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
