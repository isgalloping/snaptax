# Home Header Install Button — Design

**Date:** 2026-06-19  
**Status:** Approved  
**Scope:** TaxHeader install button — larger touch target, blue-collar-friendly icon + label.

## Summary

Replace icon-only phone+plus install button with home-screen grid icon + `ADD HOME` short label. Unify all three header action buttons to ≥64px touch targets. Install flow unchanged.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Touch target | All header actions ≥64px |
| Install label | EN `ADD HOME`; icon = app grid + down arrow |
| Pattern | Match CPA/IRS icon + short text stack |
| Behavior | Same `pwaInstall.install()` when `header-button` mode |
| Bottom bar | Unchanged |

## Files

- `TaxHeader.tsx`, `HomeScreenAddIcon.tsx` (or icon update)
- `homeVisual.ts`, `lib/i18n/*`, `PRODUCT-SPEC.md`
