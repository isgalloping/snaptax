# Founder Widget Copy — Design

**Date:** 2026-07-02  
**Status:** Approved (brainstorming + grill-me「一颗雷」)  
**Scope:** Replace SaaS-style Founder Program label with blue-collar hook + dynamic price/scarcity on the home widget.

**References:** `docs/superpowers/specs/2026-07-03-founder-widget-marking-v1-design.md`, `docs/superpowers/specs/2026-07-02-founder-widget-pager-layout-design.md`, `docs/superpowers/specs/2026-06-30-founder-program-widget-design.md`

---

## Problem

| Issue | Why it fails |
|-------|----------------|
| Label **「Founder Program」** | No meaning for 1099 contractors; wastes the only uppercase hook line |
| Subtitle **「Be one of the first 50 founders」** | No money, no urgency; reads like startup newsletter |
| Static copy | Widget already fetches `/api/founder/program`; price tier is knowable at render time |

Pager layout (option B) fixed truncation but did not fix **message**.

## Decision —「一颗雷」

Drop **Founder Program** as the widget headline. Lead with **scarcity + price + export**, not membership branding.

| Layer | en-US copy | Notes |
|-------|------------|--------|
| Label | `FIRST 50 ONLY` | Uppercase hook; replaces program name |
| Main line | `{price} export this season` | Dynamic from next-seat tier (flags: $5 / $10 / $15 / $29) |
| Scarcity | `{remaining} spots left` | From API `remaining` (50 − claimed) |
| CTA | `See deal >` | Action, not「View program」 |
| Loading | `Lock export price · first 50` | Before program fetch resolves |

Sheet title aligned to **`First 50 Deal`** (sentence case; widget stays shouty).

## Copy rules

- **Do:** short, ALL CAPS label, dollar amount, export/tax season, spots left  
- **Don't:**「Founder Program」,「$X forever」, SaaS tier names on widget  
- **Don't:** promise lifetime price — product is **per-season lock** at founder tier

## Data wiring

```
GET /api/founder/program
  → claimedCount, remaining, programOpen, tiers, user
  → resolveDisplayTier({ claimedCount, programOpen, user })
  → priceUsd = tiers[displayTier].priceUsd
  → FounderProgramWidget { priceUsd, remaining }
```

Shared helper: `lib/founder/resolveDisplayTier.ts` (same logic as FounderProgramSheet).

## Visual structure

Match Need Action widget hierarchy:

1. Optional 👑 + NEW badge row  
2. 9px uppercase label (`FIRST 50 ONLY`)  
3. 14px bold white main line (price + export)  
4. 9px zinc scarcity line  
5. Underlined CTA

Full-width page 1 (pager layout spec) gives room for price + scarcity without ellipsis.

## i18n

Keys under `home.widgets.founder`:

- `label`, `subtitle` (`{price}`), `subtitleLoading`, `scarcity` (`{remaining}`), `view`, `newBadge`

fr-FR / de-DE: English marketing strings for MVP (same as other founder strings).

## Unchanged

- `isFounderWidgetVisible` (hide when active founder, full, flag off)  
- FounderProgramSheet flow (Google → Paddle); only sheet **title** string updated  
- Tier pricing source: Vercel Flags → `founderConfig` → API `tiers`

## Implementation

- [x] `resolveDisplayTier` extracted + tests  
- [x] `WidgetStack` builds `founderPreview` from program API  
- [x] `FounderProgramWidget` dynamic copy + loading fallback  
- [x] i18n en-US / fr-FR / de-DE + types

## Out of scope

- A/B label variants (LOCK YOUR PRICE vs FIRST 50 ONLY)  
- Localized fr/de marketing rewrite  
- Analytics event payload changes beyond existing impression/tap
