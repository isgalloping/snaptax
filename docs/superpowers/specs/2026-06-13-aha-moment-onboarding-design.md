# Aha Moment 新人引导 — Design

**Date:** 2026-06-13  
**Status:** Approved (pending implementation)  
**Scope:** In-app first-time onboarding — shadow receipt → sandbox snap → $28.50 Aha → Google signup — independent of cold-start `data_stream` Landing.

**Canonical sources:**

- [`docs/prd/onboarding.md`](../../prd/onboarding.md)
- [`docs/ui/onboarding.png`](../../ui/onboarding.png)
- [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md)

**Supersedes (partial):** P2–P5 soft-coach flows in [`2026-06-12-new-user-onboarding-design.md`](./2026-06-12-new-user-onboarding-design.md) — SnapCoach, FirstReceiptCoach, 3rd-receipt Nudge, first-settings soft Sheet for **new users**.

**Preserves:** [`2026-06-10-unified-data-stream-splash-design.md`](./2026-06-10-unified-data-stream-splash-design.md) — `data_stream` Landing on every cold start.

---

## 1. Problem

New users see an empty list and `$0.00` tax saved — no immediate proof of value. Existing coach banners teach behavior slowly and defer Google signup until the 3rd receipt or settings visit.

**Goal:** Within **5 seconds** of first main-screen entry (after Landing), demonstrate tax savings ($28.50) via a zero-friction sandbox snap, then prompt Google login to lock assets.

---

## 2. Decisions (brainstorming approved)

| Topic | Choice |
|-------|--------|
| Landing vs onboarding | **`data_stream` every cold start** (app entry); **onboarding only first time inside app** |
| Second visit | No shadow / tooltip / sandbox; status `deferred_login` or `completed` |
| Signup | **Google only** — no Sign in with Apple |
| Old coaches | **Fully replaced** when new onboarding path applies; removed for users who complete or defer |
| Sandbox snap | **Pure local mock** — no camera API, no OpenAI/API; fixed **$28.50** tax saved |
| Later button | → `deferred_login`; **next real SNAP hard-opens Google Sheet** |
| UI tabs in mockup | **Ignored** — keep 2 logical pages (home + settings) |
| Architecture | **Centralized `OnboardingOrchestrator`** + `lib/onboarding/*` state module |

---

## 3. Layered user flow

```
[Cold start]
  data_stream Landing (existing StartupShell, every app open)
    ↓ snap1099:landing-done
[HomeScreen]
  read IndexedDB system_meta.onboarding_status
    ├─ not_started / stage_* → OnboardingOrchestrator active
    └─ deferred_login | completed → normal home (no tutorial UI)
```

### 3.1 Onboarding stages (in-app only)

| Stage | Status transition | User sees |
|-------|-------------------|-----------|
| **1 Shadow** | `not_started` → `stage_1` | SAMPLE Home Depot card (yellow glow), tax saved $0.00, SNAP tooltip |
| **2 Sandbox** | `stage_1` → `stage_2` on SNAP tap | Sandbox camera Bottom Sheet (preset receipt image, no getUserMedia) |
| **3 Aha** | shutter → `stage_3` | FLASH DONE ≤400ms; odometer $0→$28.50 ≤300ms; haptic; green COMPLETE card; snackbar |
| **4 Signup** | auto → `stage_4` | Google Bottom Sheet; **Later** → `deferred_login` |
| **Done** | Google success → `completed` | Demo receipt bound + uploaded; normal app |

### 3.2 State machine

```typescript
type OnboardingStatus =
  | "not_started"
  | "stage_1"       // shadow injected, tooltip visible
  | "stage_2"       // sandbox sheet open
  | "stage_3"       // aha animation running
  | "stage_4"       // signup sheet visible
  | "deferred_login" // later dismissed; snap gate active
  | "completed";    // google login success
```

**Persistence:** IndexedDB `system_meta` key `onboarding_status`.

**No restart on second app open:** When status is `deferred_login` or `completed`, skip stages 1–4 tutorial UI.

---

## 4. Demo receipt (local only)

### 4.1 Identity

- Fixed ID: `onboarding-demo-receipt` (idempotent seed)
- Flag: `Receipt.isOnboardingDemo?: boolean` — **does not add a 4th list state**

### 4.2 Fields

| Phase | merchant | amount | taxAmount | status | subtitle |
|-------|----------|--------|-----------|--------|----------|
| Stage 1 | `SAMPLE: Home Depot` | 182.12 | 0 | `processing` | `Pending Test` |
| Stage 3+ | same | 182.12 | **28.50** | `done` | `COMPLETE` (green) |

### 4.3 Visual

- Stage 1: yellow breathing glow on card (CSS)
- Stage 3+: green check / green border per UI mockup
- Top bar during Aha: animate Est. Tax Saved to **$28.50**

### 4.4 Rules

- Demo receipt excluded from export until converted after login
- Does not trigger OpenAI or receipt upload during sandbox
- Survives refresh / process kill (IndexedDB)

---

## 5. Sandbox camera (Stage 2)

- **Bottom Sheet** full-screen camera chrome — not a center Modal
- Background: bundled Home Depot sample image (not live camera)
- Yellow shutter button → `completeSandboxSnap()`:
  1. Update demo receipt to `done`, `taxAmount: 28.50`
  2. Close sheet
  3. Enter `stage_3` Aha sequence
- FLASH DONE micro-animation ≤ **400ms**
- Does not invoke existing `SnapButton` capture / Blob / API pipeline

---

## 6. Aha moment (Stage 3)

- **Odometer:** $0.00 → $28.50 in ≤ **300ms** (AC-2)
- **Haptic:** `navigator.vibrate(200)` synced with final digit (where supported)
- **Snackbar:** “You just saved $28.50!” — auto-dismiss ~3s
- Then transition to `stage_4` and open Google signup Sheet

---

## 7. Google signup (Stage 4)

- Reuse `GoogleSignInSheet` with new mode `onboarding-signup`
- Copy (English, i18n):

  > You just saved your first $28.50! Create your secure local vault now to lock and backup your tax assets permanently.

- Primary CTA: **Continue with Google** (iOS and Android)
- **No Apple Sign-In**
- **Later** → `deferred_login`; demo receipt stays in IndexedDB

### 7.1 Deferred login snap gate

When `onboarding_status === "deferred_login"` and user taps **SNAP RECEIPT**:

- Intercept before real camera
- Hard-open Google Sheet (same copy)
- After login → `completed`, proceed to normal camera on subsequent snaps

Export / multi-device hard gates unchanged (existing PRD).

---

## 8. Google login merge (AC-3)

On Google login success during onboarding:

1. Existing Ghost ↔ Google bind + receipt migration
2. Locate demo receipt (`isOnboardingDemo: true`)
3. If online: upload bundled sample image once (optional server row) or bind local row to `userId`
4. Clear `isOnboardingDemo` or retain as normal `done` receipt
5. Set `onboarding_status = completed`
6. **Do not** clear IndexedDB; **do not** re-run onboarding

---

## 9. Cross-end (Web → PWA)

| Scenario | Behavior |
|----------|----------|
| Web: completed onboarding + Google → install PWA → reopen | Session + receipts sync; `completed`; no tutorial |
| Web: Later → PWA first open | Ghost cookie persists; `deferred_login`; no shadow UI; snap gate active |
| No session on PWA | Continue as Ghost with stored status |

No new cross-end protocol; relies on Ghost cookie + Google session.

---

## 10. Architecture

### 10.1 New modules

| Path | Role |
|------|------|
| `lib/onboarding/onboardingState.ts` | Status read/write, transitions, legacy flag migration |
| `lib/onboarding/demoReceipt.ts` | Seed / complete demo receipt constants |
| `lib/onboarding/onboardingState.test.ts` | Transition tests |
| `components/onboarding/OnboardingOrchestrator.tsx` | Stage dispatcher |
| `components/onboarding/SnapTooltip.tsx` | Stage 1 tooltip |
| `components/onboarding/SandboxCameraSheet.tsx` | Stage 2 sheet |
| `components/onboarding/TaxSavedOdometer.tsx` | Stage 3 header animation |
| `components/onboarding/OnboardingSnackbar.tsx` | Stage 3 toast |
| `components/onboarding/OnboardingSignupSheet.tsx` | Stage 4 wrapper |

### 10.2 Modified

| Path | Change |
|------|--------|
| `lib/storage/receiptDb.ts` | `system_meta` store; serialize `isOnboardingDemo` |
| `lib/types.ts` | `isOnboardingDemo?: boolean` on `Receipt` |
| `components/home/HomeScreen.tsx` | Mount orchestrator; remove old coach/nudge branches |
| Receipt list components | Demo card styling (glow / COMPLETE) |
| `components/auth/GoogleSignInSheet.tsx` | `onboarding-signup` mode |
| `lib/i18n/*` | Onboarding strings |

### 10.3 Removed / disabled (new-user path)

- `SnapCoachBanner`
- `FirstReceiptCoach`
- `GoogleBackupNudge` (for users in onboarding funnel)
- First-visit settings soft Google Sheet (for new users)

Hard export / settings account warnings **remain** for all users.

---

## 11. IndexedDB schema

Bump `receiptDb` version:

```typescript
// objectStore: system_meta  { keyPath: "key" }
{ key: "onboarding_status", value: OnboardingStatus }
```

**Legacy migration:** If old `localStorage` onboarding flags exist AND user has ≥1 non-demo receipt → set `completed` without showing tutorial.

---

## 12. SNAP button routing

| `onboarding_status` | SNAP tap |
|---------------------|----------|
| `stage_1` | Open sandbox sheet |
| `deferred_login` | Hard-open Google Sheet |
| `completed` / normal user | Existing real camera flow |

---

## 13. Error handling

| Case | Behavior |
|------|----------|
| IndexedDB unavailable | Skip onboarding; normal home (fail open) |
| Duplicate demo seed | Idempotent fixed ID |
| Google login failure | Stay `stage_4` or allow retry from `deferred_login` |
| Post-login upload fail | Local queue `pendingUpload`; existing offline behavior |

---

## 14. Visual & product constraints

- Colors: `#000000` / `#FFFFFF` / `#EAB308`; success green for COMPLETE / odometer
- Touch targets: SNAP >96px; tooltip must not cover SNAP
- Sheets only — sandbox + signup are Bottom Sheets
- English UI strings via i18n
- List stays **3 states** (`processing` / `done` / `blurry`) — demo uses subtitle + styling, not new status enum

---

## 15. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-1 | First launch after Landing: SAMPLE card + $0.00 + tooltip |
| AC-2 | After sandbox shutter: odometer ≤300ms, haptic sync, ≥55fps on mid device |
| AC-3 | Google login: demo receipt not lost; onboarding not restarted |
| AC-4 | Second cold start: no shadow/tooltip/sandbox |
| AC-5 | Later → next real SNAP opens Google Sheet |
| AC-6 | After `completed`: no SnapCoach / FirstReceiptCoach / 3rd-receipt Nudge |
| AC-7 | `data_stream` Landing still plays every cold start, independent of onboarding |

---

## 16. Out of scope

- Sign in with Apple
- Bottom tab navigation (Home / Receipts / Stats / Settings)
- Sandbox calling OpenAI or real camera
- Replacing `data_stream` Landing with 1.2s marketing carousel
- Cookie / tracking banners

---

## 17. Implementation status

| Item | Status |
|------|--------|
| Design spec | ✅ Approved |
| Implementation plan | ✅ [`2026-06-13-aha-moment-onboarding.md`](../plans/2026-06-13-aha-moment-onboarding.md) |
| Code | ✅ Implemented (remediation 2026-06-14) |
