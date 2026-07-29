# Export PDF Serverless Fix — Design

**Date:** 2026-06-19  
**Status:** Approved  
**Scope:** Fix CPA Summary PDF export on Vercel; improve client timeout and progress UX.

## Problem

CSV and CPA Audit Pack (ZIP) export succeed; **CPA Summary PDF (`cpa_pdf`) hangs** at Step 4 ("Fetching receipt images…") and never completes.

**Root cause:** PDFKit requires `node_modules/pdfkit/js/data/*.afm` font files via filesystem. Next.js serverless bundles often omit these files → PDF generation fails or hangs while CSV/ZIP paths (no PDFKit) work.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Primary fix | **PDFKit bundling** — `serverExternalPackages` + `outputFileTracingIncludes` |
| Fallback | pdf-lib rewrite only if bundling fix fails in production |
| `maxDuration` | 60s on `app/api/export/tax-pack/route.ts` |
| PDF error code | `PDF_GENERATION_FAILED` (500) |
| Client timeout | 90s AbortController on `exportTaxPack` |
| Progress copy | `cpa_pdf` uses "Building PDF…" not "Fetching receipt images…" |

## Files

| Path | Action |
|------|--------|
| `next.config.ts` | PDFKit trace includes |
| `app/api/export/tax-pack/route.ts` | maxDuration + PDF try/catch |
| `lib/export/buildCpaPdf.test.ts` | New unit test |
| `lib/client/authApi.ts` | Fetch timeout + error codes |
| `components/export/ExportEngineSheet.tsx` | PDF progress + error messages |
| `lib/i18n/types.ts` + en/de/fr | New copy keys |

## Success criteria

- PDF export completes for 34+ receipts on Preview/Production
- `buildCpaPdf.test.ts` passes locally and in CI
- CSV/ZIP unchanged
- PDF failure or 90s timeout shows clear error, not infinite loading
