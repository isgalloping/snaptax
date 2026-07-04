import type { ParsedReceiptDraft } from "@/lib/ocr/types";

const TOTAL_PATTERN =
  /(?:TOTAL|TTC|AMOUNT\s+DUE|BALANCE\s+DUE|GRAND\s+TOTAL|TO\s+PAY|GESAMT|SUMME|AMOUNT)[^\d$€£]*([$€£]?\s*\d[\d.,]*)/i;
const MONEY_PATTERN = /[$€£]\s*(\d[\d.,]*)/g;
const US_DATE_PATTERN = /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/;
const EU_DATE_PATTERN = /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/;
const PHONE_PATTERN = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

function parseMoney(raw: string): number | undefined {
  const t = raw.replace(/[$€£\s]/g, "").trim();
  if (!t) return undefined;
  let normalized = t;
  if (/^\d{1,3}(,\d{3})+\.\d{2}$/.test(t)) {
    normalized = t.replace(/,/g, "");
  } else if (/^\d+,\d{2}$/.test(t)) {
    normalized = t.replace(",", ".");
  } else {
    normalized = t.replace(/,/g, "");
  }
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function garbleRatio(text: string): number {
  if (!text.length) return 1;
  let bad = 0;
  for (const ch of text) {
    if (ch === "\n" || ch === "\r" || ch === "\t") continue;
    if (/[\x20-\x7E]/.test(ch)) continue;
    bad += 1;
  }
  return bad / text.length;
}

function isNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/^[*#=_-]+$/.test(t)) return true;
  if (PHONE_PATTERN.test(t)) return true;
  if (US_DATE_PATTERN.test(t) && t.length < 14) return true;
  if (EU_DATE_PATTERN.test(t) && t.length < 14) return true;
  return false;
}

function normalizeMerchant(line: string): string {
  return line.replace(/\s+#\d+.*$/i, "").trim().slice(0, 120);
}

export function parseReceipt(rawText: string): ParsedReceiptDraft {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let total: number | undefined;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]!;
    const labeled = line.match(TOTAL_PATTERN);
    if (labeled?.[1]) {
      total = parseMoney(labeled[1]);
      if (total != null) break;
    }
  }
  if (total == null) {
    const amounts: number[] = [];
    for (const line of lines) {
      for (const match of line.matchAll(MONEY_PATTERN)) {
        const v = parseMoney(match[0] ?? "");
        if (v != null) amounts.push(v);
      }
    }
    if (amounts.length > 0) {
      total = amounts.reduce((max, n) => (n > max ? n : max), amounts[0]!);
    }
  }

  let merchant: string | undefined;
  for (const line of lines) {
    if (isNoiseLine(line)) continue;
    merchant = normalizeMerchant(line);
    break;
  }

  let date: string | undefined;
  const head = lines.slice(0, 8).join(" ");
  const usDate = head.match(US_DATE_PATTERN);
  const euDate = head.match(EU_DATE_PATTERN);
  if (usDate?.[1]) date = usDate[1];
  else if (euDate?.[1]) date = euDate[1];

  const ratio = garbleRatio(rawText);

  return {
    merchant,
    date,
    total,
    rawText,
    signals: {
      merchantMissing: !merchant?.trim(),
      totalMissing: total == null || total <= 0,
      garbleRatio: ratio,
    },
  };
}
