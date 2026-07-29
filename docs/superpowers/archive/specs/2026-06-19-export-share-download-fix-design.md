# Export Share vs Download Fix — Design

**Date:** 2026-06-19  
**Status:** Implemented  
**Scope:** CPA Audit Pack Step 4 — stop share failures from triggering duplicate downloads.

## Problem

`shareTaxPackFile` fell back to `<a download>` when `navigator.share({ files })` failed. Large ZIP files often cannot be shared on Android Chrome, causing an automatic download on generate complete and a second download when tapping Share.

## Solution

- Gate with `navigator.canShare({ files })` when available
- Return `shared | cancelled | unsupported | failed` — never auto-download from share
- Step 4: primary **Save to Phone** (download); **Share** only when `canShare`
- Auto-open share sheet only when `canShare` is true

## Files

- `lib/export/shareTaxPack.ts`, `shareTaxPack.test.ts`
- `components/export/ExportEngineSheet.tsx`
- `lib/i18n/*`, `docs/tech/08-export.md`
