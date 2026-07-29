# Settings Summary Receipts Count — Design

**Date:** 2026-06-19  
**Status:** Implemented  
**Scope:** `TaxOverviewPanel` Receipts column — show count only.

## Change

Remove `{n} Snapped` suffix from Receipts value. Display numeric `receiptCount` only. Column label `RECEIPTS` and green/grey semantic colors unchanged.

## Files

- `components/settings/TaxOverviewPanel.tsx`
- `lib/i18n/types.ts` + locales (remove `receiptsSnapped`)
- `docs/product/PRODUCT-SPEC.md`
