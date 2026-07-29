# Home Visual Redesign — Design

**Date:** 2026-06-07  
**Status:** Approved (design)  
**Scope:** High-fidelity home screen reskin to match reference mockup — hero gradient header, Snap shutter layout, filter bar, list cards with circular status badges, dual refresh entry points.

## Problem

Current home UI is functionally complete but visually flat compared to the approved reference mockup:

- Plain `zinc-900` header with no atmosphere
- Snap button lacks subtext and trailing chevron
- Receipt cards use emoji icons without circular status badges or right-side status pills
- Refresh only in header; mockup shows **PULL TO REFRESH** in list section header
- Filter bar lacks dedicated sync-stuck shortcut

Business logic (sync budget, polling, retry) must remain unchanged — this is a **visual-only** reskin.

## Reference

User-provided mockup (construction/industrial dark theme, yellow accents, blue analyzing state).

## Decisions

| Topic | Choice |
|-------|--------|
| Fidelity | **A** — high-fidelity match to reference layout |
| Hero background | **C** — CSS gradient simulation (no photo asset) |
| Refresh | **B** — keep header refresh **and** add list **PULL TO REFRESH** (same handler) |
| Filter bar | **C** — ALL / READY / PROCESSING / BLURRY tabs + trailing ⚠️ for **syncStuck only** |
| Processing colors | **C** — Analyzing **blue** · Paused **yellow** · Uploading **yellow** · Done **green** |
| Implementation | **方案 1** — in-place component reskin + shared badge components + `homeVisual.ts` tokens |

## Non-goals

- Native pull-to-refresh gesture (MVP: tap **PULL TO REFRESH** only)
- Changing receipt sync / polling / API behavior
- Settings screen or detail sheet reskin (unless trivial prop passthrough)

---

## §1 Hero header (TaxHeader)

### Layout

Relax compact header slightly for hero feel (high-fidelity over strict 10vh):

| Property | Value |
|----------|-------|
| Container | `min-h-[120px] max-h-[22vh] shrink-0 relative overflow-hidden` |
| Content | `relative z-10 flex items-center justify-between px-4 py-3` |

Remove `border-b-2 border-yellow-500`.

### Background (CSS gradient — no image)

```tsx
<div
  className="absolute inset-0"
  style={{
    background:
      "linear-gradient(180deg, rgba(234,179,8,0.18) 0%, rgba(0,0,0,0.75) 45%, #000 100%)",
  }}
  aria-hidden
/>
```

Optional: subtle top vignette via pseudo-element or second gradient layer.

### Content

| Element | Spec |
|---------|------|
| Title | `ESTIMATED TAX SAVED` · `text-[10px] font-bold uppercase tracking-wider text-zinc-300` |
| Amount | `text-4xl font-black text-yellow-400` (+ existing bounce anim) |
| Subtitle | `{n} receipts • ${total} tracked` · `text-[11px] font-bold text-zinc-400` + small receipt SVG icon left of count |
| Actions (right) | Refresh button + Settings button · `h-11 w-11` · `rounded-xl bg-black/40 border border-zinc-700` |

Settings icon: **sliders** style (`SlidersIcon`) to match mockup; keep `aria-label="Settings"`.

Both refresh buttons call the same `onSyncClick` handler from `HomeScreen`.

---

## §2 Snap shutter (SnapButton)

Keep approved dimensions: `h-[140px] max-h-[18vh] w-full rounded-2xl border-4 border-white bg-yellow-500`.

### Three-column layout

```
┌──────────────────────────────────────────────┐
│  [Camera]   SNAP RECEIPT              [›]    │
│             Take a photo of your receipt     │
└──────────────────────────────────────────────┘
```

| Column | Content |
|--------|---------|
| Left | `CameraIcon` · `h-10 w-10` |
| Center | Primary: `SNAP RECEIPT` · `text-lg font-black uppercase` |
| | Secondary: `Take a photo of your receipt` · `text-xs font-bold opacity-80` |
| | Resnap mode: secondary → `Resnap this receipt` |
| Right | Chevron `›` · `text-3xl font-black leading-none pr-1` |

Button: `flex flex-row items-center justify-between px-5` (not center-only).

Compliance footnote unchanged below (`mt-1.5`).

---

## §3 Filter bar (ReceiptFilterBar)

### Tabs

| id | Label | Icon | countKey |
|----|-------|------|----------|
| `all` | ALL | receipt SVG | `all` |
| `done` | READY | ✓ | `done` |
| `processing` | PROCESSING | ⚙️ | `processing` |
| `blurry` | BLURRY | ❌ or ⚠️ | `blurry` |

### Trailing stuck shortcut

Separate pill after tabs:

| id | Label | Icon | Behavior |
|----|-------|------|----------|
| `stuck` | (no label) | ⚠️ triangle | Filter to receipts in `syncStuckIds` |

Show count badge on ⚠️ pill when `stuckCount > 0`.

### Styles

- Active tab: `bg-yellow-500 text-black font-bold`
- Inactive: `bg-zinc-800/80 text-zinc-300 border border-zinc-700`
- Stuck pill active: `ring-2 ring-yellow-500`
- Horizontal scroll: `overflow-x-auto gap-2`

### Type change

```typescript
export type ReceiptFilter = "all" | "done" | "processing" | "blurry" | "stuck";
```

`ReceiptList` filter logic:

```typescript
if (filter === "stuck") return receipts.filter((r) => syncStuckIds.has(r.id));
```

Pass `syncStuckIds` and `stuckCount` into `ReceiptFilterBar`.

---

## §4 List section header (ReceiptList)

Row above scroll area:

```
ALL LOCAL RECEIPTS                    PULL TO REFRESH ↻
```

| Side | Spec |
|------|------|
| Left | `text-xs font-bold uppercase tracking-wider text-zinc-500` |
| Right | Button · `text-[10px] font-bold uppercase text-blue-400` + `RefreshIcon` · spin when syncing |

Tap triggers same `onSyncClick` as header. Disabled when offline.

**MVP:** tap-only; no pull-down gesture.

---

## §5 Receipt list cards (ReceiptListCard)

### Layout

```
┌────────────────────────────────────────────────────┐
│ [○ status]  UPLOADING...              ANALYZING  › │
│             Today, 8:20 PM · Processing            │
└────────────────────────────────────────────────────┘
```

| Zone | Width | Content |
|------|-------|---------|
| Leading | 40px circle | `CircularStatusIcon` |
| Body | flex-1 min-w-0 | Title (uppercase bold) + subtitle |
| Trailing | shrink-0 | `StatusPill` + chevron `›` |

Card shell: `rounded-xl bg-zinc-800/90 border border-zinc-700/80 p-3`.

### CircularStatusIcon

New component `components/home/CircularStatusIcon.tsx`:

| State | Circle bg | Icon | Animation |
|-------|-----------|------|-----------|
| Uploading | `bg-yellow-500/20` | ☁️ or upload SVG | — |
| Analyzing | `bg-blue-500/20` | ⚙️ | `animate-spin` |
| Paused (syncStuck) | `bg-yellow-500/30` | ⚠️ | — |
| Done | `bg-green-500/20` | category emoji | — |
| Blurry | `bg-red-500/20` | ❌ | — |

Circle: `h-10 w-10 rounded-full flex items-center justify-center`.

### StatusPill (trailing label)

| State | Text | Color |
|-------|------|-------|
| Analyzing | ANALYZING | `text-blue-400` |
| Uploading | UPLOADING | `text-yellow-400` |
| Paused | PAUSED | `text-yellow-500` |
| Done | tax amount | `text-green-400` |
| Blurry | RESNAP btn inline | red (existing) |

Chevron: `text-zinc-500 text-lg ml-1` — decorative, whole row is tappable.

### Copy (processing states)

| Condition | Title |
|-----------|-------|
| pendingUpload + !syncStuck | UPLOADING... |
| pendingUpload + syncStuck | UPLOAD PAUSED |
| processing + syncStuck | ANALYSIS PAUSED |
| processing + !syncStuck | UPLOADING... (if was upload) or show ANALYZING context via pill |

Clarification: when `processing && !pendingUpload && !syncStuck`, title may remain generic or merchant placeholder; **StatusPill shows ANALYZING** in blue.

Subtitle: `{formatReceiptTime} · {Processing | Tap to retry}`.

---

## §6 Design tokens

New file `lib/ui/homeVisual.ts`:

```typescript
export const homeVisual = {
  heroGradient:
    "linear-gradient(180deg, rgba(234,179,8,0.18) 0%, rgba(0,0,0,0.75) 45%, #000 100%)",
  status: {
    analyzing: "text-blue-400",
    uploading: "text-yellow-400",
    paused: "text-yellow-500",
    done: "text-green-400",
  },
  snap: {
    height: "h-[140px]",
    maxHeight: "max-h-[18vh]",
  },
} as const;
```

---

## §7 Files

| File | Action |
|------|--------|
| `lib/ui/homeVisual.ts` | **New** |
| `components/home/CircularStatusIcon.tsx` | **New** |
| `components/home/StatusPill.tsx` | **New** |
| `components/icons/ReceiptIcon.tsx` | **New** — subtitle icon |
| `components/icons/SlidersIcon.tsx` | **New** |
| `components/icons/ChevronRightIcon.tsx` | **New** — optional |
| `components/home/TaxHeader.tsx` | Hero gradient, subtitle icon, sliders settings |
| `components/home/SnapButton.tsx` | Three-column + subtext + chevron |
| `components/home/ReceiptFilterBar.tsx` | Icon pills + stuck filter |
| `components/home/ReceiptList.tsx` | PULL TO REFRESH, stuck filter, pass props |
| `components/home/ReceiptListCard.tsx` | New card layout |
| `components/home/HomeScreen.tsx` | Pass `onSyncClick` to ReceiptList, stuck count |
| `lib/receipts/receiptListIcon.ts` | Deprecate or map to CircularStatusIcon inputs |
| `docs/product/PRODUCT-SPEC.md` | §3 layout/visual bullets |

---

## §8 PRODUCT-SPEC alignment

Update §3 home layout:

- Top: hero gradient header (~120px–22vh), dual refresh entry
- Snap: 140px shutter with subtext + chevron
- List: filter tabs + stuck ⚠️ + PULL TO REFRESH + circular badge cards

Retain iron rules: black/yellow/white palette base; **blue allowed for active analyzing state** per this spec amendment.

---

## §9 Testing

1. Visual check 375×667 and 430×932 against mockup structure
2. Header refresh + PULL TO REFRESH both trigger list sync
3. ⚠️ filter shows only syncStuck receipts
4. Analyzing cards show blue pill; paused show yellow
5. Offline: refresh buttons disabled
6. `npm run build` passes

## Success criteria

- Home screen visually matches reference mockup layout and hierarchy
- No regression to sync budget, polling, or retry flows
- CSS-only hero (no image network dependency)
