# Home Dashboard Redesign — Design

**Date:** 2026-06-17  
**Status:** Approved (design)  
**References:** `docs/ui/snaptax-home-ui.png` · `docs/ui/snaptax-home-trustbar.png`  
**Scope:** Home screen layout refactor — Trust Bar, 4 insight Widgets, scroll region, full-screen overlays; client-side placeholder data; no PDF export.

## Summary

Redesign the Snap1099 home screen to match the new dashboard mockups while keeping MVP backend unchanged. Fixed chrome (Tax Header + Snap + Trust Bar) stays pinned; Widget stack and receipt list share one scroll region. Widget metrics are computed client-side from receipts, calendar, and industry hints. Sub-flows use in-Home full-screen overlays (`viewState`), not new routes. Export remains Excel IRS Tax Pack via existing Google/Paddle gate.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Scope | Visual shell + client-side computed placeholder data |
| PDF/CSV | **Out of scope** — CPA Ready uses existing Excel export |
| Trust Bar | Bar UI only from trustbar mockup; **Learn more** → full-screen overlay (4 trust points), not center modal |
| Scroll | **Fixed:** TaxHeader + SnapButton + TrustBar · **Scroll:** WidgetStack + ReceiptList |
| Sub-flows | Home `viewState` full-screen overlay + `< BACK` |
| Widget data | Client rules (US quarterly calendar, industry hints, tax-year extrapolation) |
| Implementation | **方案 1** — Home Shell decomposition |

## Layout & information architecture

```
┌─ Fixed (no scroll) ──────────────────────────────┐
│ TaxHeader: Est. Tax Saved + Export/Sync/Filter/Settings │
│ SnapButton: full-width yellow SNAP RECEIPT + compliance footnote │
│ TrustBar: one-line privacy + Learn more                         │
├─ Scroll region (flex-1 min-h-0 overflow-y-auto) ────────────────┤
│ WidgetStack (4 colored cards)                                     │
│ ReceiptFilterBar + ReceiptList                                    │
└──────────────────────────────────────────────────────────────────┘
```

### viewState (within Home, not new routes)

| State | Trigger | Dismiss |
|-------|---------|---------|
| `home` | default | — |
| `deadline-detail` | Widget 1 **View Details** | `< BACK` |
| `missing-deductions` | Widget 2 **Review** | `< BACK` |
| `missing-deduction-item` | tap list item | `< BACK` → list |
| `privacy-trust` | Trust Bar **Learn more** | `< BACK` or **Got it** |

`view === "settings"` remains the only second logical page.

### PRODUCT-SPEC updates

1. **§2.1 Layout:** Allow vertical scroll inside the home **content region** (widgets + receipts). Prohibit whole-page `body` scroll only; fixed snap zone stays visible.
2. **§2.3.2 Trust Bar exception:** Trust Bar is an always-visible one-line reassurance strip (not a blocking first-receipt card). Compliance footnote under Snap **remains**.

### Onboarding coexistence

- Existing: `GoogleBackupNudge`, `SnapFocusRing`, `SnapTooltip`, Aha Coach on TaxHeader export — unchanged.
- When any overlay is open, pause `ProcessingReceiptWatcher` (same rule as Settings/camera).

## Trust Bar

Align `docs/ui/snaptax-home-trustbar.png` **bar portion only**.

| Token | Value |
|-------|-------|
| Background | `#1A1A1A` |
| Border | optional `1px #2A2A2A` |
| Radius | `16px` |
| Icon | green shield checkmark, `20px` |
| Copy | `Your receipts stay private. Never shared with IRS. Stored securely in the U.S.` |
| Link | green `Learn more >`, touch target ≥ 44px |
| States | **Default only** in this phase; Info/Emphasis reserved for future |

### Privacy Trust overlay (Learn more)

Full-screen black overlay (not center modal), `< BACK` top-left:

1. **100% Private** — only you see receipts; never shared with IRS  
2. **Secure in the U.S.** — encrypted, stored in U.S. data centers  
3. **We Don't Sell Data** — no ads, no tracking, no selling  
4. **You're in Control** — delete anytime from Settings  

Bottom: yellow **Got it**. Copy in i18n (`en-US` first).

## Widget stack

Shared card pattern: rounded `16px`, tinted background per widget, label uppercase muted, hero metric large, CTA link/button on the right.

### Widget 1 — Tax Deadline (purple)

**Module:** `lib/home/computeTaxDeadline.ts`

- US estimated tax dates: **Apr 15, Jun 15, Sep 15, Jan 15** (next business day if weekend; simple rule sufficient for MVP).
- Pick the nearest future deadline in the user's local timezone.
- Map to **Q1–Q4 Estimated Tax** label.
- **Days left** drives headline (`Due in N Days`) and urgency color:
  - Green: `> 30` days
  - Yellow: `14–30` days
  - Red: `< 14` days
- **Projected Payment:** `max(0, taxYearDeductions(receipts, year) × 0.25 / 4)`; show `$—` when no done receipts.

**Deadline detail overlay:**

- Large circular countdown (days left).
- Summary rows: **Income**, **Expenses**, **Net Profit** from current-year `done` receipts (`SUM(amount)`; profit = income − expenses).

### Widget 2 — Missing Deductions (green)

**Modules:** `lib/home/industryDeductionHints.ts`, `lib/home/computeMissingDeductions.ts`

Industry → suggested tracking items (3 each, examples):

| Industry | Hints |
|----------|-------|
| truck_driver | Vehicle Mileage, Phone Usage, Safety Gear |
| construction | Tools & Equipment, Safety Gear, Vehicle Mileage |
| plumber | Tools & Equipment, Vehicle Mileage, Supplies |
| electrician | Tools & Equipment, Safety Gear, Vehicle Mileage |
| delivery | Vehicle Mileage, Phone Usage, Parking & Tolls |
| general | Phone Usage, Home Office, Professional Services |

- **Tracked:** current tax year has a `done` receipt whose category fuzzy-matches the hint (e.g. `TOOLS` → Tools & Equipment).
- **Missing:** hints not yet tracked; show up to 3 on card + **Review**.
- **Amount:** per-hint default estimate × `TAX_US_MARGINAL_RATE` (default 0.25); total = sum of missing hints. Display `$—` when none missing.
- If no missing items: hide widget or show compact “You're on track” (prefer **hide** to reduce noise).

**Review overlay flow:**

- List missing items → item detail (why it matters) → **Start Tracking** closes overlay and scrolls to Snap zone (no modal).

### Widget 3 — Tax Year Progress (blue)

**Module:** `lib/home/computeTaxYearProgress.ts`

- `year` = calendar year in user local timezone.
- `progressPct` = elapsed days / (366 if leap else 365), rounded integer.
- `projectedSavings` = when `taxSaved > 0`: `taxSaved × (365 / elapsedDays)`; else `$—`.
- Horizontal progress bar; optional CSS sparkline decoration (no chart library).

### Widget 4 — CPA Ready (orange)

- `readyCount` = unfiled `done` receipts (same corpus as Est. Tax Saved).
- Copy: `{n} receipts organized`.
- **Export** → existing `handleExportClick` / `useTaxExportGate` (Excel IRS Tax Pack).
- Subcopy: **Excel tax pack** (not PDF/CSV from mockup).

## Tax header & list

### Header actions

- Keep: Export, Sync, Settings (product-required).
- Add: **Filter** icon per mockup — on tap, `scrollIntoView` ReceiptFilterBar + brief highlight pulse.

### Receipt filter tabs

Primary tabs aligned to mockup: **ALL · READY · PROCESSING** (`READY` = `done`).

- Retain **Blurry** and **Stuck ⚠️** at the end of the horizontal pill row (scroll overflow); show Stuck pill when `stuckCount > 0`.

### Receipt list cards

Existing `ReceiptListCard` layout is largely aligned; minor spacing/radius tweaks only.

## Implementation architecture (recommended)

```
HomeScreen
├── HomeFixedChrome (TaxHeader + SnapButton + TrustBar)
├── HomeScrollRegion (WidgetStack + ReceiptList)
└── HomeOverlayHost (viewState overlays)
```

Widget metrics aggregated in `lib/home/computeHomeWidgets.ts` (pure functions, unit-tested).

## Files

| Path | Action |
|------|--------|
| `lib/home/computeTaxDeadline.ts` | **New** |
| `lib/home/computeMissingDeductions.ts` | **New** |
| `lib/home/industryDeductionHints.ts` | **New** |
| `lib/home/computeTaxYearProgress.ts` | **New** |
| `lib/home/computeHomeWidgets.ts` | **New** |
| `lib/home/*.test.ts` | **New** — compute unit tests |
| `components/home/TrustBar.tsx` | **New** |
| `components/home/HomeScrollRegion.tsx` | **New** |
| `components/home/HomeOverlayHost.tsx` | **New** |
| `components/home/widgets/TaxDeadlineWidget.tsx` | **New** |
| `components/home/widgets/MissingDeductionsWidget.tsx` | **New** |
| `components/home/widgets/TaxYearProgressWidget.tsx` | **New** |
| `components/home/widgets/CpaReadyWidget.tsx` | **New** |
| `components/home/widgets/WidgetStack.tsx` | **New** |
| `components/home/overlays/DeadlineDetailOverlay.tsx` | **New** |
| `components/home/overlays/MissingDeductionsOverlay.tsx` | **New** |
| `components/home/overlays/MissingDeductionItemOverlay.tsx` | **New** |
| `components/home/overlays/PrivacyTrustOverlay.tsx` | **New** |
| `components/home/HomeScreen.tsx` | Recompose shell + viewState |
| `components/home/TaxHeader.tsx` | Filter icon |
| `components/home/ReceiptList.tsx` | Accept WidgetStack slot / lifted filter ref |
| `lib/ui/homeVisual.ts` | Widget + TrustBar tokens |
| `lib/i18n/locales/en-US.ts` (+ fr/de as follow-up) | New strings |
| `docs/product/PRODUCT-SPEC.md` | §2.1 scroll, §3 IA, Trust Bar note |

## Unchanged

- Camera batch / postReview / resnap / `ReceiptDetailSheet`
- Ghost → Google gates, Paddle paywall, Excel export pipeline
- Est. Tax Saved = `SUM(tax_amount)` (no client ×0.25)
- Offline IndexedDB queue
- Bottom Sheet for Terms/Privacy/Legal (Trust overlay is separate educational UI)

## Out of scope (this phase)

- PDF or CSV export picker
- Trust Bar Info/Emphasis rotation
- Center Privacy modal from trustbar mockup
- Server APIs for deadlines or AI missing-deduction detection
- EU-specific widget calendar/copy (US calendar for MVP; EU follow-up)

## Testing

1. Zero receipts: widgets show `$—` / empty states; no crashes.
2. Deadline urgency colors change at 30 / 14 day boundaries.
3. Industry change updates missing-deduction hints.
4. CPA Export still enforces Google → Paddle gate.
5. Overlays pause processing watcher; BACK restores home scroll position.
6. Fixed chrome does not scroll; widgets + list do.
7. `npm run test:unit` covers `lib/home/*` compute functions.

## Success criteria

- Home matches mockup structure: fixed header/snap/trust + scrollable widgets + list.
- All widget CTAs navigate to designed overlays; Export uses existing tax pack flow.
- Trust Bar visible without blocking snap; Learn more opens trust overlay.
- No regression in snap, upload, sync, onboarding, or export gates.
