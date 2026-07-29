# Need Action Widget Slot + CPA /IRS Ready Label — Design

**Date:** 2026-06-18  
**Status:** Approved (brainstorming)  
**Scope:** Widget pager ordering when ACTION-bucket receipts exist; rename CPA export label to **CPA /IRS Ready**.

**Supersedes (partial):** `docs/superpowers/specs/2026-06-17-home-v2-first-screen-design.md` §4 (4th-slot Need Action / tax-season CPA exclusivity).

---

## Summary

When the user has receipts in the **ACTION** bucket (`blurry` or `photoMissing`), show **Need Action** as the **2nd widget** on the first page so blue-collar workers see it without swiping. During tax season, if both ACTION receipts and **CPA /IRS Ready** apply, order is: `[Missing?]` · **Need Action (#2)** · **CPA /IRS Ready (#3)** · Deadline · Progress.

When only CPA applies (no ACTION), keep CPA in the **4th** slot (unchanged).

---

## Decisions

| Topic | Choice |
|-------|--------|
| Trigger | `actionCount` from `countReceiptBuckets(…).action` |
| Need Action position | **#2** when `actionCount > 0` |
| CPA + ACTION (tax season) | **#3** CPA /IRS Ready |
| CPA alone | **#4** (legacy order) |
| CPA label | **CPA /IRS Ready** (space before `/IRS`) in header aria + widget label |
| Header caption | **CPA /IRS** under export icon |

---

## Widget order matrix

| Missing | ACTION | CPA | Result order |
|---------|--------|-----|--------------|
| — | — | — | Deadline · Progress |
| ✓ | — | — | Missing · Deadline · Progress |
| — | — | ✓ | Deadline · Progress · CPA |
| ✓ | — | ✓ | Missing · Deadline · Progress · CPA |
| — | ✓ | — | Deadline · **Need Action** · Progress |
| ✓ | ✓ | — | Missing · **Need Action** · Deadline · Progress |
| — | ✓ | ✓ | Deadline · **Need Action** · **CPA** · Progress |
| ✓ | ✓ | ✓ | Missing · **Need Action** · **CPA** · Deadline · Progress |

---

## `buildWidgetPageKeys` algorithm

```ts
if (hasMissing) keys.push("missing");
if (hasAction) {
  if (!hasMissing) keys.push("deadline");
  keys.push("needAction");
  if (hasCpa) keys.push("cpa");
  if (hasMissing) keys.push("deadline", "progress");
  else keys.push("progress");
} else if (hasCpa) { ... }
  keys.push("deadline", "progress", "cpa");
} else {
  keys.push("deadline", "progress");
}
```

Remove `resolveFourthWidgetKey`; parameter `blurryCount` → `actionCount`.

---

## i18n

| Key | en-US |
|-----|-------|
| `home.taxHeader.cpaIrsReady` | `CPA /IRS Ready` |
| TaxHeader visible caption | `CPA /IRS` |
| `home.widgets.cpa.label` | `CPA /IRS Ready` |
| `home.widgets.needAction.actionCount` | `{count} receipt(s) need action` |

de-DE / fr-FR: equivalent spacing before `/IRS`.

---

## Files

| File | Change |
|------|--------|
| `lib/home/buildWidgetPages.ts` | New ordering; `actionCount` param |
| `lib/home/buildWidgetPages.test.ts` | Matrix tests |
| `components/home/HomeScreen.tsx` | `actionCount` from buckets |
| `WidgetStack` / `WidgetPager` / `NeedActionWidget` | `actionCount` prop |
| `TaxHeader.tsx` + locales | CPA /IRS labels |
| `docs/product/PRODUCT-SPEC.md` | Widget order note |

---

## Acceptance

1. ACTION receipts → Need Action visible as 2nd card on page 1 (with or without Missing).
2. Tax season + ACTION → #2 Need Action, #3 CPA /IRS Ready on same page when ≤3 cards after Missing, or first page includes both before swipe.
3. CPA-only → CPA remains 4th slot.
4. `actionCount` includes blurry + photoMissing.
5. Header + CPA widget show **CPA /IRS Ready** wording.

---

## Spec self-review

- No placeholders. Ordering table matches user-approved tax-season rule. Scope: builder + props + i18n only.
