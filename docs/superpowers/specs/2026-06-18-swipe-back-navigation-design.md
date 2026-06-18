# Swipe-Back Navigation — Design

**Date:** 2026-06-18  
**Status:** Approved (design)  
**Scope:** Bidirectional horizontal swipe to go back in full-screen sub-flows; reuse existing BACK handlers; no navigation stack.

## Summary

Add left/right swipe-back on full-screen sub-flows (Home overlays, Settings sub-pages, export flow pages). Swipe triggers the same `onBack` handler as the existing `< BACK` button. Home main screen, Widget pager, Settings root, and Bottom Sheets are excluded. No separate history stack — prevents dead-loop navigation.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Scope | **A** — full-screen sub-flows only; Home ↔ Settings stays button-only |
| Swipe direction | **C** — left or right swipe both trigger back |
| Widget pager | **A** — no swipe-back on home main / widget area |
| Anti-loop | **A** — mirror existing `< BACK` logic; no new stack |
| Animation | None in v1 (instant back on threshold) |

## In scope

### Home overlays (`HomeOverlayHost`)

| Overlay | Swipe `onBack` equivalent |
|---------|---------------------------|
| `privacy-trust` | `onClose` → Home |
| `deadline-detail` | `onClose` → Home |
| `tax-year-detail` | `onClose` → Home |
| `missing-deductions` | `onClose` → Home |
| `missing-deduction-item` | `onNavigate("missing-deductions")` |

### Settings sub-pages (`viewState !== "main"`)

| State | Swipe `onBack` equivalent |
|-------|---------------------------|
| `language` / `industry` / `notifications` / `privacy-center` | `handleHeaderBack` → `main` |
| `sample-export` | `handleHeaderBack` → `main` |
| `export-completed` | `handleHeaderBack` → `main` + sample-done flag |

## Out of scope

- Home main screen and WidgetPager horizontal paging
- `view === "settings"` from Home (Settings header BACK to Home)
- Bottom Sheets: GoogleSignIn, Paywall, ReceiptDetail, Camera, Sign-out confirm, ReferralLearn, Legal, etc.
- Browser / Android system back button (future)
- Swipe-forward or swipe-between-tabs

## Architecture

**Recommended: Shell-layer hook (方案 1)**

```
lib/client/useSwipeBack.ts
        ↓
OverlayShell.tsx          SettingsSubPageShell.tsx
        ↓                           ↓
Home overlay pages          Settings sub-pages
```

Swipe-back is mounted only on shells that already receive `onBack`. No top-level Provider or History API.

## Gesture rules

Touch pipeline: `touchstart` → `touchmove` → `touchend`.

| Condition | Result |
|-----------|--------|
| `\|dx\| ≥ 60px` and `\|dx\| > \|dy\| × 1.5` | Valid horizontal swipe |
| `dx > 0` (right) or `dx < 0` (left) | Both call `onBack()` once |
| Below threshold | No action |
| `enabled === false` or no `onBack` | Ignore |

- Fire `onBack` at most **once per gesture** (on `touchend`).
- Do not prevent default on vertical-dominant moves (preserve overlay scroll).
- Use `{ passive: true }` on move listeners where preventDefault is not needed.

## Dead-loop prevention

Navigation remains the existing directed graph:

```
missing-deduction-item → missing-deductions → (close) → Home
Settings sub-page → main
export-completed → main (+ side effects in handleHeaderBack)
```

No push/pop stack. Swipe cannot navigate to a state that BACK would not reach. Root surfaces (`main`, Home without overlay) do not mount swipe-back.

## Files

| Path | Action |
|------|--------|
| `lib/client/useSwipeBack.ts` | **New** — gesture detection hook |
| `lib/client/useSwipeBack.test.ts` | **New** — threshold / direction tests |
| `components/home/overlays/OverlayShell.tsx` | **Modify** — attach swipe layer |
| `components/settings/SettingsSubPageShell.tsx` | **Modify** — attach swipe layer |

**No changes:** `HomeScreen`, `WidgetPager`, `SettingsScreen` logic (except if export-completed uses shell without swipe — verify `ExportCompletedPage` uses `SettingsSubPageShell`).

## Testing

### Unit

- Horizontal swipe above threshold → `onBack` called once
- Vertical-dominant move → no `onBack`
- Sub-threshold → no `onBack`
- Both positive and negative `dx` trigger back

### Manual

- Each Home overlay: left and right swipe ≡ BACK
- Missing: list → item → swipe → list → swipe → Home
- Settings sub-pages: swipe → main; main has no swipe-back
- Widget pager on Home: unchanged
- Long vertical scroll inside overlay: no accidental back

## Success criteria

- Full-screen sub-flows support bidirectional swipe-back
- Behavior identical to `< BACK` button
- No navigation loops introduced
- Widget pager and sheets unaffected
