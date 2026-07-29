import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { exportEligibleRows } from "@/lib/export/auditEligibleRows";

function escapeOfxText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatOfxPostedDate(dateIso: string): string {
  const [y, m, d] = dateIso.split("-");
  return `${y}${m}${d}000000`;
}

function formatOfxServerDate(exportedAt: Date): string {
  const y = exportedAt.getUTCFullYear();
  const m = String(exportedAt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(exportedAt.getUTCDate()).padStart(2, "0");
  const h = String(exportedAt.getUTCHours()).padStart(2, "0");
  const min = String(exportedAt.getUTCMinutes()).padStart(2, "0");
  const s = String(exportedAt.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}${h}${min}${s}`;
}

function qboFitId(row: ExportExpenseRow): string {
  return `SNPTX${row.id.replace(/-/g, "")}`;
}

function qboMemo(row: ExportExpenseRow): string {
  const label = row.categoryDisplay.trim() || "Other expenses";
  const line = row.scheduleCLine ?? "Expense";
  const memo = `${line} - ${label}`;
  const notes = row.notes.trim();
  return notes ? `${memo} · ${notes}` : memo;
}

function qboName(row: ExportExpenseRow): string {
  return row.merchant.slice(0, 32);
}

function buildStmtTrn(row: ExportExpenseRow): string {
  return [
    "<STMTTRN>",
    "<TRNTYPE>DEBIT</TRNTYPE>",
    `<DTPOSTED>${formatOfxPostedDate(row.dateIso)}</DTPOSTED>`,
    `<TRNAMT>${(-row.exportAmount).toFixed(2)}</TRNAMT>`,
    `<FITID>${escapeOfxText(qboFitId(row))}</FITID>`,
    `<NAME>${escapeOfxText(qboName(row))}</NAME>`,
    `<MEMO>${escapeOfxText(qboMemo(row))}</MEMO>`,
    "</STMTTRN>",
  ].join("\n");
}

/** QuickBooks Online Web Connect (.qbo) — OFX SGML with INTU.BID; deductible rows only. */
export function buildQboExport(
  rows: ExportExpenseRow[],
  exportedAt: Date = new Date(),
): string {
  const transactions = exportEligibleRows(rows).map(buildStmtTrn).join("\n");

  const dtServer = formatOfxServerDate(exportedAt);
  const dtAsOf = formatOfxPostedDate(
    exportedAt.toISOString().slice(0, 10),
  );

  return [
    "OFXHEADER:100",
    "DATA:OFXSGML",
    "VERSION:102",
    "SECURITY:NONE",
    "ENCODING:USASCII",
    "CHARSET:1252",
    "",
    "<OFX>",
    "<SIGNONMSGSRSV1>",
    "<SONRS>",
    "<STATUS>",
    "<CODE>0</CODE>",
    "<SEVERITY>INFO</SEVERITY>",
    "</STATUS>",
    `<DTSERVER>${dtServer}</DTSERVER>`,
    "<LANGUAGE>ENG</LANGUAGE>",
    "<INTU.BID>3000</INTU.BID>",
    "</SONRS>",
    "</SIGNONMSGSRSV1>",
    "<BANKMSGSRSV1>",
    "<STMTTRNRS>",
    "<STMTRS>",
    "<CURDEF>USD</CURDEF>",
    "<BANKACCTFROM>",
    "<BANKID>SNAPTAX</BANKID>",
    "<ACCTID>EXPENSES</ACCTID>",
    "<ACCTTYPE>CHECKING</ACCTTYPE>",
    "</BANKACCTFROM>",
    "<BANKTRANLIST>",
    transactions,
    "</BANKTRANLIST>",
    "<LEDGERBAL>",
    "<BALAMT>0.00</BALAMT>",
    `<DTASOF>${dtAsOf}</DTASOF>`,
    "</LEDGERBAL>",
    "</STMTRS>",
    "</STMTTRNRS>",
    "</BANKMSGSRSV1>",
    "</OFX>",
    "",
  ].join("\n");
}
