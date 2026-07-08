# Onboarding — Hero First Visit + data_stream Return — Design

**Date:** 2026-06-14  
**Status:** Approved — Implemented 2026-06-14  
**Amends:**
- [`2026-06-13-aha-moment-onboarding-design.md`](./2026-06-13-aha-moment-onboarding-design.md) §2 Landing vs onboarding, §3 layered flow
- [`2026-06-14-onboarding-optional-signup-design.md`](./2026-06-14-onboarding-optional-signup-design.md) — reaffirms Later / Google → `completed`

**Canonical UI:**
- [`docs/ui/onboarding.png`](../../ui/onboarding.png)
- [`docs/res/onboarding-hero.png`](../../res/onboarding-hero.png)
- [`docs/res/onboading-receipt.png`](../../res/onboading-receipt.png)

---

## 1. Problem

1. **冷启动与 mockup 不一致：** 当前全员 `WorkerWelcomeLanding`（相机图标 + 编号步骤），非 mockup Stage 0（蓝领 Hero + 绿勾清单 + LET'S GO）。
2. **Landing 策略与产品意图冲突：** 已批准 Aha spec 写「每次 cold start 播 data_stream」；产品现要求 **首次 Hero 教程、回访 data_stream**。
3. **样本资产过时：** 沙盒/影子小票仍用 Home Depot $182.12；设计资产为 **Builder Depot** $193.12。
4. **Stage 0 与 stage_1 衔接：** `ensureOnboardingInitialized()` 在 `not_started` 时直接写 `stage_1`，跳过 Stage 0 CTA。

**Brainstorming approved:** 2026-06-14 — Option **A**（首次 Stage 0 Hero，不播 data_stream）；Google **不强制**；Login / Later 均结束教程且 **永不再进**。

---

## 2. Decisions

| Topic | Old (2026-06-13) | New (this spec) |
|-------|------------------|-----------------|
| 首次冷启动 | `data_stream` 或全员 WorkerWelcome | **Hero Stage 0**（mockup）；**无** data_stream |
| 回访冷启动 | 同上 | **`data_stream` only**（2.4s min hold） |
| Stage 0 | Out of scope | **In scope** — 单屏 Hero + Let's Go |
| 教程结束 | Later → `completed` (amendment) | **不变** — Login 或 Later → `completed` |
| 小票样本 | Home Depot $182.12 | **Builder Depot $193.12** |
| Aha 税额 | $28.50 fixed | **不变** $28.50 |
| 推进方式 | 部分自动 | **逐步点击**（Stage 3 动画自动） |
| 架构 | WorkerWelcome 全员 | **R1：`LandingRouter` 按 status 分支** |

---

## 3. Layered user flow

```text
[Cold start]
  read onboarding_status (localStorage mirror + IDB authority)
    ├─ not_started
    │     HeroWelcomeLanding (Stage 0)
    │       Let's Go → set stage_1 → LandingGate exit → HomeScreen
    ├─ stage_1 … stage_4 (resume)
    │     Skip Stage 0; optional 200ms fade or instant home mount
    │     OnboardingOrchestrator continues at current stage
    └─ completed
          DataStreamLanding (2.4s min, 5s soft max)
            → LandingGate exit → HomeScreen (no tutorial UI)

[HomeScreen — status ∈ {stage_1…stage_4}]
  Stage 1  Shadow + SNAP tooltip → user taps SNAP
  Stage 2  Sandbox (Builder Depot image) → user taps shutter
  Stage 3  Aha odometer $28.50 + haptic + snackbar (auto)
  Stage 4  Google Sheet → Login success OR Later → completed
```

**Never again:** Once `completed`, cold start never shows Hero Stage 0 or in-app tutorial stages.

---

## 4. State machine

```typescript
type OnboardingStatus =
  | "not_started"   // Stage 0 not yet dismissed
  | "stage_1"       // shadow + tooltip
  | "stage_2"       // sandbox open
  | "stage_3"       // aha animation
  | "stage_4"       // signup sheet
  | "deferred_login" // legacy — migrate to completed on read
  | "completed";
```

### Transitions (delta from 2026-06-13)

| Event | From | To |
|-------|------|-----|
| App first init (legacy user w/ real receipts) | — | `completed` |
| **Let's Go (Stage 0 CTA)** | `not_started` | **`stage_1`** |
| SNAP tap | `stage_1` | `stage_2` |
| Sandbox shutter | `stage_2` | `stage_3` |
| Aha sequence end | `stage_3` | `stage_4` |
| Google success / Later | `stage_4` | `completed` |

**Remove:** `ensureOnboardingInitialized()` auto `not_started` → `stage_1` without Stage 0 CTA.

**Persistence:** IndexedDB `system_meta.onboarding_status` (authority).

**Cold-start mirror:** `localStorage` key `snap1099_onboarding_status` — written on every `setOnboardingStatus()` for sync read before IDB hydrates.

---

## 5. Stage 0 — HeroWelcomeLanding

Replace / refactor `WorkerWelcomeLanding` to match mockup.

### 5.1 Visual

| Element | Spec |
|---------|------|
| Background | Full-bleed image `/onboarding/onboarding-hero.png` (from `docs/res/onboarding-hero.png`) + dark gradient overlay for text contrast |
| Headline | **Keep More of Your Hard Earned Money.** (yellow accent on key words per mockup) |
| Subhead | AI finds tax deductions others miss. |
| Checklist | Green ✓ — Works Offline · 10 Receipts in 10 Sec · No Signup Needed |
| CTA | **LET'S GO! ⚡** — yellow, min-h-16, `active:scale-95` |
| Carousel dots | **Decorative only** (single screen; no multi-slide) |

### 5.2 Behavior

- CTA enabled after **600ms** (match current debounce).
- Tap CTA:
  1. `await setOnboardingStatus("stage_1")`
  2. `window.dispatchEvent(new Event("snap1099:landing-cta"))` — existing `LandingGate` handler
- **No auto-dismiss timer** on Stage 0 (user must tap); `LandingGate.resolveExit` for Hero path: exit only on CTA + `homeChunkReady` (or 5s soft max offline-pack).
- Image load failure: dark `#000` fallback + copy still visible.

### 5.3 i18n keys (`onboarding.landing`)

| Key | en-US draft |
|-----|-------------|
| `headline` | Keep More of Your Hard Earned Money. |
| `tagline` | AI finds tax deductions others miss. |
| `check1` | Works Offline |
| `check2` | 10 Receipts in 10 Sec |
| `check3` | No Signup Needed |
| `cta` | Let's Go! ⚡ |
| `ctaAria` | Start onboarding |

Remove or deprecate numbered `step1`–`step3` in favor of checklist keys.

---

## 6. Stage 1–4 — In-app tutorial (asset refresh)

### 6.1 Demo receipt

| Field | Value |
|-------|-------|
| merchant | `SAMPLE: Builder Depot` |
| amount | **193.12** |
| taxAmount (stage 1) | 0 |
| taxAmount (stage 3+) | **28.50** |
| status stage 1 | `processing` / subtitle `Pending Test` |
| status stage 3+ | `done` / subtitle `COMPLETE` |
| image | `/onboarding/sample-builder-depot.png` (from `docs/res/onboading-receipt.png`) |

Update `lib/onboarding/demoReceipt.ts`, `SandboxCameraSheet`, tests.

### 6.2 Step-by-step gates

| Stage | User action required |
|-------|---------------------|
| 0 | Tap Let's Go |
| 1 | Tap SNAP RECEIPT (tooltip visible; `resolveSnapIntent` opens sandbox) |
| 2 | Tap shutter |
| 3 | Auto Aha (≤400ms flash + ≤300ms odometer) |
| 4 | Tap Google login OR Later |

### 6.3 Stage 4 — optional Google (unchanged amendment)

- **Later** → `completed`; orchestrator inactive; real SNAP works.
- **Google success** → demo convert + `completed`.
- Export / Settings hard gates **unchanged**.

---

## 7. LandingRouter (cold-start branch)

### 7.1 Component

```typescript
// components/landing/LandingRouter.tsx (client)
function LandingRouter() {
  const variant = useLandingVariant(); // reads localStorage mirror, then IDB reconcile
  if (variant === "data_stream") return <DataStreamLanding />;
  if (variant === "hero") return <HeroWelcomeLanding />;
  return null; // resume stage_1+ : minimal fade shell or empty until gate exits
}
```

### 7.2 `useLandingVariant()` logic

| `onboarding_status` | Landing UI |
|-----------------------|------------|
| `not_started` | `hero` |
| `stage_1`–`stage_4` | `none` (skip Stage 0 on resume) |
| `completed` | `data_stream` |
| missing mirror, IDB pending | default `hero` until IDB confirms `completed` |

### 7.3 `LandingGate` timing

| Variant | `LANDING_MIN_MS` | Exit trigger |
|---------|------------------|--------------|
| `data_stream` | 2400 | timer + chunk ready (existing) |
| `hero` | 0 | **CTA only** (+ 5s soft max fallback) |
| `none` (resume) | 0 | chunk ready immediately |

Extend `lib/landing/landingTiming.ts` with variant-aware `resolveExit` or pass `minHoldMs` into `LandingGate`.

### 7.4 `app/page.tsx`

```tsx
<div id="landing-ssr-layer" className="landing-overlay …">
  <LandingRouter />
</div>
<StartupShell />
```

SSR: render neutral black shell or hero placeholder to avoid flash of wrong variant.

---

## 8. Files to touch

| Area | Files |
|------|-------|
| Landing | `LandingRouter.tsx`, `HeroWelcomeLanding.tsx` (refactor from `WorkerWelcomeLanding`), `LandingGate.tsx`, `landingTiming.ts`, `app/page.tsx` |
| State | `onboardingState.ts`, `onboardingStorage.ts` (mirror key), `onboardingState.test.ts` |
| Demo | `demoReceipt.ts`, `demoReceipt.test.ts` |
| Onboarding UI | `SandboxCameraSheet.tsx`, `OnboardingOrchestrator.tsx` (verify stage_0 handoff) |
| Assets | `public/onboarding/onboarding-hero.png`, `public/onboarding/sample-builder-depot.png` |
| i18n | `lib/i18n/types.ts`, `en-US.ts`, `de-DE.ts`, `fr-FR.ts` |
| Docs | Amend `2026-06-13-aha-moment-onboarding-design.md` §2/§3 footnote; `PRODUCT-SPEC.md` §12 if needed |

**Keep:** `DataStreamLanding` + subcomponents for return visits.

---

## 9. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-H1 | Fresh user (`not_started`): Hero Stage 0 visible; **no** data_stream |
| AC-H2 | Let's Go → `stage_1` + home with shadow Builder Depot card at $0.00 tax |
| AC-H3 | Full tutorial completable by taps only (Stage 3 auto animation OK) |
| AC-H4 | Later OR Google success → `completed`; demo remains until login converts |
| AC-H5 | After `completed`, cold start shows **data_stream** only (no Hero, no tutorial) |
| AC-H6 | Kill app at `stage_2`; reopen skips Stage 0, resumes sandbox flow |
| AC-H7 | Sandbox uses Builder Depot receipt image |
| AC-H8 | Legacy user with real receipts → `completed` + data_stream on next open |
| AC-H9 | Offline first visit: Stage 0–4 work without network |

---

## 10. Out of scope

- Stage 0 multi-slide carousel
- Replacing data_stream visual redesign
- Sign in with Apple
- Changing Export/Settings Google hard gates
- Server-side onboarding status

---

## 11. Implementation status

| Item | Status |
|------|--------|
| Design | ✅ Approved 2026-06-14 |
| Implementation plan | ✅ Inline with spec |
| Code | ✅ Implemented 2026-06-14 |
