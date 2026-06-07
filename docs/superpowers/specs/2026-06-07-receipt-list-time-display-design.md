# Receipt List Time Display — Design

**Date:** 2026-06-07  
**Status:** Approved (design)  
**Scope:** Unify timestamp display across Processing, Blurry, and Done receipt cards in the home list.

## Problem

The Processing card hardcodes `Just now · Scanning`. Blurry cards show `Tap for details` with no time. Done cards already use `formatReceiptTime`. Users cannot see when a receipt was snapped while it is still processing or blurry.

## Decision

**Approach A (chosen):** Reuse existing `formatReceiptTime` for all three list card states. Detail sheet keeps `formatReceiptDetailDateTime` for full date + time.

Rejected alternatives:
- **B** — `formatReceiptDetailDateTime` in list: too long for mobile subtitles.
- **C** — New `formatReceiptListTime`: extra abstraction without clear benefit.

## UI Specification

### ReceiptCard subtitle (all statuses)

```
{formatReceiptTime(receipt.timestamp, receipt.dataRegion ?? "us")} · {contextLabel}
```

| `status`   | `contextLabel`                    | Example (US, same day)              |
|------------|-----------------------------------|-------------------------------------|
| processing | `receipt.merchant ?? "Scanning"`  | `Today, 2:30 PM · Scanning`         |
| blurry     | `"Tap for details"`               | `Today, 2:30 PM · Tap for details`  |
| done       | `receipt.merchant`                | `Today, 2:30 PM · Starbucks`        |

### Time formatting rules (`formatReceiptTime`, by `dataRegion`)

| Region | Locale  | Same day      | Yesterday        | Older (same year) | Older (other year)   |
|--------|---------|---------------|------------------|-------------------|----------------------|
| us     | en-US   | `Today, 2:30 PM` | `Yesterday, 2:30 PM` | `Jun 7`           | `Dec 31, 2025`       |
| eu     | en-GB   | `Today, 14:30`   | `Yesterday, 14:30`   | `7 Jun`           | `31 Dec 2025`        |

Timezone: browser local (existing behavior). Storage remains UTC ISO 8601.

### ReceiptDetailSheet

No change. Date row continues to use `formatReceiptDetailDateTime(receipt.timestamp, region)`.

## Implementation

| File | Change |
|------|--------|
| `components/home/ReceiptCard.tsx` | Replace `Just now` with `formatReceiptTime`; add time prefix to blurry subtitle; extract shared subtitle helper if it reduces duplication |
| `lib/format.test.ts` | Optional: no new formatter tests required (existing `formatReceiptTime` coverage sufficient) |

**Out of scope:** API, DB, `HomeScreen` timestamp assignment, detail sheet, export.

## Edge Cases

| Case | Behavior |
|------|----------|
| Offline pending upload | Show snap time from `timestamp`, not "Just now" |
| Ghost / no `dataRegion` | Default `"us"` |
| Cross-year receipts | Year included in short date (existing logic) |
| Processing > 24h | Shows `Yesterday, …` or `Jun 5` per calendar rules |

## Testing

1. Snap a receipt → Processing card shows `Today, {time} · Scanning` (not `Just now`).
2. Blurry receipt → `Today, {time} · Tap for details`.
3. Done receipt → unchanged format, still `Today, {time} · {merchant}`.
4. EU region → 24h clock and EU date order in list.
5. `npm run build` passes.

## Success Criteria

- No list card shows "Just now".
- Processing, Blurry, and Done share the same time prefix format.
- Detail sheet full datetime unchanged.
