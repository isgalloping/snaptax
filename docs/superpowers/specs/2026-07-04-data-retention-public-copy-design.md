# Data Retention Public Copy — Design

**Date:** 2026-07-04  
**Status:** Approved (implemented 2026-07-04)  
**Route:** `/data-retention`  
**References:** `docs/superpowers/specs/2026-06-30-compliance-p2-data-lifecycle.md` · `lib/legal/markdownDoc.ts`

## Summary

The public Data Retention page leaked internal repo paths and showed empty sections because `parseLegalMarkdown` skips tables. Rewrite `docs/legal/data-retention.md` as user-facing bullet lists; move code-constant audit tables to `docs/ops/data-retention-code-alignment.md`.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Public copy | Plain English bullets; no `lib/`, `docs/`, `.ts`, IndexedDB/OPFS jargon |
| Retention values | Unchanged: 18mo receipts · 90d local full photos · 24h rate limits · 90d logs · 30d delete target |
| Logs section | No internal doc links; state no receipt images in logs, emails masked |
| Audit alignment | Internal `docs/ops/data-retention-code-alignment.md` |
| Parser | No table support in this phase |
| Settings / i18n | No changes |

## Success criteria

1. `/data-retention` has no internal paths or code identifiers.
2. Every `##` section has visible body content.
3. Numeric retention periods match code constants (verified via ops doc).
