# Aha Moment Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First-time in-app onboarding — shadow demo receipt → sandbox snap → $28.50 Aha → Google signup — without replacing `data_stream` cold-start Landing.

**Architecture:** `lib/onboarding/onboardingState.ts` owns IndexedDB `system_meta` status; `OnboardingOrchestrator` dispatches stage UI; `HomeScreen` intercepts SNAP via `onSnapIntent` callback; demo receipt lives in existing `receipts` store with `isOnboardingDemo` flag.

**Tech Stack:** Next.js 16 · React 19 · IndexedDB (`receiptDb` v4) · i18n · existing `GoogleSignInSheet`

**Spec:** [`docs/superpowers/specs/2026-06-13-aha-moment-onboarding-design.md`](../specs/2026-06-13-aha-moment-onboarding-design.md)

---

## File map

| File | Action |
|------|--------|
| `lib/types.ts` | Add `isOnboardingDemo?: boolean` |
| `lib/onboarding/onboardingState.ts` | Create — status enum, read/write, transitions, legacy migration |
| `lib/onboarding/demoReceipt.ts` | Create — constants, seed/complete helpers |
| `lib/onboarding/onboardingState.test.ts` | Create — transition + migration tests |
| `lib/storage/receiptDb.ts` | Bump v4, `system_meta` store, serialize `isOnboardingDemo` |
| `public/onboarding/sample-home-depot.jpg` | Add bundled sandbox image |
| `components/onboarding/OnboardingOrchestrator.tsx` | Create |
| `components/onboarding/SnapTooltip.tsx` | Create |
| `components/onboarding/SandboxCameraSheet.tsx` | Create |
| `components/onboarding/OnboardingSnackbar.tsx` | Create |
| `components/onboarding/TaxSavedOdometer.tsx` | Create (or extend TaxHeader) |
| `components/auth/GoogleSignInSheet.tsx` | Add `onboarding-signup` mode + Later |
| `components/home/SnapButton.tsx` | Add `onSnapIntent?: () => boolean` guard |
| `components/home/HomeScreen.tsx` | Mount orchestrator; remove old coaches; wire intercept |
| `components/home/TaxHeader.tsx` | Optional `forceDisplayTaxSaved` for odometer override |
| Receipt list row component | Demo glow / COMPLETE subtitle styling |
| `lib/i18n/types.ts` + `en-US.ts` + `fr-FR.ts` + `de-DE.ts` | New onboarding copy |
| `lib/tax/exportRows.ts` or export filter | Exclude `isOnboardingDemo` from export |
| Delete/disable | `SnapCoachBanner.tsx`, `FirstReceiptCoach.tsx` usage |

---

### Task 1: Core types and demo receipt helpers

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/onboarding/demoReceipt.ts`
- Create: `lib/onboarding/onboardingState.ts` (types only first)
- Test: `lib/onboarding/demoReceipt.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/onboarding/demoReceipt.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ONBOARDING_DEMO_RECEIPT_ID,
  ONBOARDING_DEMO_TAX_SAVED,
  createShadowDemoReceipt,
  completeDemoReceipt,
} from "./demoReceipt";

describe("demoReceipt", () => {
  it("creates shadow receipt at zero tax", () => {
    const r = createShadowDemoReceipt();
    assert.equal(r.id, ONBOARDING_DEMO_RECEIPT_ID);
    assert.equal(r.isOnboardingDemo, true);
    assert.equal(r.status, "processing");
    assert.equal(r.taxAmount, 0);
    assert.equal(r.subtitle, "Pending Test");
  });

  it("completes demo receipt with fixed tax saved", () => {
    const r = completeDemoReceipt(createShadowDemoReceipt());
    assert.equal(r.status, "done");
    assert.equal(r.taxAmount, ONBOARDING_DEMO_TAX_SAVED);
    assert.equal(r.subtitle, "COMPLETE");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm run test:unit -- lib/onboarding/demoReceipt.test.ts
```

- [ ] **Step 3: Implement**

`lib/types.ts` — add to `Receipt`:

```typescript
  isOnboardingDemo?: boolean;
```

`lib/onboarding/demoReceipt.ts`:

```typescript
import type { StoredReceipt } from "@/lib/storage/receiptDb";
import { utcNow } from "@/lib/time/utc";

export const ONBOARDING_DEMO_RECEIPT_ID = "onboarding-demo-receipt";
export const ONBOARDING_DEMO_TAX_SAVED = 28.5;
export const ONBOARDING_DEMO_AMOUNT = 182.12;

export function createShadowDemoReceipt(): StoredReceipt {
  const now = utcNow();
  return {
    id: ONBOARDING_DEMO_RECEIPT_ID,
    status: "processing",
    merchant: "SAMPLE: Home Depot",
    amount: ONBOARDING_DEMO_AMOUNT,
    taxAmount: 0,
    currency: "USD",
    dataRegion: "us",
    deductible: true,
    isOnboardingDemo: true,
    subtitle: "Pending Test",
    timestamp: now,
    updatedAt: now,
  };
}

export function completeDemoReceipt(receipt: StoredReceipt): StoredReceipt {
  const now = utcNow();
  return {
    ...receipt,
    status: "done",
    taxAmount: ONBOARDING_DEMO_TAX_SAVED,
    subtitle: "COMPLETE",
    updatedAt: now,
  };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm run test:unit -- lib/onboarding/demoReceipt.test.ts
```

---

### Task 2: Onboarding state machine + IndexedDB system_meta

**Files:**
- Create: `lib/onboarding/onboardingState.ts` (full)
- Modify: `lib/storage/receiptDb.ts`
- Test: `lib/onboarding/onboardingState.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isOnboardingActive,
  isSnapGateActive,
  shouldSkipLegacyCoaches,
} from "./onboardingState";

describe("onboardingState helpers", () => {
  it("stage_1 is active onboarding", () => {
    assert.equal(isOnboardingActive("stage_1"), true);
    assert.equal(isOnboardingActive("completed"), false);
  });

  it("deferred_login triggers snap gate", () => {
    assert.equal(isSnapGateActive("deferred_login"), true);
    assert.equal(isSnapGateActive("stage_1"), false);
  });

  it("completed skips legacy coaches", () => {
    assert.equal(shouldSkipLegacyCoaches("completed"), true);
    assert.equal(shouldSkipLegacyCoaches("deferred_login"), true);
    assert.equal(shouldSkipLegacyCoaches("stage_1"), true);
    assert.equal(shouldSkipLegacyCoaches("not_started"), false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement `lib/onboarding/onboardingState.ts`**

```typescript
export type OnboardingStatus =
  | "not_started"
  | "stage_1"
  | "stage_2"
  | "stage_3"
  | "stage_4"
  | "deferred_login"
  | "completed";

export const ONBOARDING_STATUS_KEY = "onboarding_status";

export function isOnboardingActive(status: OnboardingStatus): boolean {
  return status.startsWith("stage_");
}

export function isSnapGateActive(status: OnboardingStatus): boolean {
  return status === "deferred_login";
}

export function shouldSkipLegacyCoaches(status: OnboardingStatus): boolean {
  return status !== "not_started";
}

// getOnboardingStatus() / setOnboardingStatus() / ensureOnboardingInitialized()
// → read/write via receiptDb system_meta helpers
```

- [ ] **Step 4: Bump `receiptDb.ts` to v4**

```typescript
const DB_VERSION = 4;
const SYSTEM_META_STORE = "system_meta";

// in onupgradeneeded when oldVersion < 4:
if (!db.objectStoreNames.contains(SYSTEM_META_STORE)) {
  db.createObjectStore(SYSTEM_META_STORE, { keyPath: "key" });
}

// enrichRow / deserialize: pass through isOnboardingDemo boolean
```

Add exports:

```typescript
export async function readSystemMeta<T>(key: string): Promise<T | null> { ... }
export async function writeSystemMeta<T>(key: string, value: T): Promise<void> { ... }
```

- [ ] **Step 5: Implement `ensureOnboardingInitialized()`**

Logic:
1. Read `onboarding_status`; if missing → check legacy localStorage + non-demo receipt count → maybe `completed`
2. If `not_started` → seed demo receipt via `saveReceipt(createShadowDemoReceipt())` → set `stage_1`
3. Return current status

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm run test:unit -- lib/onboarding/
```

---

### Task 3: i18n strings

**Files:**
- Modify: `lib/i18n/types.ts`, `lib/i18n/locales/en-US.ts`, `fr-FR.ts`, `de-DE.ts`

- [ ] **Step 1: Add to `UserCopy.onboarding`**

```typescript
aha: {
  snapTooltip: "Tap here to snap a photo and see your tax saved instantly.",
  sandboxShutterAria: "Take sample receipt photo",
  snackbar: "You just saved $28.50!",
  signup: {
    title: "Secure your tax assets",
    body: "You just saved your first $28.50! Create your secure local vault now to lock and backup your tax assets permanently.",
    later: "Later",
  },
},
```

- [ ] **Step 2: Wire en-US (canonical English); mirror fr/de with translations**

- [ ] **Step 3: Extend `GoogleSignInMode` in types + auth.googleSignIn.onboardingSignup block**

---

### Task 4: Sandbox image asset

**Files:**
- Create: `public/onboarding/sample-home-depot.jpg`

- [ ] **Step 1:** Add a Home Depot–style receipt JPEG (~800×1200). Placeholder OK for MVP if labeled in PR — use a neutral sample receipt image without trademark issues, or a stylized mock.

- [ ] **Step 2:** Reference in `SandboxCameraSheet` as `url(/onboarding/sample-home-depot.jpg)`

---

### Task 5: UI components (Stages 1–3 visuals)

**Files:**
- Create: `components/onboarding/SnapTooltip.tsx`
- Create: `components/onboarding/SandboxCameraSheet.tsx`
- Create: `components/onboarding/OnboardingSnackbar.tsx`
- Create: `components/onboarding/TaxSavedOdometer.tsx`

- [ ] **Step 1: SnapTooltip**

Absolute-positioned bubble above SNAP area; yellow border; `pointer-events-none` on container except dismiss not needed (no dismiss in spec for tooltip — stays until stage_2).

- [ ] **Step 2: SandboxCameraSheet**

Bottom sheet `fixed inset-0 z-50 flex items-end bg-black/70`:
- Full-height panel with sample image background
- Yellow circular shutter (min 96px)
- On shutter click → call `onComplete()` prop

- [ ] **Step 3: OnboardingSnackbar**

Fixed bottom toast, green accent, 3s auto-hide via `useEffect`.

- [ ] **Step 4: TaxSavedOdometer hook**

Export `useTaxOdometer(from: number, to: number, durationMs: 300)` returning animated value; trigger haptic when complete:

```typescript
if (typeof navigator !== "undefined" && navigator.vibrate) {
  navigator.vibrate(200);
}
```

Pass animated value to `TaxHeader` via new optional prop `displayTaxSaved?: number`.

---

### Task 6: Google Sign-In onboarding mode

**Files:**
- Modify: `components/auth/GoogleSignInSheet.tsx`

- [ ] **Step 1: Extend type**

```typescript
export type GoogleSignInMode =
  | "soft"
  | "hard-export"
  | "hard-sync"
  | "onboarding-signup";
```

- [ ] **Step 2: Mode copy + Later button**

```typescript
const showNotNow = mode === "soft" || mode === "onboarding-signup";
// onboarding-signup uses onboarding.aha.signup copy
// Later calls onSoftDismiss + onClose
```

---

### Task 7: OnboardingOrchestrator

**Files:**
- Create: `components/onboarding/OnboardingOrchestrator.tsx`

- [ ] **Step 1: Props**

```typescript
interface OnboardingOrchestratorProps {
  status: OnboardingStatus;
  onStatusChange: (next: OnboardingStatus) => void;
  onRefreshReceipts: () => Promise<void>;
  onGoogleSuccess: () => Promise<void>;
  taxSaved: number | null;
  onTaxDisplayOverride: (value: number | null) => void;
  snapButtonAnchorRef?: React.RefObject<HTMLElement | null>;
}
```

- [ ] **Step 2: Render map**

| status | UI |
|--------|-----|
| `stage_1` | `<SnapTooltip />` |
| `stage_2` | `<SandboxCameraSheet onComplete={handleSandboxComplete} />` |
| `stage_3` | Run odometer + snackbar; then auto `setStatus('stage_4')` |
| `stage_4` | `<GoogleSignInSheet mode="onboarding-signup" ... />` |

- [ ] **Step 3: `handleSandboxComplete`**

```typescript
async function handleSandboxComplete() {
  const demo = await loadReceipt(ONBOARDING_DEMO_RECEIPT_ID);
  if (demo) await saveReceipt(completeDemoReceipt(demo));
  await onRefreshReceipts();
  await setOnboardingStatus("stage_3");
  onTaxDisplayOverride(0); // start odometer 0 → 28.5
  // after 300ms animation + snackbar → stage_4
}
```

- [ ] **Step 4: Export `handleSnapIntent(status)` for HomeScreen**

```typescript
export function resolveSnapIntent(
  status: OnboardingStatus,
  handlers: { openSandbox: () => void; openSignup: () => void },
): boolean {
  if (status === "stage_1") {
    handlers.openSandbox();
    return false;
  }
  if (status === "deferred_login") {
    handlers.openSignup();
    return false;
  }
  return true;
}
```

---

### Task 8: HomeScreen integration

**Files:**
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/SnapButton.tsx`

- [ ] **Step 1: SnapButton — add guard prop**

```typescript
onSnapIntent?: () => boolean; // return false to cancel camera open

const openCamera = useCallback(() => {
  if (onSnapIntent && !onSnapIntent()) return;
  // existing logic...
}, [onSnapIntent, ...]);
```

- [ ] **Step 2: HomeScreen boot**

On mount after receipts load:

```typescript
const status = await ensureOnboardingInitialized();
setOnboardingStatus(status);
```

- [ ] **Step 3: Remove old coach imports/branches**

Delete usage of:
- `SnapCoachBanner`, `FirstReceiptCoach`, `GoogleBackupNudge` (when `shouldSkipLegacyCoaches`)
- Related `useState` / `onboardingStorage` flags for snap/first-receipt coaches

Keep `GoogleBackupNudge` only if `status === 'not_started'` is impossible for returning users — **remove entirely** per spec A.

- [ ] **Step 4: Mount `<OnboardingOrchestrator />`**

- [ ] **Step 5: Tax total for stage_1**

When `status === 'stage_1'`, force header display `$0.00` even if demo receipt exists with taxAmount 0.

When `stage_3+` or after complete, use real sum excluding demo until login converts it.

- [ ] **Step 6: Google success handler**

```typescript
await existingGoogleSignInFlow();
await setOnboardingStatus("completed");
await convertDemoReceiptAfterLogin(); // clear isOnboardingDemo
```

---

### Task 9: Receipt list demo styling

**Files:**
- Modify receipt row component (grep `ReceiptList` / card render in `HomeScreen` or dedicated file)

- [ ] **Step 1: If `receipt.isOnboardingDemo && status === 'processing'`**

Apply class from `homeVisual` or new token:

```typescript
"ring-2 ring-yellow-500/60 animate-pulse shadow-[0_0_16px_rgba(234,179,8,0.45)]"
```

- [ ] **Step 2: If demo + done**

Green left border + subtitle `COMPLETE` in green (`text-green-400`)

---

### Task 10: Export exclusion + login merge

**Files:**
- Modify: export row builder (grep `isOnboardingDemo` or filter in `buildExportExpenseRow` path)

- [ ] **Step 1: Filter demo receipts from export**

In receipt query before export:

```typescript
receipts.filter((r) => !r.isOnboardingDemo)
```

- [ ] **Step 2: `convertDemoReceiptAfterLogin()` in `demoReceipt.ts`**

```typescript
export async function convertDemoReceiptAfterLogin(): Promise<void> {
  const demo = await loadReceipt(ONBOARDING_DEMO_RECEIPT_ID);
  if (!demo) return;
  await saveReceipt({ ...demo, isOnboardingDemo: false, pendingUpload: true });
}
```

Online sync uses existing upload queue with bundled sample file blob (optional follow-up: attach sample JPEG as encrypted photo).

---

### Task 11: Cleanup old files

**Files:**
- Delete or keep unused: `components/onboarding/SnapCoachBanner.tsx`, `FirstReceiptCoach.tsx`
- Modify: `lib/onboarding/onboardingStorage.test.ts` — remove obsolete tests OR keep only `isGoogleNudgeEligible` if still used for logged-in users (spec says remove for new path — **delete nudge tests** if component removed)

- [ ] **Step 1: Delete unused coach components**

- [ ] **Step 2: Remove dead exports from `onboardingStorage.ts` or file entirely if only legacy flags remain**

Keep `GOOGLE_SOFT_DISMISSED_KEY` only if settings soft sheet still used for **returning** users who completed onboarding before — spec says new users skip it; old users with `completed` never see coaches anyway.

---

### Task 12: Final verification

- [ ] **Step 1: Unit tests**

```bash
npm run test:unit
```

- [ ] **Step 2: Manual AC checklist**

1. Clear IndexedDB + localStorage → cold start → Landing → SAMPLE card + tooltip + $0.00
2. Tap SNAP → sandbox sheet (no camera permission prompt)
3. Shutter → $28.50 odometer + snackbar → Google sheet
4. Later → tap SNAP again → Google sheet (no sandbox)
5. Login → demo receipt remains; status completed; second visit no tutorial
6. Export excludes demo until converted

- [ ] **Step 3: Update spec §17 status to Implemented**

---

## Spec coverage

| Spec section | Task |
|--------------|------|
| §3 Layered flow | Task 8 (Landing untouched) |
| §3.2 State machine | Task 2, 7 |
| §4 Demo receipt | Task 1, 9 |
| §5 Sandbox | Task 4, 5, 7 |
| §6 Aha | Task 5, 7 |
| §7 Google signup + Later | Task 6, 7, 8 |
| §8 Login merge | Task 10 |
| §10 Architecture | All tasks |
| §11 IndexedDB | Task 2 |
| §12 SNAP routing | Task 7, 8 |
| §15 AC-1–7 | Task 12 |

## Out of scope

- Sign in with Apple
- data_stream Landing changes
- Real camera / OpenAI in sandbox
