# Export Formats Enhancement (M4) — Design

**Date:** 2026-07-04  
**Status:** Approved (brainstorming + grill-me 2026-07-04)  
**Scope:** M4a — Schedule C mirror PDF + Audit ZIP upgrade + Export UI; M4b — QIF (separate implementation plan)

**References:**

- PRD: `docs/prd/export-format.md`, `export-format-schedulec.md`, `export-format-zip.md`, `export-format-zip-ext.md`, `export-format-qbo.md`, `export-format-qbo-ext.txt`
- Prior spec (M1–M3 baseline): `docs/superpowers/specs/2026-06-19-export-formats-refactor-design.md` — **this spec supersedes** CPA Pack/PDF structure & naming sections only; unified `ExportExpenseRow` + `finalizeExportRows` architecture remains
- Product: `.cursor/rules/snap1099-product.mdc` (Export hard gate, Paddle, two logical pages)

---

## 1. Problem

Snap1099 export (M1–M3) delivers TurboTax CSV, TXF, and a CPA Audit Pack, but PRD defines three additional ecosystem deliverables:

1. **Schedule C mirror PDF** — full Part II Line 8–27a table with `$0.00` rows for FreeTaxUSA manual entry
2. **Audit ZIP** — PRD image naming, CSV `Audit_Image_Path` penetration, global Index cross-ref with PDF
3. **QuickBooks QIF** — lightweight accounting import (M4b)

Current gaps vs PRD:

| Area | Current | Target |
|------|---------|--------|
| `cpa_pdf` | P&L Summary (sparse lines) | Schedule C mirror + appendix |
| `cpa_pack` | `00_READ_ME_Summary.pdf`, `Expenses-Detail.csv`, `REC_*`, `02_Expenses_Receipts_Book/` | PRD root files + Line folders + PRD filenames |
| Personal rows | Included in CPA pack | Excluded from audit pipeline |
| Export UI | CPA-centric copy/order | PRD order + audit narrative copy |

---

## 2. Locked product decisions (grill-me 2026-07-04)

| # | Decision |
|---|----------|
| 1 | **Two phases:** M4a PDF+ZIP; M4b QIF (QBO/OFX later) |
| 2 | **Upgrade `cpa_pack` in place** — UI「防审计凭证包」; no new format enum |
| 3 | **`buildScheduleCMirrorPdf`** — shared by `cpa_pdf` download and ZIP Summary PDF |
| 4 | **Full Line 8–27a + Line 28**; unmapped categories → Line 27a; empty lines `$0.00` |
| 5 | ZIP Detail CSV: **`Audit_Image_Path` + `Receipt_Image_URL`** (same relative path) |
| 6 | Disk filenames: **`YYYYMMDD_Merchant_$Amount_001.ext`**; tax-year **global Index**; aligns PDF `Image Ref` |
| 7 | Export panel: **4 buttons**; order PDF → TXF → CSV → ZIP; update copy; hide `xlsx` from UI |
| 8 | **Personal / zero-deductible** excluded from PDF appendix, ZIP expense images, Detail CSV, Index |
| 9 | **Keep `01_Income_Documents/`** + PDF Part I; income **not** in expense Index / `Audit_Image_Path` |
| 10 | Download **`Snap1099-{year}-Audit-Trail.zip`**; inside **`{year}_Tax_Report_Summary.pdf`** + **`{year}_Tax_Report_Data.csv`** |
| 11 | M4b: **5th button** QuickBooks QIF; **deductible rows only** |
| 12 | PDF header: **`userName`** from Google-linked account; Business **`Independent Contractor`**; PRD disclaimer |

---

## 3. Phasing

### 3.1 M4a (this spec — implement first)

- New `buildScheduleCMirrorPdf` (replace `buildCpaPdf` usage for export)
- Audit trail meta on deductible expense rows (`auditIndex`, `auditImagePath`)
- Upgrade `buildCpaPackZip` + Detail CSV builder
- Export UI copy/order
- **Unchanged:** TurboTax `csv`, `txf` pipelines (still use full `enrichedExpenseRows` including Personal where applicable)

### 3.2 M4b (follow-up plan)

- `format=qif` in API + `buildQifExport.ts`
- 5th Export button
- Download `Snap1099-{year}-QuickBooks.qif`
- QIF: `!Type:Cash`, negative `T`, `LJob Expenses:{displayName} (Line N)`, `FITID` = stable receipt id prefix (e.g. `SNPTX{receiptId}`)
- QBO/OFX: **Out of scope**

---

## 4. Architecture

### 4.1 Pipeline

```
PG receipts (tax-pack route)
  → buildExportExpenseRow
  → finalizeExportRows                    → allExpenseRows (csv / txf)
  → auditEligibleRows (deductible)        → assignAuditTrailMeta
       → buildScheduleCMirrorPdf          → cpa_pdf + ZIP summary
       → buildAuditDetailCsv             → ZIP data CSV
       → buildCpaPackZip (expense images) + incomeRows (01_Income_Documents)
```

Income path unchanged: `buildExportIncomeRow` → PDF Part I + ZIP `01_Income_Documents/` (no audit Index).

### 4.2 Audit eligibility

```typescript
function auditEligibleRows(rows: ExportExpenseRow[]): ExportExpenseRow[] {
  return rows.filter((r) => r.deductible && r.exportAmount > 0);
}
```

Matches TXF skip-non-deductible behavior. Personal rows remain in App history and in TurboTax CSV (existing behavior).

### 4.3 `assignAuditTrailMeta`

- Input: audit-eligible rows, already sorted by capture order (route uses `capturedAt: asc`)
- Assign `auditIndex`: `"001"` … `"NNN"` (3-digit zero-padded, tax-year global for this export)
- Build `auditImagePath`: `{zipFolderName}/{auditFilename}` where:
  - `zipFolderName` from `scheduleCLines.ts` / category mapping (PRD root-level `Line_09_Car_and_truck_expenses/`, etc.)
  - `auditFilename`: `{YYYYMMDD}_{Merchant}_${exportAmount}_{auditIndex}.jpg` (amount 2 decimals, `$` prefix in filename per PRD)
- Set `receiptArchivePath` = `auditImagePath` for audit pack assembly (supersedes `02_Expenses_Receipts_Book/REC_*` for `cpa_pack` only)
- TurboTax `receiptAlias` (`REC_*`) unchanged for standalone CSV

### 4.4 `scheduleCLines.ts` (new)

Fixed ordered table for mirror PDF Part II (amounts computed at render time):

| Line key | IRS label (English) | ZIP folder (when non-empty) |
|----------|---------------------|-----------------------------|
| 8 | Advertising | `Line_08_Advertising` |
| 9 | Car and truck expenses | `Line_09_Car_and_truck_expenses` |
| 10 | Commissions and fees | `Line_10_Commissions_and_fees` |
| 11 | Contract labor | `Line_11_Contract_labor` |
| 13 | Depreciation | `Line_13_Depreciation` |
| 14 | Employee benefit programs | `Line_14_Employee_benefit_programs` |
| 15 | Insurance (other than health) | `Line_15_Insurance` |
| 16 | Interest | `Line_16_Interest` |
| 17 | Legal and professional services | `Line_17_Legal_and_professional` |
| 18 | Office expense | `Line_18_Office_expense` |
| 20 | Rent or lease | `Line_20_Rent_or_lease` |
| 21 | Repairs and maintenance | `Line_21_Repairs_and_maintenance` |
| 22 | Supplies | `Line_22_Supplies` |
| 23 | Taxes and licenses | `Line_23_Taxes_and_licenses` |
| 24a | Travel | `Line_24a_Travel` |
| 24b | Deductible meals | `Line_24b_Deductible_meals` |
| 27a | Other expenses | `Line_27a_Other_expenses` |
| 28 | Total expenses (computed) | — |

**Summation:** Sum `exportAmount` of audit rows grouped by `scheduleCLine` (map line key from `Line 9` → `9`). Unmapped app categories continue to roll into Line 27a via `exportCategoryMapping`.

**Zero rows:** Every line 8–27a appears in PDF with `$0.00` when no audit rows map there.

Update `exportCategoryMapping.ts` zip folder names to match PRD root folders (remove `02_Expenses_Receipts_Book/` prefix for audit paths).

---

## 5. `buildScheduleCMirrorPdf`

**File:** `lib/export/buildScheduleCMirrorPdf.ts`

**Inputs:**

- `taxYear: string`
- `taxpayerName: string` — `user.userName ?? "SnapTax User"` (Export route must `select: { userName: true, ... }`)
- `businessIndustry: string` — constant `"Independent Contractor"` for M4a
- `auditRows: ExportExpenseRow[]` — post-`assignAuditTrailMeta`
- `incomeRows: ExportIncomeRow[]`

**Sections:**

1. **Header** — Tax Year (bold); Taxpayer Name; Business/Industry; disclaimer (PRD verbatim)
2. **Part II mirror table** — all lines from `scheduleCLines.ts`; Amount column; optional short example column omitted in MVP (keep table compact)
3. **Line 28 total** — sum of Part II amounts
4. **Part I Income** — reuse `summarizeIncomeRows` + 1099 form list (existing `buildCpaPdf` behavior)
5. **Appendix** — audit rows only; group by `scheduleCLine`; within group sort date descending; columns: Date, Merchant, Amount (`exportAmount`), Memo/Notes, **Image Ref** (`auditIndex`), optional relative path

**Style:** Black/white, Helvetica, minimal layout (Industrial Rugged); reuse pdfkit patterns from `buildCpaPdf.ts`.

**Consumers:**

- `format=cpa_pdf` → buffer returned as download
- `format=cpa_pack` → embedded as `{year}_Tax_Report_Summary.pdf`

**Download filename (cpa_pdf):** `Snap1099-{year}-Schedule-C-Mirror.pdf`

Deprecate direct use of `buildCpaSummaryPdf` for export; keep file as thin wrapper or remove after migration.

---

## 6. Audit ZIP (`cpa_pack`)

### 6.1 External / internal names

| Item | Name |
|------|------|
| HTTP download | `Snap1099-{year}-Audit-Trail.zip` |
| ZIP root PDF | `{year}_Tax_Report_Summary.pdf` |
| ZIP root CSV | `{year}_Tax_Report_Data.csv` |

Replace `00_READ_ME_Summary.pdf` and `Expenses-Detail.csv`.

### 6.2 ZIP layout

```text
Snap1099-2025-Audit-Trail.zip
├── 2025_Tax_Report_Summary.pdf
├── 2025_Tax_Report_Data.csv
├── 01_Income_Documents/
│   └── 1099_NEC_{Payer}_{YYYYMMDD}.jpg
├── Line_09_Car_and_truck_expenses/
│   └── 20250214_Shell_Gas_$75.50_001.jpg
└── Line_22_Supplies/
    └── 20251025_HomeDepot_$340.00_004.jpg
```

Expense images: audit-eligible rows only. Income images: existing `incomeArchivePath` (unchanged naming).

### 6.3 `buildAuditDetailCsv`

Columns (UTF-8, RFC 4180, no BOM):

| Column | Source |
|--------|--------|
| Date | `dateIso` |
| Category | `categoryDisplay` or Schedule C line label |
| Merchant | `merchant` |
| Amount | `exportAmount` |
| Memo | `notes` |
| Audit_Image_Path | `auditImagePath` |
| Receipt_Image_URL | same value as `Audit_Image_Path` |

Rows: audit-eligible only. Income documents not in this CSV.

### 6.4 Missing Blob images

Keep current behavior: skip missing image bytes; expose `X-Export-Images-Included`, `X-Export-Images-Eligible`, `X-Export-Images-Missing` headers.

---

## 7. API & UI

### 7.1 `POST /api/export/tax-pack`

For `cpa_pdf` / `cpa_pack`:

1. Build `enrichedExpenseRows` as today
2. `auditRows = assignAuditTrailMeta(auditEligibleRows(enrichedExpenseRows))`
3. Load `userName` for PDF header
4. Call new builders

Other formats unchanged.

### 7.2 `ExportEngineSheet` (M4a)

Step 2 button order and copy (i18n keys in `locales`):

| Order | `format` | User-facing intent |
|-------|----------|-------------------|
| 1 | `cpa_pdf` | Schedule C mirror PDF (FreeTaxUSA) |
| 2 | `txf` | Tax software TXF |
| 3 | `csv` | TurboTax CSV |
| 4 | `cpa_pack` | 1099 audit receipt pack (ZIP) |

Update hints per PRD. Do not surface `xlsx` in UI.

### 7.3 `lib/client/authApi.ts`

Update suggested filename for `cpa_pack` and `cpa_pdf` to match §5 and §6.1.

### 7.4 M4b additions (not in M4a implementation)

- Extend `ExportFormat` with `qif`
- Route branch + `buildQifExport.ts`
- 5th button in Export sheet

---

## 8. Files to create / modify (M4a)

| Action | Path |
|--------|------|
| **Create** | `lib/export/scheduleCLines.ts` |
| **Create** | `lib/export/buildScheduleCMirrorPdf.ts` |
| **Create** | `lib/export/assignAuditTrailMeta.ts` |
| **Create** | `lib/export/auditEligibleRows.ts` |
| **Create** | `lib/export/buildAuditDetailCsv.ts` |
| **Create** | `lib/export/mapping/auditImageNaming.ts` (or extend `receiptNaming.ts`) |
| **Modify** | `lib/tax/exportRows.ts` — optional `auditIndex`, `auditImagePath` |
| **Modify** | `lib/export/mapping/exportCategoryMapping.ts` — PRD zip folder names |
| **Modify** | `lib/export/buildCpaPack.ts` — root file names, audit row filter |
| **Modify** | `app/api/export/tax-pack/route.ts` — pipeline + filenames + userName |
| **Modify** | `components/export/ExportEngineSheet.tsx` + i18n |
| **Modify** | `lib/client/authApi.ts` — download names |
| **Deprecate** | `buildCpaPdf.ts` export usage (tests migrate to mirror PDF) |

---

## 9. Testing

| Test | Assert |
|------|--------|
| `auditEligibleRows.test.ts` | Personal / zero deductible excluded |
| `assignAuditTrailMeta.test.ts` | Index 001…N; path formula; `$` in filename |
| `scheduleCLines.test.ts` | 18 Part II lines + order |
| `buildAuditDetailCsv.test.ts` | Dual path columns equal |
| `buildScheduleCMirrorPdf.test.ts` | PDF text contains `Line 8`, `$0.00`, disclaimer |
| `buildCpaPack.test.ts` | ZIP contains `{year}_Tax_Report_*`, not `00_READ_ME` |
| Regression | `npm run test:unit`; existing TXF/CSV tests green |

---

## 10. Out of scope

- QBO / OFX export
- Mileage log CSV
- SSN / NAICS auto-fill
- Export-time name/industry form (M4a uses Google `userName` + fixed industry)
- Changing TurboTax CSV row inclusion for Personal
- Local-only export path changes (server `tax-pack` is canonical for paid export)

---

## 11. Success criteria (M4a)

1. User with deductible receipts downloads Schedule C PDF with **all** Part II lines and `$0.00` where empty
2. Audit ZIP internal CSV `Audit_Image_Path` opens matching image under correct `Line_*` folder
3. PDF appendix `Image Ref` matches filename suffix `_001` etc.
4. Personal receipts absent from audit ZIP expense folders and Detail CSV
5. 1099 images still present under `01_Income_Documents/` when captured
6. Export panel shows 4 buttons in PRD order with updated copy
