# Founder Widget Pager Layout — Design

**Date:** 2026-07-02  
**Status:** Approved (brainstorming + grill-me option B)  
**Scope:** Fix Founder Program widget subtitle overflow without hiding Deadline / Need Action.

**References:** `docs/superpowers/specs/2026-06-30-founder-program-widget-design.md`, `docs/superpowers/specs/2026-06-18-home-widget-pager-design.md`

---

## Problem

When Founder + 3 operational widgets share one pager row (33% width each), subtitle `"Be one of the first 50 founders"` truncates to `"Be one of the first 5…"`.

## Decision (Option B)

| Topic | Choice |
|-------|--------|
| Founder visible | **Page 1:** `founder` only @ **100%** width |
| Other widgets | **Page 2+:** existing keys (deadline, needAction, progress, cpa…) chunked by 3 |
| Swipe | Show pager dots when `pages.length > 1` (existing WidgetPager behavior) |
| Founder hidden | Unchanged single/multi-page layout (no founder key) |
| Hide triggers | Unchanged: `active` founder, seats full, flag off |

## Unchanged

- `isFounderWidgetVisible` rules
- FounderProgramWidget copy and Sheet
- `buildWidgetPageKeys` key order (founder still prepended when `showFounder`)

## Implementation

- `buildWidgetPages`: if `showFounder && keys[0] === "founder"` → `[["founder"], ...chunkPages(keys.slice(1))]`
- Unit tests for two-page founder + action layout

## Out of scope

- ~~Shorter i18n subtitle~~ → see `2026-07-02-founder-widget-copy-design.md`
- ~~Dynamic `{remaining} seats` on widget~~ → implemented in copy spec
- Increasing card height above 104px
