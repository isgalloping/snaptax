# Landing A/B + Vercel Flags Middleware — Design

**Date:** 2026-06-10  
**Status:** Approved (design)  
**Scope:** Replace bare `Loading…` gate with two landing variants (`data_stream`, `simple_using`), assigned via Vercel Flags SDK + Next.js middleware; show on **every cold start** (max 2.5s); decouple auth from startup gate.

## Problem

Cold start shows a black screen with centered yellow `Loading…` until both IndexedDB hydration and `fetchAuthMe` complete. On slow networks this feels like a hang. There is no branding, value proposition, or experiment infrastructure.

## Decisions

| Topic | Choice |
|-------|--------|
| Landing frequency | **A** — every cold start (PWA open / full refresh) |
| A/B variant stickiness | Sticky per device via cookie (50/50 on first assignment) |
| Max landing duration | **2.5s** hard timeout (Timeout Gate) |
| Min animation duration | `data_stream` 1.6s · `simple_using` 1.8s |
| Auth blocking | **Remove** — `auth.hydrated` must not block home UI after landing |
| Local data gate | `receiptsLocalReady` after IndexedDB; align with Fast Startup spec |
| Flags integration | **Middleware cookie** (recommended approach 1) |
| Animations | Pure CSS `opacity` / `transform` keyframes only — no Lottie |
| Compliance copy | data_stream line 4 uses **「Local receipt vault ready」** — not local AES-256 |

## Architecture

```
Request /
  → middleware.ts evaluates landingVariant flag
  → if no snap1099_landing_variant cookie → set sticky cookie (1y)
  → pass through to app

app/page.tsx → StartupShell
  ├─ HomeScreen (mount immediately under overlay)
  └─ LandingOverlay (fixed z-50, variant from cookie)
       dismiss at min(variantMinMs, 2500ms) — always ≤ 2500ms

Parallel during landing:
  Phase 0: openDb / loadReceipts → receiptsLocalReady
  Phase 0: useAuthSession (background, non-blocking)
  Phase 2: runDeferredStartup after home visible (existing)
```

### Dismiss timing

```typescript
const VARIANT_MIN_MS = {
  data_stream: 1600,   // 4 lines × 400ms
  simple_using: 1800,  // 3 slides × 600ms
} as const;

dismissAt = Math.min(VARIANT_MIN_MS[variant], 2500);
```

On dismiss: overlay fades out (200ms CSS). Incomplete auth/sync continues via `runDeferredStartup` and header **Pull to refresh**.

## Flags + Middleware

### Package

- npm package: **`flags`** (not deprecated `@vercel/flags`)

### Files

| Path | Role |
|------|------|
| `flags/landing.ts` | Declare `landingVariant` flag |
| `middleware.ts` | Evaluate flag; set/read cookie; matcher excludes api/serwist/static |
| `app/.well-known/vercel/flags/route.ts` | Vercel Toolbar discovery |
| `.env.example` | `LANDING_VARIANT=` optional local override |

### Flag definition

```typescript
export const landingVariant = flag({
  key: "landing-variant",
  options: ["data_stream", "simple_using"],
  defaultValue: "simple_using",
  decide() {
    // Production: 50/50; later @flags-sdk/edge-config adapter
    return Math.random() < 0.5 ? "data_stream" : "simple_using";
  },
});
```

### Cookie

- Name: `snap1099_landing_variant`
- Values: `data_stream` | `simple_using`
- `Max-Age=31536000`, `SameSite=Lax`, **not** HttpOnly (sync client read)
- Set once per device for A/B stickiness; landing **still plays every cold start**

### Local dev override

- `LANDING_VARIANT=data_stream|simple_using` bypasses random `decide()` in middleware

### Middleware matcher

Include: `/`  
Exclude: `/api/*`, `/serwist/*`, `/_next/*`, static assets, `/manifest.webmanifest`, icons

## UI Components

```
components/landing/
├── LandingGate.tsx
├── DataStreamLanding.tsx
├── SimpleUsingLanding.tsx
├── LandingCameraHero.tsx
├── landingCopy.ts
└── landing.css (or section in globals.css)
```

`app/page.tsx` wraps `HomeScreen` in `StartupShell` (or equivalent) that owns `LandingGate`.

### Shared visual

- Background: `bg-zinc-950`
- Accent: `#EAB308` (`--color-snap-yellow`)
- Hero: yellow wireframe camera (`CameraIcon` stroke) + corner brackets + CSS glow keyframes
- Hot zones unchanged for post-landing home UI

### data_stream

**Layout:** centered hero + semi-transparent typewriter marquee below.

**Marquee:** single slot; 4 lines cycle at **400ms** each via CSS staggered fade keyframes.

| Line | Copy |
|------|------|
| 1 | `[ ⚙️ SYSTEM ] Initializing offline-first secure vault...` |
| 2 | `[ 💡 TAX TIP ] IRS Line 9 deductions successfully loaded.` |
| 3 | `[ ⚡ ENGINE ] OpenAI Vision API pipeline standby.` |
| 4 | `[ 🔒 SECURITY ] Local receipt vault ready.` |

IndexedDB `open()` / `upgradeneeded` runs in parallel; copy is atmospheric, not gated on IDB completion.

### simple_using

**Layout:** three horizontal **Progress Pill Pips** (`w-8 h-1`, inactive `bg-zinc-800`, active `bg-yellow-500`).

**Carousel:** 3 slides, **600ms** each, CSS-only slide/fade.

| Slide | Headline | Subcopy |
|-------|----------|---------|
| 1 | 📸 **10 Receipts in 10 Seconds.** | Blind-snap on busy job sites. Zero clutter, pure speed. |
| 2 | ⚡ **Instant Fast-Pass.** | Tap FLASH DONE to skip reviews. Let AI crunch numbers in the background. |
| 3 | 🔒 **100% Offline Tracking.** | No signal in remote docks? Your tax assets are fully secured locally. |

### Exit animation

Overlay: `opacity 0` + `translateY(-8px)`, 200ms, then unmount; `pointer-events: none` during fade.

### Accessibility

- Container: `role="status"`, `aria-live="polite"`
- Announce active marquee line or slide headline

## HomeScreen gate changes

**Before:**

```typescript
if (!hydrated || !auth.hydrated) return <Loading… />;
```

**After:**

- Remove inline `Loading…` gate from `HomeScreen`
- `LandingGate` owns startup presentation
- After landing dismiss: show home when `receiptsLocalReady` OR at 2.5s timeout (empty list acceptable)
- `useAuthSession` unchanged internally; never blocks overlay dismiss
- Keep `runDeferredStartup`, Pull to refresh, camera-defer merge (Fast Startup spec)

Rename/clarify state: `hydrated` → `receiptsLocalReady` where it means IndexedDB load complete.

## Engineering constraints (non-negotiable)

1. **Timeout Gate:** landing overlay never exceeds **2500ms** wall clock
2. **CSS only:** no Lottie or heavy JS animation libraries
3. **No modal:** full-screen overlay, not a blocking dialog (PRODUCT-SPEC compliant)
4. **Offline cold start:** landing plays without network; variant from cookie or env default
5. **PWA:** do not break Serwist precache of `/`

## Dependencies

Add to `package.json`:

```json
"flags": "^4.x"
```

Optional later: `@flags-sdk/edge-config` for remote rollout without redeploy.

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `LANDING_VARIANT` | Development | Force variant locally |
| Edge Config (later) | Vercel | Remote percentage / kill switch |

Update `docs/tech/09-deployment-vercel.md` when Edge Config is added.

## Testing

1. **Cold start online:** landing ≤ 2.5s → home with Snap enabled without waiting for auth
2. **Slow auth:** landing dismisses at 2.5s; home visible; auth completes in background
3. **Offline:** landing plays; home from IndexedDB
4. **Sticky A/B:** same device keeps variant across sessions; landing still shows each open
5. **Local override:** `LANDING_VARIANT=data_stream` forces variant
6. **Toolbar:** `/.well-known/vercel/flags` lists `landing-variant`; override works on Preview
7. **Middleware:** `/api/*` and `/serwist/*` unaffected
8. **Build:** `npm run build` passes

## Related docs

- `docs/superpowers/specs/2026-06-07-fast-startup-local-first-design.md`
- `docs/product/PRODUCT-SPEC.md` §2.1 (no blocking first-open modal)
- `docs/tech/02-frontend.md` §2.3

## Out of scope

- URL rewrite / `precompute()` ISR routing
- Skipping landing for returning users (user chose every cold start)
- Client-side flag evaluation libraries
- Analytics event wiring (follow-up)
