import type { ExportFormat } from "@/lib/export/exportFilenames";

export type ExportEngineFormatTitleKey =
  | "formatCpaPdfTitle"
  | "formatTxfTitle"
  | "formatCsvTitle"
  | "formatCpaTitle"
  | "formatQifTitle"
  | "formatQboTitle";

export type ExportEngineFormatHintKey =
  | "formatCpaPdfHint"
  | "formatTxfHint"
  | "formatCsvHint"
  | "formatCpaHint"
  | "formatQifHint"
  | "formatQboHint";

export type ExportEngineFormatCopy = Record<
  ExportEngineFormatTitleKey | ExportEngineFormatHintKey,
  string
>;

export const EXPORT_ENGINE_FORMAT_OPTIONS: readonly {
  format: ExportFormat;
  titleKey: ExportEngineFormatTitleKey;
  hintKey: ExportEngineFormatHintKey;
}[] = [
  {
    format: "cpa_pdf",
    titleKey: "formatCpaPdfTitle",
    hintKey: "formatCpaPdfHint",
  },
  { format: "txf", titleKey: "formatTxfTitle", hintKey: "formatTxfHint" },
  { format: "csv", titleKey: "formatCsvTitle", hintKey: "formatCsvHint" },
  {
    format: "cpa_pack",
    titleKey: "formatCpaTitle",
    hintKey: "formatCpaHint",
  },
  { format: "qif", titleKey: "formatQifTitle", hintKey: "formatQifHint" },
  { format: "qbo", titleKey: "formatQboTitle", hintKey: "formatQboHint" },
];

export function exportEngineSelectedFormatLabel(
  format: ExportFormat,
  copy: ExportEngineFormatCopy,
): string {
  const option = EXPORT_ENGINE_FORMAT_OPTIONS.find(
    (option) => option.format === format,
  );
  return option ? copy[option.titleKey] : copy.formatCpaTitle;
}
