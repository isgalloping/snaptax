import type { ExportFormat } from "@/lib/export/exportFilenames";
import type { UserCopy } from "@/lib/i18n/types";

export type ExportEngineFormat = Extract<
  ExportFormat,
  "csv" | "cpa_pack" | "cpa_pdf" | "txf" | "qif" | "qbo"
>;

type ExportEngineCopy = UserCopy["exportEngine"];
type ExportEngineFormatTitleKey =
  | "formatCpaPdfTitle"
  | "formatTxfTitle"
  | "formatCsvTitle"
  | "formatCpaTitle"
  | "formatQifTitle"
  | "formatQboTitle";
type ExportEngineFormatHintKey =
  | "formatCpaPdfHint"
  | "formatTxfHint"
  | "formatCsvHint"
  | "formatCpaHint"
  | "formatQifHint"
  | "formatQboHint";

export type ExportEngineFormatOption = {
  format: ExportEngineFormat;
  titleKey: ExportEngineFormatTitleKey;
  hintKey: ExportEngineFormatHintKey;
};

export const EXPORT_ENGINE_FORMAT_OPTIONS = [
  {
    format: "cpa_pdf",
    titleKey: "formatCpaPdfTitle",
    hintKey: "formatCpaPdfHint",
  },
  {
    format: "txf",
    titleKey: "formatTxfTitle",
    hintKey: "formatTxfHint",
  },
  {
    format: "csv",
    titleKey: "formatCsvTitle",
    hintKey: "formatCsvHint",
  },
  {
    format: "cpa_pack",
    titleKey: "formatCpaTitle",
    hintKey: "formatCpaHint",
  },
  {
    format: "qif",
    titleKey: "formatQifTitle",
    hintKey: "formatQifHint",
  },
  {
    format: "qbo",
    titleKey: "formatQboTitle",
    hintKey: "formatQboHint",
  },
] as const satisfies readonly ExportEngineFormatOption[];

export function exportEngineFormatTitle(
  copy: ExportEngineCopy,
  format: ExportEngineFormat,
): string {
  return copy[
    EXPORT_ENGINE_FORMAT_OPTIONS.find((option) => option.format === format)!
      .titleKey
  ];
}
