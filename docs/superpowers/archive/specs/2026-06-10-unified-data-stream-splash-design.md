# Unified data_stream Splash — Design

**Date:** 2026-06-10  
**Status:** Approved (design)  
**Scope:** Remove Landing A/B / Flags; always show `data_stream` UI from first paint through home ready; soft max 5s.

**Supersedes (partial):**

- [`2026-06-10-landing-flags-design.md`](./2026-06-10-landing-flags-design.md) — A/B, Flags, cookie stickiness **removed**
- [`2026-06-10-cold-start-landing-paint-design.md`](./2026-06-10-cold-start-landing-paint-design.md) — variant client resolve **removed**; dismiss timing **updated**

**UI detail (unchanged):** [`2026-06-10-data-stream-landing-v2-design.md`](./2026-06-10-data-stream-landing-v2-design.md)

## Problem

1. A/B (`data_stream` vs `simple_using`) and Vercel Flags add complexity without a current product need.
2. Cold start still feels like “black → wait → landing → home”; user wants **the entire tap-to-home interval to feel like `data_stream`**, not a blank gap.
3. Previous 2.5s hard cap can dismiss landing before `HomeScreen` chunk is ready, re-exposing a blank period.

## Goals

| Goal | Criterion |
|------|-----------|
| Single landing | Always `data_stream`; no Flags, cookie, or env variant |
| Continuous splash | First HTML paint shows landing-like UI; React takes over seamlessly |
| No blank gap before home | Landing stays until **min animation done** AND **home chunk ready**, unless soft cap triggers **offline pack fallback** |
| Product rules preserved | Every cold start shows landing; pure CSS animation; no core-flow Modal |
| Offline at 5s | If home chunk not ready by 5s, enter home via **local offline pack** (precached shell + IndexedDB), not network wait |

## Non-goals

- Re-running A/B or keeping `simple_using` code path
- Shortening `/api/receipts` latency
- Adding CTA to dismiss landing early (`data_stream` remains auto-dismiss only)

## Decisions

| Topic | Choice |
|-------|--------|
| Variant | **`data_stream` only** |
| Flags / cookie / env | **Remove** |
| First paint | **Static HTML shell** in `app/page.tsx` (Server Component) |
| React takeover | `StartupShell` mounts `DataStreamLanding` on hydrate; hide static shell on `startup:landing-paint` |
| Min hold | **2400ms** (`--landing-duration` animation completes) |
| Soft max | **5000ms** — force exit landing (see fallback below) |
| Home chunk | Eager `import('@/components/home/HomeScreen')` from `StartupShell` mount (**not** idle-only) |
| Normal dismiss | `elapsed ≥ 2400ms` **and** home chunk resolved → fade → full `HomeScreen` |
| **5s fallback** | **`OfflineHomeShell`** — sync bundle in startup critical path; data from **IndexedDB + authStorage** only |
| After fallback | Background retry full `HomeScreen` import; **silent promote** when chunk ready (preserve IDB state) |
| `warmReceiptDb` | Start on landing mount (unchanged); required for offline pack |
| Network during landing | **Never** block landing exit on `/api/*` |

## Architecture

```
GET / (static)
  ├─ LandingStaticShell     ← SSR HTML, visible until React landing paints
  └─ StartupShell (client, sync includes OfflineHomeShell)
       ├─ Parallel (landing phase)
       │    ├─ warmReceiptDb()
       │    ├─ homeChunkPromise = import(HomeScreen)     ← Serwist precache when SW active
       │    └─ auth local read optional (no fetchAuthMe)
       ├─ LandingGate → DataStreamLanding
       │    └─ dismiss per timing (below)
       └─ Post-dismiss
            ├─ homeChunkReady → <HomeScreen />  (dynamic, ssr:false)
            └─ 5s timeout & !homeChunkReady → <OfflineHomeShell /> → promote to HomeScreen
```

### Loading tracks (landing phase)

| Track | Starts | Purpose |
|-------|--------|---------|
| **UI** | HTML | Static shell → React `DataStreamLanding` |
| **Home chunk** | `StartupShell` mount | Full app JS from network **or** Serwist precache |
| **Local data pack** | `LandingGate` mount | `warmReceiptDb()` → IndexedDB hot for offline shell |

These tracks are **independent**. Landing exit never waits on `/api/receipts`, `fetchAuthMe`, or ghost register.

### Dismiss timing

```typescript
const LANDING_MIN_MS = 2400;
const LANDING_SOFT_MAX_MS = 5000;
const LANDING_FADE_MS = 200;

type ExitMode = "full-home" | "offline-pack";

function resolveExit(elapsed: number, homeChunkReady: boolean): ExitMode | null {
  if (elapsed >= LANDING_SOFT_MAX_MS) {
    return homeChunkReady ? "full-home" : "offline-pack";
  }
  if (elapsed >= LANDING_MIN_MS && homeChunkReady) {
    return "full-home";
  }
  return null; // keep landing visible
}
```

Poll every **100ms** (and re-check when `homeChunkPromise` settles). On exit → `landing-overlay-exit` 200ms → mount target.

**Timeline example (slow network):**

```
0s     static shell + landing animation
2.4s   animation done; chunk still loading → stay on landing
5.0s   soft max → offline-pack (OfflineHomeShell + IDB receipts)
~5.2s  chunk arrives → silent swap to HomeScreen (no second landing)
```

### 5s fallback — local offline pack

When `resolveExit` returns `"offline-pack"`:

1. **Do not** show black screen or spinner after fade.
2. Mount **`OfflineHomeShell`** — **synchronously imported** with `StartupShell` (same critical JS bundle / Serwist precache entry). No extra network chunk required.
3. **Data sources (local only):**
   - Receipts: `loadReceipts()` → `top100ByUpdatedAt` (IDB warmed by `warmReceiptDb`)
   - Tax saved: `sumLocalTaxSaved(receipts)` — no API estimate
   - Auth display: `loadGoogleUser()` + `isSeasonPaid()` from `authStorage` — **no** `fetchAuthMe` / `fetchSeasonPaid` until promoted
   - Snap: enabled offline per product; camera chunk may still lazy-load from precache
4. **Background promotion:** continue `homeChunkPromise`; when resolved, replace `OfflineHomeShell` with `HomeScreen` without remounting landing. React state rehydrates from same IDB reads (acceptable brief re-fetch).
5. **Online sync:** `runDeferredStartup` only runs inside full `HomeScreen` after promotion (or OfflineHomeShell may trigger a slim defer if promoted late — prefer single path in HomeScreen).

**Why not only wait for Serwist?** On first install or SW update, precache may still be populating at 5s. Offline pack guarantees a usable home from **already-shipped startup bundle + IDB**, matching product offline-first rules.

**What “offline pack” is not:** It is not downloading a new asset at 5s. It is the **precached startup bundle + local IndexedDB**, not network APIs.

### Static shell (`LandingStaticShell`)

Server Component; **subset** of full mockup — enough visual continuity, not full duplicate:

- `bg-zinc-950` + `data-stream-grid-bg`
- Hero: wireframe camera corners + inline SVG camera + **SNAP**/**TAX** + `ENGINE v1.0`
- Progress: bar track + **static 0%** label (no animated fill — animation starts when React mounts)
- **No** checklist / log / footer in static shell (appear when React `DataStreamLanding` mounts — acceptable 1-frame enrich)

Hide mechanism:

```css
/* globals.css */
#landing-static-shell { … }
html.landing-react-ready #landing-static-shell {
  visibility: hidden;
  pointer-events: none;
}
```

`LandingGate` first `useEffect`: `document.documentElement.classList.add('landing-react-ready')`.

### OfflineHomeShell (new component)

Minimal home usable without `HomeScreen` chunk:

| Section | Source | Notes |
|---------|--------|-------|
| `TaxHeader` | local tax + receipt count | reuse component |
| `ReceiptList` | IDB receipts | reuse component |
| `SnapButton` | lazy camera | same as HomeScreen; offline-capable |
| Settings | **Hidden** until full `HomeScreen` promotes | Avoid pulling settings chunk during offline pack |

File: `components/home/OfflineHomeShell.tsx` — **static import** from `StartupShell` (not `dynamic()`).

Shared layout/CSS with `HomeScreen` where possible; avoid duplicating business logic (extract `useLocalReceiptBootstrap()` hook if needed).

### Dismiss timing (implementation note)

Replace previous `shouldDismiss(elapsed, homeReady)`-only logic — see `resolveExit` above.

### StartupShell simplification

Remove:

- `bootReady` / zinc placeholder gate
- `resolveLandingVariantClient()` / cookie persist
- `landingVariant` state

Keep:

- `next/dynamic` HomeScreen `ssr: false` for normal path
- Eager `homeChunkPromise` at `StartupShell` mount (remove idle-only prefetch as sole strategy)
- **Sync import** `OfflineHomeShell` for 5s fallback

### Performance marks (unchanged names)

| Mark | When |
|------|------|
| `startup:shell` | `StartupShell` mount |
| `startup:landing-paint` | `LandingGate` mount (+ hide static shell) |
| `startup:home-ready` | `HomeScreen` mount |

Dev console: log `tap→landing paint` and `landing→home` deltas.

## Cleanup

### Delete

| Path | Reason |
|------|--------|
| `flags/landing.ts` | No A/B |
| `app/.well-known/vercel/flags/route.ts` | No Flags |
| `lib/landing/resolveLandingVariant.ts` | No SSR variant |
| `lib/landing/resolveLandingVariantClient.ts` | No client variant |
| `lib/landing/persistLandingVariantCookie.ts` | No sticky cookie |
| `components/landing/SimpleUsingLanding.tsx` | Retired variant |
| `components/landing/simpleUsingCopy.ts` | Retired variant |

### Refactor

| Path | Change |
|------|--------|
| `lib/landing/landingVariant.ts` | Rename → `landingTiming.ts`; drop `LandingVariant` type; export `LANDING_MIN_MS`, `LANDING_SOFT_MAX_MS`, `LANDING_FADE_MS` |
| `components/landing/LandingGate.tsx` | Remove `variant` prop; always `DataStreamLanding`; new dismiss logic |
| `components/landing/StartupShell.tsx` | Exit mode state; eager chunk promise; OfflineHomeShell + promote |
| `components/home/OfflineHomeShell.tsx` | **New** — local-only home for 5s fallback |
| `app/page.tsx` | Render `LandingStaticShell` + `StartupShell` |
| `next.config.ts` | Remove `NEXT_PUBLIC_LANDING_VARIANT` |
| `.env.example` | Remove `LANDING_VARIANT` |
| `docs/superpowers/specs/2026-06-10-landing-flags-design.md` | Add “superseded” banner at top |

### Keep

- `DataStreamLanding` and all `data-stream-*` subcomponents
- `components/landing/landing.css` + `globals.css` import
- `LandingCameraHero` / `CameraIcon` (React path); static shell uses duplicated inline SVG for zero client deps

## Acceptance

| Scenario | Expected |
|----------|----------|
| PWA cold start (4G) | First paint ≤ **1s** shows static shell (hero + bar); full animation within **2s** of tap |
| Fast device | Landing dismisses at ~**2.4s** with full `HomeScreen` |
| Slow network | Landing holds until **5s** → **OfflineHomeShell** with IDB data; no black gap |
| Slow network + late chunk | Offline shell visible ≤ few seconds until silent promote to `HomeScreen` |
| Offline PWA | Static shell → landing → offline pack or full home from precache |
| Every refresh | Landing shows (no skip cookie) |
| Production | No Flag env, no variant cookie writes |
| Hydration | No variant mismatch; static hidden only after React landing mounts |

## Testing

1. `npm run build` — `/` remains static `○`
2. Dev: hard refresh — static shell visible before React; no flash to white/black
3. DevTools Slow 3G + disable cache: at 5s see **OfflineHomeShell** with local receipts (not black)
4. Throttle JS / block HomeScreen chunk: verify offline pack at 5s, then promote when chunk unblocked
5. Confirm deleted routes: `/.well-known/vercel/flags` → 404
6. Airplane mode after prior visit: landing → offline pack or precached full home

## Migration note

Existing users with `snap1099_landing_variant` cookie: **ignored** (no reads). Cookie expires naturally; no migration job.
