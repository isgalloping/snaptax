# Export Empty Receipts UX — Design

**Date:** 2026-06-15  
**Status:** Approved  
**Scope:** Gate block, Step 1 feedback, default tax year when no exportable receipts.

## Problem

- CONTINUE uses `disabled` when `yearReceipts.length === 0` — mobile yellow button still looks tappable, no feedback ("click无效").
- Export sheet opens even when user has zero `done` receipts.
- Default tax year is calendar year (2026) even when receipts exist only in other years.

## Solution

1. **`lib/tax/exportGate.ts`** — `hasExportableReceipts`, `pickDefaultExportTaxYear`
2. **Gate** — After `onPreExportPrepare`, if no exportable `done` receipts → show `noDeductibleReceipts`, do not open sheet. `onPreExportPrepare` returns merged receipts for accurate post-sync check.
3. **Step 1** — Default year = first year with receipts; inline red hint when selected year empty; CONTINUE always clickable with explicit validation message.
4. **i18n** — `exportEngine.noDeductibleReceipts` (en/de/fr)

## Acceptance

1. Zero done receipts: Settings shows reminder, sheet does not open.
2. Step 1 zero receipts for selected year: red hint + CONTINUE shows same message on tap.
3. Receipts only in 2025: default selects 2025, CONTINUE works.
4. Unit tests + build pass.
