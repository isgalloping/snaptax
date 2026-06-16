# Export Empty Tip UX — Design

**Date:** 2026-06-15  
**Status:** Approved  
**Scope:** Settings export section — long bar tip above button when no exportable receipts.

## Behavior

- Trigger: gate blocks export (`hasExportableReceipts === false`)
- Placement: above EXPORT button in Settings `TAX SEASON EXPORT` section
- Style: full-width yellow bar (`border-yellow-500/70`, `bg-yellow-950/60`)
- Animation: 5s CSS fade (`opacity 1` → `0`), then clear state
- Other export errors: unchanged bottom `displayError` (offline, failed, etc.)
- Scope: Settings only (not TaxHeader)

## Files

- `components/export/ExportEmptyTip.tsx`
- `app/globals.css` — `@keyframes export-empty-tip-fade`
- `components/export/useTaxExportGate.tsx` — `exportEmptyTip` state
- `components/settings/SettingsScreen.tsx` — layout
