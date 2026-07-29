# Export Formats Enhancement (M4a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Schedule C mirror PDF + PRD audit ZIP upgrade + Export panel reorder/copy, reusing `ExportExpenseRow` / `finalizeExportRows` with a new audit-only pipeline for deductible rows.

**Architecture:** After `finalizeExportRows`, fork `auditEligibleRows` → `assignAuditTrailMeta` (PRD paths + global Index). `buildScheduleCMirrorPdf` serves both `cpa_pdf` download and ZIP summary. `buildAuditDetailCsv` + updated `buildCpaPackZip` replace legacy CPA pack internals. TurboTax CSV / TXF unchanged.

**Tech Stack:** Next.js 16 · pdfkit · archiver · Prisma · node:test · existing `POST /api/export/tax-pack`

**Spec:** [`docs/superpowers/specs/2026-07-04-export-formats-enhancement-design.md`](../specs/2026-07-04-export-formats-enhancement-design.md)

---

## File map

| File | Action |
|------|--------|
| `lib/export/scheduleCLines.ts` | **Create** — fixed Part II line table |
| `lib/export/scheduleCLines.test.ts` | **Create** |
| `lib/export/auditEligibleRows.ts` | **Create** |
| `lib/export/auditEligibleRows.test.ts` | **Create** |
| `lib/export/mapping/auditImageNaming.ts` | **Create** — PRD filename + path |
| `lib/export/mapping/auditImageNaming.test.ts` | **Create** |
| `lib/export/assignAuditTrailMeta.ts` | **Create** |
| `lib/export/assignAuditTrailMeta.test.ts` | **Create** |
| `lib/export/buildAuditDetailCsv.ts` | **Create** |
| `lib/export/buildAuditDetailCsv.test.ts` | **Create** |
| `lib/export/buildScheduleCMirrorPdf.ts` | **Create** |
| `lib/export/buildScheduleCMirrorPdf.test.ts` | **Create** |
| `lib/tax/exportRows.ts` | **Modify** — optional `auditIndex`, `auditImagePath` |
| `lib/export/mapping/exportCategoryMapping.ts` | **Modify** — PRD root `Line_*` folder names |
| `lib/export/buildCpaPack.ts` | **Modify** — PRD root entry names + `taxYear` param |
| `lib/export/buildCpaPack.test.ts` | **Modify** — new zip paths |
| `app/api/export/tax-pack/route.ts` | **Modify** — audit pipeline + filenames + `userName` |
| `lib/client/authApi.ts` | **Modify** — download name hints |
| `components/export/ExportEngineSheet.tsx` | **Modify** — button order PDF → TXF → CSV → ZIP |
| `lib/i18n/locales/en-US.ts` | **Modify** — export copy |
| `lib/i18n/locales/fr-FR.ts` | **Modify** — mirror en-US keys |
| `lib/i18n/locales/de-DE.ts` | **Modify** — mirror en-US keys |
| `lib/i18n/types.ts` | **Modify** — if new keys added |

**Out of scope (M4b):** `buildQifExport.ts`, `format=qif`, 5th button

---

## Task 1: Schedule C line registry (TDD)

**Files:**
- Create: `lib/export/scheduleCLines.ts`
- Create: `lib/export/scheduleCLines.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SCHEDULE_C_PART_II_LINES,
  scheduleCLineKeyFromLabel,
  zipFolderForScheduleCLine,
} from "./scheduleCLines.ts";

describe("scheduleCLines", () => {
  it("exports 17 Part II lines in IRS order", () => {
    assert.equal(SCHEDULE_C_PART_II_LINES.length, 17);
    assert.equal(SCHEDULE_C_PART_II_LINES[0]!.key, "8");
    assert.equal(SCHEDULE_C_PART_II_LINES[1]!.key, "9");
    assert.equal(SCHEDULE_C_PART_II_LINES.at(-1)!.key, "27a");
  });

  it("maps Line label to key", () => {
    assert.equal(scheduleCLineKeyFromLabel("Line 9"), "9");
    assert.equal(scheduleCLineKeyFromLabel("Line 24b"), "24b");
  });

  it("resolves zip folder for Line 9", () => {
    assert.equal(
      zipFolderForScheduleCLine("Line 9"),
      "Line_09_Car_and_truck_expenses",
    );
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/export/scheduleCLines.test.ts`

- [ ] **Step 3: Implement**

```typescript
export type ScheduleCLineDef = {
  key: string;
  label: string;
  irsLabel: string;
  zipFolder: string;
};

export const SCHEDULE_C_PART_II_LINES: ScheduleCLineDef[] = [
  { key: "8", label: "Line 8", irsLabel: "Advertising", zipFolder: "Line_08_Advertising" },
  { key: "9", label: "Line 9", irsLabel: "Car and truck expenses", zipFolder: "Line_09_Car_and_truck_expenses" },
  { key: "10", label: "Line 10", irsLabel: "Commissions and fees", zipFolder: "Line_10_Commissions_and_fees" },
  { key: "11", label: "Line 11", irsLabel: "Contract labor", zipFolder: "Line_11_Contract_labor" },
  { key: "13", label: "Line 13", irsLabel: "Depreciation", zipFolder: "Line_13_Depreciation" },
  { key: "14", label: "Line 14", irsLabel: "Employee benefit programs", zipFolder: "Line_14_Employee_benefit_programs" },
  { key: "15", label: "Line 15", irsLabel: "Insurance (other than health)", zipFolder: "Line_15_Insurance" },
  { key: "16", label: "Line 16", irsLabel: "Interest", zipFolder: "Line_16_Interest" },
  { key: "17", label: "Line 17", irsLabel: "Legal and professional services", zipFolder: "Line_17_Legal_and_professional" },
  { key: "18", label: "Line 18", irsLabel: "Office expense", zipFolder: "Line_18_Office_expense" },
  { key: "20", label: "Line 20", irsLabel: "Rent or lease", zipFolder: "Line_20_Rent_or_lease" },
  { key: "21", label: "Line 21", irsLabel: "Repairs and maintenance", zipFolder: "Line_21_Repairs_and_maintenance" },
  { key: "22", label: "Line 22", irsLabel: "Supplies", zipFolder: "Line_22_Supplies" },
  { key: "23", label: "Line 23", irsLabel: "Taxes and licenses", zipFolder: "Line_23_Taxes_and_licenses" },
  { key: "24a", label: "Line 24a", irsLabel: "Travel", zipFolder: "Line_24a_Travel" },
  { key: "24b", label: "Line 24b", irsLabel: "Deductible meals", zipFolder: "Line_24b_Deductible_meals" },
  { key: "27a", label: "Line 27a", irsLabel: "Other expenses", zipFolder: "Line_27a_Other_expenses" },
];

const BY_LABEL = new Map(
  SCHEDULE_C_PART_II_LINES.map((line) => [line.label, line]),
);

export function scheduleCLineKeyFromLabel(scheduleCLine: string): string | null {
  return BY_LABEL.get(scheduleCLine)?.key ?? null;
}

export function zipFolderForScheduleCLine(scheduleCLine: string): string {
  return BY_LABEL.get(scheduleCLine)?.zipFolder ?? "Line_27a_Other_expenses";
}

export function sumExportAmountsByLineKey(
  rows: { scheduleCLine: string; exportAmount: number }[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = scheduleCLineKeyFromLabel(row.scheduleCLine) ?? "27a";
    totals.set(key, (totals.get(key) ?? 0) + row.exportAmount);
  }
  return totals;
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/export/scheduleCLines.ts lib/export/scheduleCLines.test.ts
git commit -m "feat(export): add Schedule C Part II line registry"
```

---

## Task 2: Audit eligibility + PRD image naming (TDD)

**Files:**
- Create: `lib/export/auditEligibleRows.ts`, `auditEligibleRows.test.ts`
- Create: `lib/export/mapping/auditImageNaming.ts`, `auditImageNaming.test.ts`
- Modify: `lib/tax/exportRows.ts` — add optional fields
- Modify: `lib/export/mapping/exportCategoryMapping.ts` — align `zipFolderName` with `scheduleCLines` folders (no `02_Expenses_Receipts_Book/` prefix)

- [ ] **Step 1: Extend `ExportExpenseRow`**

In `lib/tax/exportRows.ts`:

```typescript
  receiptArchivePath: string;
  /** Audit pack only — 001..NNN */
  auditIndex?: string;
  /** Audit pack only — ZIP-relative path */
  auditImagePath?: string;
};
```

- [ ] **Step 2: Write failing tests for `auditEligibleRows`**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditEligibleRows } from "./auditEligibleRows.ts";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

function row(partial: Partial<ExportExpenseRow>): ExportExpenseRow {
  return {
    id: "1",
    date: "01/01/2026",
    dateIso: "2026-01-01",
    merchant: "Test",
    amount: 10,
    category: "OTHER",
    irsSchedule: "",
    irsLine: "Line 27a",
    deductibleAmount: 0,
    deductible: false,
    taxSaved: 0,
    notes: "",
    imagePathname: null,
    receiptImageUrl: "",
    categoryDisplay: "Personal",
    scheduleCLine: "",
    taxDeductible: "No",
    businessPercent: "0%",
    exportAmount: 0,
    receiptAlias: "",
    receiptArchivePath: "",
    ...partial,
  };
}

describe("auditEligibleRows", () => {
  it("includes deductible rows with exportAmount > 0", () => {
    const rows = auditEligibleRows([
      row({ deductible: true, exportAmount: 50, deductibleAmount: 50 }),
    ]);
    assert.equal(rows.length, 1);
  });

  it("excludes Personal / zero exportAmount", () => {
    const rows = auditEligibleRows([row({}), row({ exportAmount: 0, deductible: true })]);
    assert.equal(rows.length, 0);
  });
});
```

- [ ] **Step 3: Implement `auditEligibleRows.ts`**

```typescript
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

export function auditEligibleRows(rows: ExportExpenseRow[]): ExportExpenseRow[] {
  return rows.filter((r) => r.deductible && r.exportAmount > 0);
}
```

- [ ] **Step 4: Write failing test for `auditImageNaming`**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAuditImageFilename, buildAuditImagePath } from "./auditImageNaming.ts";

describe("auditImageNaming", () => {
  it("builds PRD filename with dollar amount and index", () => {
    assert.equal(
      buildAuditImageFilename({
        dateIso: "2025-02-14",
        merchant: "Shell Gas",
        exportAmount: 75.5,
        auditIndex: "001",
      }),
      "20250214_Shell_Gas_$75.50_001.jpg",
    );
  });

  it("builds full archive path under Line folder", () => {
    assert.equal(
      buildAuditImagePath({
        scheduleCLine: "Line 9",
        dateIso: "2025-02-14",
        merchant: "Shell Gas",
        exportAmount: 75.5,
        auditIndex: "001",
      }),
      "Line_09_Car_and_truck_expenses/20250214_Shell_Gas_$75.50_001.jpg",
    );
  });
});
```

- [ ] **Step 5: Implement `auditImageNaming.ts`**

Reuse `sanitizeMerchantForFilename` from `receiptNaming.ts`. Import `zipFolderForScheduleCLine` from `scheduleCLines.ts`.

```typescript
import { zipFolderForScheduleCLine } from "@/lib/export/scheduleCLines";
import { sanitizeMerchantForFilename } from "@/lib/export/mapping/receiptNaming";

export function buildAuditImageFilename(input: {
  dateIso: string;
  merchant: string;
  exportAmount: number;
  auditIndex: string;
}): string {
  const datePart = input.dateIso.replace(/-/g, "");
  const merchant = sanitizeMerchantForFilename(input.merchant);
  const amount = `$${input.exportAmount.toFixed(2)}`;
  return `${datePart}_${merchant}_${amount}_${input.auditIndex}.jpg`;
}

export function buildAuditImagePath(input: {
  scheduleCLine: string;
  dateIso: string;
  merchant: string;
  exportAmount: number;
  auditIndex: string;
}): string {
  const folder = zipFolderForScheduleCLine(input.scheduleCLine);
  const file = buildAuditImageFilename(input);
  return `${folder}/${file}`;
}
```

- [ ] **Step 6: Update `exportCategoryMapping.ts` zip folders**

Change each `zipFolderName` to match `scheduleCLines` (e.g. `Line_09_Car_and_truck_expenses`). Update `buildReceiptArchivePath` to `${mapping.zipFolderName}/${alias}` without `02_Expenses_Receipts_Book/` — used only for legacy tests until Task 6; TurboTax still uses `receiptAlias` only.

- [ ] **Step 7: Run tests — expect PASS**

Run: `npm run test:unit -- lib/export/auditEligibleRows.test.ts lib/export/mapping/auditImageNaming.test.ts`

- [ ] **Step 8: Commit**

```bash
git add lib/export/auditEligibleRows.ts lib/export/auditEligibleRows.test.ts \
  lib/export/mapping/auditImageNaming.ts lib/export/mapping/auditImageNaming.test.ts \
  lib/tax/exportRows.ts lib/export/mapping/exportCategoryMapping.ts
git commit -m "feat(export): audit eligibility and PRD image path naming"
```

---

## Task 3: `assignAuditTrailMeta` (TDD)

**Files:**
- Create: `lib/export/assignAuditTrailMeta.ts`
- Create: `lib/export/assignAuditTrailMeta.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignAuditTrailMeta } from "./assignAuditTrailMeta.ts";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

describe("assignAuditTrailMeta", () => {
  it("assigns global 001..N index and paths in input order", () => {
    const base: ExportExpenseRow = {
      id: "a",
      dateIso: "2026-03-15",
      merchant: "Home Depot",
      exportAmount: 125.5,
      scheduleCLine: "Line 22",
      deductible: true,
      receiptArchivePath: "",
    } as ExportExpenseRow;

    const [first, second] = assignAuditTrailMeta([
      base,
      { ...base, id: "b", merchant: "Shell", scheduleCLine: "Line 9", exportAmount: 45.5 },
    ]);

    assert.equal(first.auditIndex, "001");
    assert.match(first.auditImagePath!, /_001\.jpg$/);
    assert.equal(first.receiptArchivePath, first.auditImagePath);
    assert.equal(second.auditIndex, "002");
  });
});
```

- [ ] **Step 2: Implement**

```typescript
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { buildAuditImagePath } from "@/lib/export/mapping/auditImageNaming";

export function assignAuditTrailMeta(
  rows: ExportExpenseRow[],
): ExportExpenseRow[] {
  return rows.map((row, index) => {
    const auditIndex = String(index + 1).padStart(3, "0");
    const auditImagePath = buildAuditImagePath({
      scheduleCLine: row.scheduleCLine || "Line 27a",
      dateIso: row.dateIso,
      merchant: row.merchant,
      exportAmount: row.exportAmount,
      auditIndex,
    });
    return {
      ...row,
      auditIndex,
      auditImagePath,
      receiptArchivePath: auditImagePath,
    };
  });
}
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**

```bash
git add lib/export/assignAuditTrailMeta.ts lib/export/assignAuditTrailMeta.test.ts
git commit -m "feat(export): assign audit trail index and PRD archive paths"
```

---

## Task 4: Audit Detail CSV (TDD)

**Files:**
- Create: `lib/export/buildAuditDetailCsv.ts`
- Create: `lib/export/buildAuditDetailCsv.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAuditDetailCsv } from "./buildAuditDetailCsv.ts";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

describe("buildAuditDetailCsv", () => {
  it("includes Audit_Image_Path and Receipt_Image_URL with same value", () => {
    const path = "Line_22_Supplies/20260315_HomeDepot_$125.50_001.jpg";
    const csv = buildAuditDetailCsv([
      {
        dateIso: "2026-03-15",
        merchant: "Home Depot",
        categoryDisplay: "Supplies",
        exportAmount: 125.5,
        notes: "",
        auditImagePath: path,
      } as ExportExpenseRow,
    ]);
    assert.match(csv, /Audit_Image_Path/);
    assert.match(csv, /Receipt_Image_URL/);
    const lines = csv.split("\r\n");
    assert.equal(lines.length, 2);
    assert.ok(lines[1]!.includes(path));
    const pathCount = (lines[1]!.match(/Line_22_Supplies/g) ?? []).length;
    assert.equal(pathCount, 2);
  });
});
```

- [ ] **Step 2: Implement** — headers per spec §6.3; reuse `escapeCsvField` pattern from `lib/tax/exportCsv.ts` (extract shared helper or duplicate minimally).

```typescript
const HEADERS = [
  "Date",
  "Category",
  "Merchant",
  "Amount",
  "Memo",
  "Audit_Image_Path",
  "Receipt_Image_URL",
] as const;

export function buildAuditDetailCsv(rows: ExportExpenseRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const row of rows) {
    const path = row.auditImagePath ?? "";
    lines.push(
      csvLine([
        row.dateIso,
        row.categoryDisplay,
        row.merchant,
        row.exportAmount.toFixed(2),
        row.notes,
        path,
        path,
      ]),
    );
  }
  return lines.join("\r\n");
}
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**

---

## Task 5: Schedule C mirror PDF (TDD)

**Files:**
- Create: `lib/export/buildScheduleCMirrorPdf.ts`
- Create: `lib/export/buildScheduleCMirrorPdf.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildScheduleCMirrorPdf } from "./buildScheduleCMirrorPdf.ts";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

describe("buildScheduleCMirrorPdf", () => {
  it("returns PDF with disclaimer and zero Line 8 row", async () => {
    const buffer = await buildScheduleCMirrorPdf({
      taxYear: "2025",
      taxpayerName: "Jane Contractor",
      businessIndustry: "Independent Contractor",
      auditRows: [],
      incomeRows: [],
    });
    assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
    const text = buffer.toString("latin1");
    assert.match(text, /NOT an official tax return/);
    assert.match(text, /Line 8/);
    assert.match(text, /\$0\.00/);
    assert.match(text, /Jane Contractor/);
  });
});
```

- [ ] **Step 2: Implement `buildScheduleCMirrorPdf.ts`**

Follow `buildCpaPdf.ts` pdfkit patterns:

1. Header: tax year, taxpayerName, businessIndustry, PRD disclaimer verbatim
2. Loop `SCHEDULE_C_PART_II_LINES`; amount from `sumExportAmountsByLineKey(auditRows)` or `$0.00`
3. Line 28 total row
4. Part I Income — copy block from `buildCpaPdf.ts` (`summarizeIncomeRows`)
5. Appendix: group `auditRows` by `scheduleCLine`, sort by `dateIso` desc within group; print Date, Merchant, exportAmount, notes, auditIndex, auditImagePath

Export type:

```typescript
export type ScheduleCMirrorPdfInput = {
  taxYear: string;
  taxpayerName: string;
  businessIndustry: string;
  auditRows: ExportExpenseRow[];
  incomeRows: ExportIncomeRow[];
};

export async function buildScheduleCMirrorPdf(
  input: ScheduleCMirrorPdfInput,
): Promise<Buffer> { /* pdfkit */ }
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**

```bash
git add lib/export/buildScheduleCMirrorPdf.ts lib/export/buildScheduleCMirrorPdf.test.ts
git commit -m "feat(export): Schedule C mirror PDF builder"
```

---

## Task 6: Upgrade `buildCpaPackZip`

**Files:**
- Modify: `lib/export/buildCpaPack.ts`
- Modify: `lib/export/buildCpaPack.test.ts`

- [ ] **Step 1: Update test expectations**

Replace assertions:

- `00_READ_ME_Summary.pdf` → `2025_Tax_Report_Summary.pdf` (pass `taxYear: "2025"` in test)
- `Expenses-Detail.csv` → `2025_Tax_Report_Data.csv`
- expense path → `Line_22_Supplies/20260315_HomeDepot_$125.50_001.jpg` (row must include `auditImagePath` / `receiptArchivePath` from Task 3)

- [ ] **Step 2: Change `buildCpaPackZip` signature**

Add required `taxYear: string` param (or options object):

```typescript
export async function buildCpaPackZip(
  detailCsv: string,
  summaryPdf: Buffer,
  expenseRows: ExportExpenseRow[],
  incomeRows: ExportIncomeRow[] = [],
  taxYear: string,
  onProgress?: (progress: CpaPackProgress) => void,
): Promise<CpaPackResult> {
  // ...
  archive.append(summaryPdf, { name: `${taxYear}_Tax_Report_Summary.pdf` });
  archive.append(detailCsv, { name: `${taxYear}_Tax_Report_Data.csv` });
  // expense images still use row.receiptArchivePath
}
```

- [ ] **Step 3: Run `buildCpaPack.test.ts` — PASS**

- [ ] **Step 4: Commit**

---

## Task 7: Wire `tax-pack` route

**Files:**
- Modify: `app/api/export/tax-pack/route.ts`

- [ ] **Step 1: Load `userName`**

```typescript
select: { industry: true, dataRegion: true, userName: true },
```

- [ ] **Step 2: Add audit pipeline helper** (inline or extracted)

```typescript
const enrichedExpenseRows = finalizeExportRows(expenseRows);
const auditRows = assignAuditTrailMeta(
  auditEligibleRows(enrichedExpenseRows),
);
```

- [ ] **Step 3: Replace `cpa_pdf` branch**

```typescript
buffer = await buildScheduleCMirrorPdf({
  taxYear,
  taxpayerName: user.userName ?? "SnapTax User",
  businessIndustry: "Independent Contractor",
  auditRows,
  incomeRows,
});
filename = `Snap1099-${taxYear}-Schedule-C-Mirror.pdf`;
```

Remove `buildCpaSummaryPdf` / `enrichExportRowsWithImageUrls` from this branch (presigned URLs not needed for mirror PDF appendix — uses audit paths).

- [ ] **Step 4: Replace `cpa_pack` branch**

```typescript
const detailCsv = buildAuditDetailCsv(auditRows);
const summaryPdf = await buildScheduleCMirrorPdf({ /* same as above */ });
const pack = await buildCpaPackZip(
  detailCsv,
  summaryPdf,
  auditRows,
  incomeRows,
  taxYear,
  onProgress,
);
filename = `Snap1099-${taxYear}-Audit-Trail.zip`;
```

- [ ] **Step 5: Leave `csv` / `txf` / `xlsx` branches using `enrichedExpenseRows` unchanged**

- [ ] **Step 6: Run unit tests** — fix any route tests if present

Run: `npm run test:unit`

- [ ] **Step 7: Commit**

```bash
git add app/api/export/tax-pack/route.ts
git commit -m "feat(export): wire audit pipeline in tax-pack route"
```

---

## Task 8: Client filenames + Export UI

**Files:**
- Modify: `lib/client/authApi.ts`
- Modify: `components/export/ExportEngineSheet.tsx`
- Modify: `lib/i18n/locales/en-US.ts`, `fr-FR.ts`, `de-DE.ts`

- [ ] **Step 1: Update `authApi.ts` download names**

```typescript
if (format === "cpa_pack") return `Snap1099-${taxYear}-Audit-Trail.zip`;
if (format === "cpa_pdf") return `Snap1099-${taxYear}-Schedule-C-Mirror.pdf`;
```

- [ ] **Step 2: Reorder Step 3 buttons in `ExportEngineSheet.tsx`**

Order: `cpa_pdf` → `txf` → `csv` → `cpa_pack` (move JSX blocks accordingly).

- [ ] **Step 3: Update en-US copy (FR/DE mirror)**

```typescript
formatCpaPdfTitle: "Schedule C Mirror PDF",
formatCpaPdfHint:
  "Full IRS Schedule C Part II lines — copy into FreeTaxUSA or paper forms.",
formatCpaTitle: "1099 Audit Receipt Pack (ZIP)",
formatCpaHint:
  "Original receipt photos organized by IRS line — your audit safety net.",
formatCsvTitle: "TurboTax CSV",
formatTxfTitle: "TXF for Tax Software",
snap1099Hint:
  "Snap 1099-NEC / 1099-K — included in Audit Pack under 01_Income_Documents.",
```

- [ ] **Step 4: Manual smoke** — Export sheet shows 4 buttons in new order (dev server optional)

- [ ] **Step 5: Commit**

```bash
git add lib/client/authApi.ts components/export/ExportEngineSheet.tsx lib/i18n/
git commit -m "feat(export): reorder export formats and update PRD copy"
```

---

## Task 9: Full verification

- [ ] **Step 1: Run full unit suite**

Run: `npm run test:unit`

Expected: all tests pass

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Update `finalizeExportRows.test.ts` / `exportCategoryMapping` tests** if folder paths changed

- [ ] **Step 4: Optional — grep for stale paths**

Run: `rg "00_READ_ME_Summary|Expenses-Detail|02_Expenses_Receipts_Book" lib/ app/`

Expected: no production references (docs OK)

- [ ] **Step 5: Final commit** if any test fixes remain

---

## Spec coverage self-review

| Spec § | Task |
|--------|------|
| Audit eligibility (§4.2, Q8) | Task 2 |
| assignAuditTrailMeta (§4.3) | Task 3 |
| scheduleCLines (§4.4) | Task 1 |
| buildScheduleCMirrorPdf (§5) | Task 5 |
| ZIP names/layout (§6) | Task 4, 6 |
| tax-pack route (§7.1) | Task 7 |
| Export UI (§7.2) | Task 8 |
| authApi names (§7.3) | Task 8 |
| PDF header userName (Q12) | Task 7 |
| Income 01_ folder (Q9) | Task 6 (unchanged income path) |
| M4b QIF | **Not in this plan** |

No TBD placeholders in tasks above.
