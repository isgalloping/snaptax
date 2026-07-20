# Settings Privacy & Data — Grill-Me Locked Design

**Date:** 2026-07-04  
**Status:** Approved (grill-me 7 题)  
**Scope:** Privacy Center `PrivacyDataSection` + `LegalSheet` + legal markdown UX

## Locked decisions (grill-me)

| # | Decision |
|---|----------|
| 1 | **A1** — Extend LegalSheet to show **full Markdown** for Data Retention & Security |
| 2 | **B1** — Legal links **only** in Privacy Center; **remove** duplicate from Preferences accordion |
| 3 | **C1** — Add **All policies → `/policies`** row (`href` full page) |
| 4 | **D1** — Full-page Back: `router.back()`; fallback **`/`** |
| 5 | **E1** — Retention/Security Markdown **English only**; non–en-US Sheet shows i18n *English only* notice |
| 6 | **F1** — All policies opens **`/policies`** full page (Back = D1) |
| 7 | **H1** — Also ship G1–G4: tappable Data storage, Contact DSR note, Markdown inline links, security Related links |

## Implementation notes

- Client Sheet loads Markdown via `GET /api/legal/document?file=` (server reads `docs/legal/`).
- `LegalDoc` union extended: `data-retention` \| `security`.
- Shared `LegalMarkdownSections` renders paragraphs with `[label](/path)` links.

## Out of scope

- FR/DE translations for retention/security markdown (E3 deferred)
- Privacy Center marketing copy changes
- Settings deep-link Back (D2/D3 rejected)
