# data_stream Landing V2 — Full Mockup — Design

**Date:** 2026-06-10  
**Status:** Approved (design)  
**Scope:** Replace minimal marquee `data_stream` with full five-section mockup UI (Hero, progress, checklist, system log, footer). `simple_using` unchanged.

**Parent spec:** [`2026-06-10-landing-flags-design.md`](./2026-06-10-landing-flags-design.md)

## Problem

Current `data_stream` is camera + 4-line typewriter marquee. Approved mockup is a five-section “hacker dashboard” with SNAPTAX branding, hazard progress bar, checklist, green terminal log, and three-column footer.

## Decisions

| Topic | Choice |
|-------|------|
| Fidelity | **A** — full mockup (all five sections) |
| Animation | CSS master timeline `--landing-duration: 2.4s` |
| `data_stream` min hold | **2400ms** (was 1600ms) |
| Global max | **2500ms** unchanged |
| Camera hero | CSS wireframe + perspective glow (no Lottie/PNG) |
| Marquee copy | **Removed** — replaced by checklist + log |
| Footer privacy subcopy | Compliance-safe (no “all data stays on device”) |

## Layout (single screen, no scroll)

```
Hero: wireframe camera + SNAPTAX + ENGINE v1.0
Progress: hazard stripe bar + percentage
Checklist card: 5 items with icons + [ ✓ ]
System log: green mono terminal + ● ONLINE
Footer: 3 columns (Privacy / Offline / Workers)
```

Background: `bg-zinc-950` + subtle grid via CSS gradients.

## Copy

### Checklist title

`Loading your tax-saving toolkit... >>>`

### Checklist items (5)

1. IRS deduction database loaded  
2. Mileage categories loaded  
3. Work equipment deductions loaded  
4. Receipt scanner ready  
5. Secure receipt vault online  

### System log lines (7)

```
> Loading IRS categories...
> Travel expenses loaded
> Fuel deductions loaded
> Equipment deductions loaded
> Receipt vault online
> AI scanner ready
> You're one photo away from tax savings.
```

### Footer

| Column | Title | Subcopy |
|--------|-------|---------|
| Privacy | 100% PRIVATE & SECURE | Encrypted sync when online. Local cache on device. |
| Offline | WORKS OFFLINE | Snap and queue without signal. |
| Workers | BUILT FOR WORKERS | Construction. Trucking. Delivery. |

## Animation timeline (2.4s)

| Time | Effect |
|------|--------|
| 0–0.4s | Hero fade-in + camera glow |
| 0.3–2.4s | Progress bar width 0 → 92% |
| 0.5–2.0s | Checklist rows reveal + checkmark stagger (~300ms each) |
| 1.0–2.4s | Log lines scroll / fade in |
| 2.0–2.4s | Footer fade-in (optional subtle) |

## Components

```
components/landing/
├── DataStreamLanding.tsx
├── DataStreamHero.tsx
├── DataStreamProgress.tsx
├── DataStreamChecklist.tsx
├── DataStreamLog.tsx
├── DataStreamFooter.tsx
├── dataStreamCopy.ts
└── landing.css (data-stream-* keyframes)
```

Remove usage of `DATA_STREAM_LINES` / old marquee in `DataStreamLanding`.

Update `LANDING_VARIANT_MIN_MS.data_stream` to `2400`.

Update `LandingGate` aria-label to checklist title.

## Accessibility

- Outer `role="status"`, `aria-live="polite"`, label = checklist title  
- Log panel decorative: inner `aria-hidden`  
- `prefers-reduced-motion`: static hero, full progress, all checks visible, last log line only

## Out of scope

- 3D camera asset / Lottie  
- Extending global landing max beyond 2.5s  
- Changes to `simple_using`  
- Analytics events

## Testing

1. `LANDING_VARIANT=data_stream` — all five sections visible within 2.4s  
2. Landing dismisses by 2.5s max  
3. Build passes; no hydration mismatch from new markup  
4. Reduced motion shows static fallback  
5. Footer copy matches compliance (no false local-only claim)
