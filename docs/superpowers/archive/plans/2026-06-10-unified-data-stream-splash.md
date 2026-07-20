# Unified data_stream Splash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Single `data_stream` landing from first paint through home entry; 5s soft max falls back to local offline pack (`OfflineHomeShell` + IndexedDB); remove A/B Flags infrastructure.

**Architecture:** Static `LandingStaticShell` in `page.tsx`; `StartupShell` eager-tracks `homeChunkPromise`, runs new `resolveExit` dismiss logic in `LandingGate`; normal path mounts dynamic `HomeScreen`; timeout path mounts sync `OfflineHomeShell` (Settings hidden) then silently promotes when chunk resolves.

**Tech Stack:** Next.js 16 App Router, React 19, Serwist PWA, IndexedDB (`receiptDb`), Tailwind 4.

**Spec:** [`2026-06-10-unified-data-stream-splash-design.md`](../specs/2026-06-10-unified-data-stream-splash-design.md)

---

## File map

| File | Action |
|------|--------|
| `lib/landing/landingTiming.ts` | Create — timing constants + `resolveExit()` |
| `lib/landing/homeChunk.ts` | Create — shared eager `import()` promise |
| `lib/landing/startupMetrics.ts` | Create — `logStartupMarks()` (move from deleted client resolve) |
| `lib/landing/landingVariant.ts` | Delete → replaced by `landingTiming.ts` |
| `lib/landing/resolveLandingVariant*.ts` | Delete |
| `lib/landing/persistLandingVariantCookie.ts` | Delete |
| `flags/landing.ts` | Delete |
| `app/.well-known/vercel/flags/route.ts` | Delete |
| `components/landing/LandingStaticShell.tsx` | Create — SSR hero shell |
| `components/landing/LandingGate.tsx` | Modify — no variant; new exit polling |
| `components/landing/StartupShell.tsx` | Modify — exit modes + promote |
| `components/home/OfflineHomeShell.tsx` | Create — local IDB home |
| `components/home/TaxHeader.tsx` | Modify — optional `showSettings` |
| `app/page.tsx` | Modify — static shell + StartupShell |
| `app/globals.css` | Modify — `#landing-static-shell` hide rule |
| `next.config.ts` | Modify — remove `NEXT_PUBLIC_LANDING_VARIANT` |
| `.env.example` | Modify — remove `LANDING_VARIANT` |
| `components/home/HomeScreen.tsx` | Modify — import `logStartupMarks` from new path |
| `components/landing/SimpleUsingLanding.tsx` | Delete |
| `components/landing/simpleUsingCopy.ts` | Delete |

---

### Task 1: Timing + exit logic

**Files:**
- Create: `lib/landing/landingTiming.ts`
- Delete: `lib/landing/landingVariant.ts`

- [ ] **Step 1: Create `landingTiming.ts`**

```typescript
export const LANDING_MIN_MS = 2400;
export const LANDING_SOFT_MAX_MS = 5000;
export const LANDING_FADE_MS = 200;
export const LANDING_POLL_MS = 100;

export type LandingExitMode = "full-home" | "offline-pack";

export function resolveExit(
  elapsedMs: number,
  homeChunkReady: boolean,
): LandingExitMode | null {
  if (elapsedMs >= LANDING_SOFT_MAX_MS) {
    return homeChunkReady ? "full-home" : "offline-pack";
  }
  if (elapsedMs >= LANDING_MIN_MS && homeChunkReady) {
    return "full-home";
  }
  return null;
}
```

- [ ] **Step 2: Delete `landingVariant.ts`** and fix imports project-wide (grep `landingVariant`).

---

### Task 2: Home chunk promise + metrics

**Files:**
- Create: `lib/landing/homeChunk.ts`
- Create: `lib/landing/startupMetrics.ts`
- Delete: `lib/landing/resolveLandingVariantClient.ts`

- [ ] **Step 1: `homeChunk.ts`**

```typescript
let homeChunkPromise: Promise<typeof import("@/components/home/HomeScreen")> | null =
  null;

export function getHomeChunkPromise() {
  if (!homeChunkPromise) {
    homeChunkPromise = import("@/components/home/HomeScreen");
  }
  return homeChunkPromise;
}

export function isHomeChunkReady(): boolean {
  // Track via StartupShell state; promise .then sets ready
  return homeChunkReadyFlag;
}
```

Implement with a module-level `let ready = false` + `export function markHomeChunkReady()` called from promise `.then`, and `export function homeChunkReady(): boolean`.

- [ ] **Step 2: Move `logStartupMarks` to `startupMetrics.ts`** (copy from deleted file; keep dev-only logging).

- [ ] **Step 3: Update `HomeScreen.tsx` import** → `@/lib/landing/startupMetrics`.

---

### Task 3: Static landing shell

**Files:**
- Create: `components/landing/LandingStaticShell.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

- [ ] **Step 1: `LandingStaticShell.tsx`** — Server Component, `id="landing-static-shell"`, classes matching spec (grid bg, hero SNAP/TAX, inline SVG camera, static 0% progress bar).

- [ ] **Step 2: `globals.css`**

```css
#landing-static-shell {
  position: fixed;
  inset: 0;
  z-index: 40;
}
html.landing-react-ready #landing-static-shell {
  visibility: hidden;
  pointer-events: none;
}
```

- [ ] **Step 3: `page.tsx`**

```tsx
import { LandingStaticShell } from "@/components/landing/LandingStaticShell";
import { StartupShell } from "@/components/landing/StartupShell";

export default function Home() {
  return (
    <>
      <LandingStaticShell />
      <StartupShell />
    </>
  );
}
```

---

### Task 4: LandingGate dismiss refactor

**Files:**
- Modify: `components/landing/LandingGate.tsx`

- [ ] **Step 1: Remove `variant` prop** — always render `<DataStreamLanding />`.

- [ ] **Step 2: Props**

```typescript
interface LandingGateProps {
  homeChunkReady: boolean;
  onExit: (mode: LandingExitMode) => void;
}
```

- [ ] **Step 3: Mount effect**

```typescript
useEffect(() => {
  document.documentElement.classList.add("landing-react-ready");
  void warmReceiptDb();
  performance.mark("startup:landing-paint");

  const start = performance.now();
  const tick = () => {
    const elapsed = performance.now() - start;
    const mode = resolveExit(elapsed, homeChunkReady);
    if (mode) beginExit(mode);
  };

  exitTimerRef.current = window.setInterval(tick, LANDING_POLL_MS);
  tick();
  return clearTimers;
}, [homeChunkReady, beginExit, clearTimers]);
```

- [ ] **Step 4: `beginExit(mode)`** — fade 200ms → `onExit(mode)` (pass mode to parent).

- [ ] **Step 5: Remove `SimpleUsingLanding` import and variant aria branching** — use `DATA_STREAM_CHECKLIST_TITLE` only.

---

### Task 5: TaxHeader — hide Settings

**Files:**
- Modify: `components/home/TaxHeader.tsx`

- [ ] **Step 1: Add prop**

```typescript
showSettings?: boolean; // default true
```

- [ ] **Step 2: Wrap settings button**

```tsx
{(showSettings ?? true) && (
  <button ... aria-label="Settings">...</button>
)}
```

---

### Task 6: OfflineHomeShell

**Files:**
- Create: `components/home/OfflineHomeShell.tsx`

- [ ] **Step 1: Local bootstrap on mount**

```typescript
useEffect(() => {
  void (async () => {
    ensureTaxRegionCandidate();
    const stored = await loadReceipts();
    const visible = top100ByUpdatedAt(stored);
    setReceipts(visible);
    setSyncStuckIds(stuckIdsFromReceipts(stored));
    setTaxSaved(sumLocalTaxSaved(visible));
  })();
}, []);
```

- [ ] **Step 2: Layout** — mirror `HomeScreen` home view: `TaxHeader` with `showSettings={false}`, `onSyncClick` omitted, `SnapButton` + `ReceiptList`. No settings view, no `SettingsScreen`.

- [ ] **Step 3: Snap handlers** — copy minimal capture path from `HomeScreen` OR defer capture to promotion only. **YAGNI:** include `SnapButton` with `onCapture` wired to same local save/upload pattern as HomeScreen (import shared helpers); offline snap must work per product.

- [ ] **Step 4: Mark** — `performance.mark("startup:offline-home")` on mount (dev log optional).

---

### Task 7: StartupShell orchestration

**Files:**
- Modify: `components/landing/StartupShell.tsx`

- [ ] **Step 1: State**

```typescript
type ShellPhase = "landing" | "full-home" | "offline-pack";

const [phase, setPhase] = useState<ShellPhase>("landing");
const [homeChunkReady, setHomeChunkReady] = useState(false);
```

- [ ] **Step 2: Eager chunk on mount**

```typescript
useEffect(() => {
  performance.mark("startup:shell");
  getHomeChunkPromise()
    .then(() => setHomeChunkReady(true))
    .catch(() => {}); // 5s offline-pack handles failure/slow
}, []);
```

- [ ] **Step 3: Promotion when offline-pack + chunk later ready**

```typescript
useEffect(() => {
  if (phase !== "offline-pack" || !homeChunkReady) return;
  setPhase("full-home");
}, [phase, homeChunkReady]);
```

- [ ] **Step 4: Render**

```tsx
{phase === "full-home" && <HomeScreen />}
{phase === "offline-pack" && <OfflineHomeShell />}
{phase === "landing" && (
  <LandingGate
    homeChunkReady={homeChunkReady}
    onExit={(mode) => setPhase(mode === "full-home" ? "full-home" : "offline-pack")}
  />
)}
```

- [ ] **Step 5: Remove** `bootReady`, variant state, cookie persist, idle-only prefetch.

- [ ] **Step 6: Static import** `OfflineHomeShell`; keep `dynamic()` for `HomeScreen` only.

---

### Task 8: Remove A/B infrastructure

**Files:**
- Delete: `flags/landing.ts`, `app/.well-known/vercel/flags/route.ts`, `lib/landing/resolveLandingVariant.ts`, `lib/landing/persistLandingVariantCookie.ts`, `components/landing/SimpleUsingLanding.tsx`, `components/landing/simpleUsingCopy.ts`
- Modify: `next.config.ts`, `.env.example`

- [ ] **Step 1: Delete files above**

- [ ] **Step 2: Remove `NEXT_PUBLIC_LANDING_VARIANT` from `next.config.ts` env block**

- [ ] **Step 3: Remove `LANDING_VARIANT` from `.env.example`**

- [ ] **Step 4: Grep** `landingVariant`, `simple_using`, `flags/landing` — zero remaining imports.

---

### Task 9: Verify

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: `/` shows `○` static; no TypeScript errors.

- [ ] **Step 2: Dev smoke**

Hard refresh → static shell → data_stream animation → home ≤ ~2.5s on fast machine.

- [ ] **Step 3: Slow chunk (DevTools)**

Network throttle + block `HomeScreen` chunk URL → at 5s offline shell with local receipts; Settings gear absent; promote when unblocked.

- [ ] **Step 4: Marks**

Dev console: `startup:shell`, `startup:landing-paint`, `tap→landing paint`, `startup:home-ready` or `startup:offline-home`.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| data_stream only | 4, 8 |
| Static first paint | 3 |
| Min 2400ms / max 5000ms | 1, 4 |
| Eager home chunk | 2, 7 |
| Offline pack at 5s | 6, 7 |
| Settings hidden offline | 5, 6 |
| Silent promote | 7 |
| warmReceiptDb | 4 |
| Remove Flags/A/B | 8 |
| Performance marks | 2, 4, 6, 7 |

**Gap note:** `OfflineHomeShell` snap/capture wiring may need shared extraction from `HomeScreen` if duplication exceeds ~80 lines — prefer `useLocalReceiptBootstrap` hook in Task 6 if needed.
