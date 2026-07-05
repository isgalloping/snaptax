# Policies Hub Layout & Settings Pricing Links — Design

**Date:** 2026-07-04  
**Status:** Approved  
**Scope:** `/policies` layout + Settings Privacy & Data rows

## Locked decisions

| Topic | Choice |
|-------|--------|
| `/policies` top row | **3-column grid:** Terms · Pricing · Refund |
| `/policies` below | Vertical full-width: Privacy · Data Retention · Security |
| Settings | **Remove** All policies |
| Settings Pricing/Refund | **S1** — two separate full-width `href` rows |
| Style | Existing zinc card, min-h-16, active:scale-95 |
| Responsive | `grid-cols-1 sm:grid-cols-3` on hub top row |

## Settings order

Privacy → Terms → **Pricing** → **Refund** → Data Retention → Security → Data storage → Contact → Delete Account

## Out of scope

- i18n hub page body (English-only hub remains)
- Removing `/policies` route (Paddle Terms and policies URL unchanged)
