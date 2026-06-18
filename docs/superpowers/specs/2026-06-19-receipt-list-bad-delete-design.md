# Receipt List Bad-State Delete — Design

**Date:** 2026-06-19  
**Status:** Approved (design)  
**Builds on:** `2026-06-09-receipt-detail-delete-resnap-design.md`  
**Scope:** One-tap **DELETE** on list cards for bad-state receipts (blurry / processing / paused / photo-missing); done receipts unchanged.

## Problem

Blue-collar users need to discard bad captures (blurry, stuck uploading, analyzing) **without opening the detail sheet**. Today DELETE exists only in `ReceiptDetailSheet`; the list shows **RESNAP** on blurry cards but no delete affordance.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Approach | **Visible DELETE button** on list card (not swipe, not long-press) |
| Eligible states | `blurry`, `processing` (analyzing / uploading), `paused` (sync stuck), `photo-missing` |
| done receipts | **No list delete** — detail + `ReceiptDeleteConfirmSheet` only |
| Confirmation | **Instant delete** for all list-eligible states (same as detail for processing/blurry) |
| Data path | Reuse `handleDeleteReceipt` → `deleteReceiptLocalAndRemote` |
| Undo toast | **Out of scope** (unchanged from 2026-06-09) |
| Touch target | DELETE button ≥ **48px height**, ≥ **64px** preferred width; `active:scale-95` |

## UI

### blurry card

```
[icon]  RECEIPT BLURRY · Need action     [RESNAP] [DELETE]
```

- Row tap (non-button): open detail (unchanged)
- **RESNAP** / **DELETE**: `stopPropagation`; existing RESNAP behavior + new delete

### processing / paused / photo-missing card

```
[icon]  UPLOADING | ANALYSIS PAUSED …     [DELETE]  >
```

- Card tap: detail or retry (unchanged per state)
- **DELETE**: instant delete; does not open detail

### done card

No change — no DELETE on list.

### DELETE button styling

- Background: red (`bg-red-600` or `homeVisual` token if present)
- Label: uppercase **DELETE** (i18n `home.receiptList.delete`)
- Placement: trailing action cluster before chevron (processing) or after RESNAP (blurry)

## Data flow

```typescript
ReceiptListCard.onDelete(id)
  → ReceiptList.onDelete(id)
  → HomeScreen.handleDeleteReceipt(id)  // existing
```

- Unwatch queue / tombstone / tax refresh — unchanged
- If delete fails: non-blocking error on card or toast (match detail pattern; no Modal)

## Files

| Path | Action |
|------|--------|
| `components/home/ReceiptListCard.tsx` | **Modify** — DELETE button for eligible states |
| `components/home/ReceiptList.tsx` | **Modify** — pass `onDelete` prop |
| `components/home/HomeScreen.tsx` | **Modify** — wire `handleDeleteReceipt` to list |
| `lib/i18n/locales/*.ts` | **Modify** — `home.receiptList.delete` (+ optional `deleteFailed`) |
| `lib/i18n/types.ts` | **Modify** — copy keys |
| `docs/product/PRODUCT-SPEC.md` | **Modify** — §12 implementation note (optional) |

**No changes:** `ReceiptDetailSheet` delete logic, done confirm sheet, batch review.

## Testing

### Manual

- blurry list card: DELETE removes row; RESNAP still works
- processing card: DELETE removes; tap elsewhere opens detail
- paused / photo-missing: DELETE removes
- done card: no DELETE visible; detail delete + confirm still works
- Offline delete → no resurrection after sync (existing tombstone tests)

### Regression

- `npm run test:unit` — no new failures
- Onboarding demo processing card: verify coach flow not broken (DELETE optional on demo or same rules)

## Success criteria

- Bad-state receipts deletable in **one tap** from list
- done receipts require detail + confirm (unchanged)
- Touch targets meet product ≥64px guidance
- No new Modal in delete path

## Out of scope

- List swipe-to-delete
- Undo snackbar
- done-state list delete
- Bulk / multi-select delete
