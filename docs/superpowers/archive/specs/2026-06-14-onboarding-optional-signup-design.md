# Onboarding 可选登录 — Design Amendment

**Date:** 2026-06-14  
**Status:** Approved (pending implementation)  
**Amends:** [`2026-06-13-aha-moment-onboarding-design.md`](./2026-06-13-aha-moment-onboarding-design.md)

---

## 1. Problem

1. **Later 行为过重：** 原设计 Later → `deferred_login`，下次 SNAP 硬弹 Google Sheet，与「onboarding 不强制登录」产品意图冲突。
2. **Google 登录失败：** Stage 4 点 Continue with Google 常见失败 — Ghost cookie 未就绪、GIS 隐藏按钮被 Bottom Sheet 遮挡、错误信息不明确。

---

## 2. Decisions

| Topic | Old (2026-06-13) | New (this amendment) |
|-------|------------------|----------------------|
| Later | → `deferred_login`; SNAP 硬门控 | → **`completed`**；onboarding 结束，不再弹 Sheet |
| `completed` 语义 | 仅 Google 成功 | **Aha 教程完成**（含 Later 跳过登录） |
| Google 是否必需 | onboarding 内强推 | **可选**；Export / Settings 等现有硬门控不变 |
| `deferred_login` | 活跃状态 | **废弃**；读到时一次性迁移为 `completed` |
| GIS 触发 | 离屏隐藏按钮 `.click()` | Sheet 内 **可见 GIS 按钮** + 登录前 **`ensureGhostSession()`** |

**Brainstorming approved:** 2026-06-14 — Option **A** (Later 后不再出现 Google Sheet)。

---

## 3. State machine (revised)

```typescript
type OnboardingStatus =
  | "not_started"
  | "stage_1" | "stage_2" | "stage_3" | "stage_4"
  | "deferred_login"  // legacy only — migrate on read
  | "completed";
```

### Transitions

| Event | From | To |
|-------|------|-----|
| First init | `not_started` | `stage_1` |
| Sandbox / Aha / Signup | `stage_*` | next stage (unchanged) |
| **Later** | `stage_4` | **`completed`** |
| **Google success** | `stage_4` | `completed` + demo merge |
| **Legacy read** | `deferred_login` | `completed` (write-back once) |

### `completed` without Google

- Orchestrator **inactive** — no tooltip / sandbox / signup UI
- User continues as **Ghost** — real SNAP works immediately
- Demo receipt **remains** (`isOnboardingDemo: true`) until user logs in elsewhere
- Export still excludes demo; login via Export/Settings runs existing `convertDemoReceiptAfterLogin`

### `completed` with Google (stage_4 success)

- Unchanged from 2026-06-13 §8: bind Ghost, convert demo, clear demo flag, upload if online

---

## 4. Removed behavior

**Delete SNAP intercept for onboarding login:**

```typescript
// REMOVE from resolveSnapIntent:
if (status === "deferred_login") {
  handlers.openSignup();
  return false;
}
```

**Remove from active flow:**

- `useOnboardingFlow.onboardingInFlow` must **not** include `deferred_login`
- `isSnapGateActive("deferred_login")` → always false for new users; helper may remain for tests then delete

---

## 5. Later handler (stage_4)

```typescript
async function handleSignupLater() {
  await setOnboardingStatus("completed");
  onStatusChange("completed");
  // Close sheet + snackbar via status leaving stage_4
}
```

**UI after Later:**

- Google Sheet closes
- Snackbar dismisses (or auto-dismiss on unmount)
- Tax header shows demo tax from done receipt (normal completed display)
- SNAP opens real camera on next tap

---

## 6. Google login fix

### 6.1 Required sequence

```text
User taps Continue with Google
  1. ensureGhostSession()          // POST /api/ghost/register if needed
  2. requestGoogleCredential()     // GIS — visible button in sheet
  3. POST /api/auth/google
  4. convertDemoReceiptAfterLogin + ensureConvertedDemoUploadReady
  5. setOnboardingStatus("completed")
```

### 6.2 GoogleSignInSheet changes

| Change | Detail |
|--------|--------|
| GIS UX | Render **visible** Google button inside sheet (or `prompt()` fallback); remove off-screen `-9999px` click as primary path |
| Auth ownership | Sheet calls shared helper (`signInWithGoogleApi` or prop `onSignIn`) **before** parent `onSuccess` business logic |
| Ghost | Always `ensureGhostSession()` before step 2 |
| Failure | `onFailure(i18n message)`; stay on `stage_4`; inline error + existing red alert |
| Success | Parent `onSuccess` runs demo merge + status `completed` (onboarding) or gate continuation (export/settings) |

### 6.3 Error mapping (client)

| Error | User message key |
|-------|------------------|
| `GOOGLE_CLIENT_ID missing` | config / generic failed |
| `GIS_LOAD_FAILED` / `GIS_NOT_READY` | signInFailed |
| `GOOGLE_SIGN_IN_CANCELLED` | optional silent or "Sign-in cancelled" |
| `GOOGLE_SIGN_IN_TIMEOUT` | signInFailed |
| `ghost register failed` | signInFailed |
| `GOOGLE_AUTH_FAILED` | signInFailed |

### 6.4 CSP

No change required if existing proxy CSP already allows `accounts.google.com` script + frame (verified in `lib/security/headers.ts`).

---

## 7. Migration

On `ensureOnboardingInitialized()` or `getOnboardingStatus()`:

```typescript
if (status === "deferred_login") {
  await setOnboardingStatus("completed");
  return "completed";
}
```

One-time IndexedDB write; no user-visible tutorial restart.

---

## 8. Files to touch

| Area | Files |
|------|-------|
| State | `lib/onboarding/onboardingState.ts`, `onboardingState.test.ts` |
| UI | `OnboardingOrchestrator.tsx`, `useOnboardingFlow.ts` |
| Auth | `GoogleSignInSheet.tsx`, `lib/client/googleAuth.ts` (optional) |
| Home | `HomeScreen.tsx` `handleOnboardingGoogleSuccess` — ensure ghost + error handling |
| i18n | `en-US.ts` (+ de/fr if cancel message added) |
| Docs | `2026-06-13-aha-moment-onboarding-design.md` AC-5 footnote |

---

## 9. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-A1 | Stage 4 Later → `completed`; Google Sheet **never** reappears from onboarding |
| AC-A2 | After Later, SNAP opens **real camera** (no intercept) |
| AC-A3 | After Later, cold start shows **no** tutorial UI |
| AC-A4 | Export / Settings Google gates **unchanged** |
| AC-A5 | Google success in stage_4 still converts demo + sets `completed` |
| AC-A6 | Google failure stays stage_4; user can retry; error visible |
| AC-A7 | Fresh user without ghost cookie can complete Google login from stage_4 |
| AC-A8 | Existing `deferred_login` in IndexedDB migrates to `completed` on load |

---

## 10. Out of scope

- Sign in with Apple
- Soft Google nudge reintroduction after Later
- Server-side onboarding status (remains client IndexedDB only)
- Removing demo receipt on Later

---

## 11. Implementation status

| Item | Status |
|------|--------|
| Design | ✅ Approved 2026-06-14 |
| Implementation plan | ✅ [`2026-06-14-onboarding-optional-signup.md`](../plans/2026-06-14-onboarding-optional-signup.md) |
| Code | ✅ Implemented |
