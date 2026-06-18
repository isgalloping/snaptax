# Settings Share Section Simplify — Design

**Date:** 2026-06-17  
**Status:** Approved  
**Scope:** Settings Share & Referral block — keep WhatsApp / Facebook / More tiles only; remove referral copy, avatars, learn sheet, and grey card wrapper.

## Problem

Share section carries referral marketing UI (CTA, avatars, learn sheet, footnote) without backend. User wants a minimal share row for channel buttons only.

## Decisions

| Topic | Choice |
|-------|--------|
| Share channels | **Keep** WhatsApp, Facebook, More (existing URLs + `shareAppViaNative`) |
| Remove | CTA, avatar strip, Learn how it works, `ReferralLearnSheet`, footnote |
| Container | **B1** — bare `grid-cols-3` row, no `referralCard` wrapper |
| i18n | Drop `cta`, `footnote`, `learnHow`, `learnSheetTitle`, `learnSheetBody` |
| Backend | None — unchanged |

## Layout

```
Export CTA (yellow)
[ WhatsApp ] [ Facebook ] [ More ]   ← mb-6
Preferences list …
```

## Files

| File | Change |
|------|--------|
| `components/settings/ShareAppSection.tsx` | Tiles only |
| `components/settings/ReferralLearnSheet.tsx` | **Delete** |
| `lib/i18n/types.ts` + locales | Remove referral keys |
| `docs/product/PRODUCT-SPEC.md` | Update §Settings [4] |

## Acceptance

- Settings shows only three share tiles below Export
- WhatsApp / Facebook / More behave as before; link-copied notice still works
- No referral sheet or marketing copy
