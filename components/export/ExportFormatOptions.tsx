"use client";

import type { ExportFormat } from "@/lib/export/exportFilenames";
import type { UserCopy } from "@/lib/i18n";

export type ExportEngineFormat = Exclude<ExportFormat, "xlsx">;
export type LocalTaxExportFormat = "csv" | "txf" | "qif" | "qbo";
export type LocalCpaExportFormat = "cpa_pdf" | "cpa_pack";

type ExportEngineCopy = UserCopy["exportEngine"];
type FormatTextKey =
  | "formatCpaPdfTitle"
  | "formatCpaPdfHint"
  | "formatTxfTitle"
  | "formatTxfHint"
  | "formatCsvTitle"
  | "formatCsvHint"
  | "formatCpaTitle"
  | "formatCpaHint"
  | "formatQifTitle"
  | "formatQifHint"
  | "formatQboTitle"
  | "formatQboHint";

type ExportFormatOption = {
  format: ExportEngineFormat;
  titleKey: FormatTextKey;
  hintKey: FormatTextKey;
};

const FORMAT_OPTIONS: readonly ExportFormatOption[] = [
  {
    format: "cpa_pdf",
    titleKey: "formatCpaPdfTitle",
    hintKey: "formatCpaPdfHint",
  },
  { format: "txf", titleKey: "formatTxfTitle", hintKey: "formatTxfHint" },
  { format: "csv", titleKey: "formatCsvTitle", hintKey: "formatCsvHint" },
  { format: "cpa_pack", titleKey: "formatCpaTitle", hintKey: "formatCpaHint" },
  { format: "qif", titleKey: "formatQifTitle", hintKey: "formatQifHint" },
  { format: "qbo", titleKey: "formatQboTitle", hintKey: "formatQboHint" },
];

export const EXPORT_ENGINE_FORMAT_ORDER = FORMAT_OPTIONS.map(
  (option) => option.format,
) as readonly ExportEngineFormat[];

export function isLocalTaxExportFormat(
  format: ExportEngineFormat,
): format is LocalTaxExportFormat {
  return format === "csv" || format === "txf" || format === "qif" || format === "qbo";
}

export function isLocalCpaExportFormat(
  format: ExportEngineFormat,
): format is LocalCpaExportFormat {
  return format === "cpa_pdf" || format === "cpa_pack";
}

export function exportFormatTitle(
  copy: ExportEngineCopy,
  format: ExportEngineFormat,
): string {
  const option = FORMAT_OPTIONS.find((item) => item.format === format);
  return option ? copy[option.titleKey] : copy.formatCpaTitle;
}

export function ExportFormatOptions({
  copy,
  format,
  onFormatChange,
}: {
  copy: ExportEngineCopy;
  format: ExportEngineFormat;
  onFormatChange: (format: ExportEngineFormat) => void;
}) {
  return (
    <div className="space-y-3">
      {FORMAT_OPTIONS.map((option) => {
        const selected = format === option.format;
        return (
          <button
            key={option.format}
            type="button"
            onClick={() => onFormatChange(option.format)}
            className={`w-full min-h-[88px] rounded-xl border-2 p-4 text-left transition-transform active:scale-95 ${
              selected
                ? "border-yellow-500 bg-yellow-950"
                : "border-zinc-600 bg-zinc-800"
            }`}
          >
            <p className="text-sm font-black uppercase tracking-wider text-white">
              {selected ? "✓ " : ""}
              {copy[option.titleKey]}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              {copy[option.hintKey]}
            </p>
          </button>
        );
      })}
    </div>
  );
}
