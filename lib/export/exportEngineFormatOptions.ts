import type { ExportFormat } from "@/lib/export/exportFilenames";
import type { UserCopy } from "@/lib/i18n/types";

type ExportEngineTitleKey =
  | "formatCsvTitle"
  | "formatCpaTitle"
  | "formatCpaPdfTitle"
  | "formatTxfTitle"
  | "formatQifTitle"
  | "formatQboTitle";
type ExportEngineHintKey =
  | "formatCsvHint"
  | "formatCpaHint"
  | "formatCpaPdfHint"
  | "formatTxfHint"
  | "formatQifHint"
  | "formatQboHint";
type ExportEngineTitleCopy = Pick<UserCopy["exportEngine"], ExportEngineTitleKey>;

export type ExportEngineFormatOption = {
  format: ExportEngineFormat;
  titleKey: ExportEngineTitleKey;
  hintKey: ExportEngineHintKey;
};

export type ExportEngineFormat = Exclude<ExportFormat, "xlsx">;

export const EXPORT_ENGINE_FORMAT_OPTIONS = [
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
] as const satisfies readonly ExportEngineFormatOption[];

export function exportEngineFormatValues(): ExportEngineFormatOption["format"][] {
  return EXPORT_ENGINE_FORMAT_OPTIONS.map((option) => option.format);
}

export function selectedExportFormatLabel(
  format: ExportEngineFormat,
  copy: ExportEngineTitleCopy,
): string {
  const option = EXPORT_ENGINE_FORMAT_OPTIONS.find((item) => item.format === format);
  if (!option) return copy.formatCpaPdfTitle;
  return copy[option.titleKey];
}
