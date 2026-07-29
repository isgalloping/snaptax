# Onboarding Optional Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Later ends onboarding without Google; fix stage_4 Google login (Ghost + visible GIS); migrate legacy `deferred_login`.

**Architecture:** Amend state machine in `lib/onboarding/onboardingState.ts`; remove SNAP gate from `resolveSnapIntent`; refactor `GoogleSignInSheet` to run `ensureGhostSession` + `signInWithGoogleApi` before parent post-login callback; visible GIS button mount inside sheet.

**Tech Stack:** Next.js 16 · React 19 · IndexedDB · Google Identity Services · existing `signInWithGoogleApi`

**Spec:** [`docs/superpowers/specs/2026-06-14-onboarding-optional-signup-design.md`](../specs/2026-06-14-onboarding-optional-signup-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/onboarding/onboardingState.ts` | `deferred_login` → `completed` migration on read |
| `lib/onboarding/onboardingState.test.ts` | Update snap-gate / migration tests |
| `components/onboarding/OnboardingOrchestrator.tsx` | Later → `completed`; remove deferred SNAP branch |
| `components/onboarding/useOnboardingFlow.ts` | Drop `deferred_login` from active flow / tax display |
| `lib/client/googleAuth.ts` | `mountGoogleSignInButton(container)` visible GIS |
| `components/auth/GoogleSignInSheet.tsx` | Ghost + GIS + API; post-login `onSuccess` only |
| `components/home/HomeScreen.tsx` | Split auth vs post-login onboarding handler |
| `components/home/OfflineHomeShell.tsx` | Post-login handler only |
| `components/export/useTaxExportGate.tsx` | Post-login handler only |
| `components/settings/SettingsScreen.tsx` | Post-login handler only |

---

### Task 1: State migration + tests

**Files:**
- Modify: `lib/onboarding/onboardingState.ts`
- Modify: `lib/onboarding/onboardingState.test.ts`

- [ ] **Step 1: Add `normalizeOnboardingStatus` helper**

```typescript
export async function normalizeOnboardingStatus(
  status: OnboardingStatus,
): Promise<OnboardingStatus> {
  if (status === "deferred_login") {
    await setOnboardingStatus("completed");
    return "completed";
  }
  return status;
}
```

Call from `ensureOnboardingInitialized()` before return and from `getOnboardingStatus()`.

- [ ] **Step 2: Update tests**

Replace `deferred_login triggers snap gate` with migration test:

```typescript
it("migrates deferred_login to completed", async () => {
  // mock readSystemMeta returning deferred_login
  assert.equal(await normalizeOnboardingStatus("deferred_login"), "completed");
});
it("isSnapGateActive is false for deferred_login", () => {
  assert.equal(isSnapGateActive("deferred_login"), false);
});
```

- [ ] **Step 3: Run tests**

Run: `npm run test:unit -- lib/onboarding/onboardingState.test.ts`

---

### Task 2: Remove deferred SNAP gate

**Files:**
- Modify: `components/onboarding/OnboardingOrchestrator.tsx`
- Modify: `components/onboarding/useOnboardingFlow.ts`

- [ ] **Step 1: `resolveSnapIntent` — delete `deferred_login` branch**

- [ ] **Step 2: `handleSignupLater` — write `completed` not `deferred_login`**

```typescript
await setOnboardingStatus("completed");
onStatusChange("completed");
```

- [ ] **Step 3: `useOnboardingFlow` — remove `deferred_login` from `onboardingInFlow`, `displayTaxSaved`, `handleSnapIntent` openSignup path**

---

### Task 3: GoogleSignInSheet auth fix

**Files:**
- Modify: `lib/client/googleAuth.ts`
- Modify: `components/auth/GoogleSignInSheet.tsx`
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/OfflineHomeShell.tsx`
- Modify: `components/export/useTaxExportGate.tsx`
- Modify: `components/settings/SettingsScreen.tsx`

- [ ] **Step 1: Add visible GIS mount**

```typescript
export async function mountGoogleSignInButton(
  container: HTMLElement,
): Promise<void> {
  await loadGoogleIdentityScript();
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID missing");
  // initialize once, renderButton into container, return Promise resolved on credential callback
}
```

Keep `requestGoogleCredential()` for non-sheet callers or refactor to share callback promise.

- [ ] **Step 2: GoogleSignInSheet — auth pipeline**

```typescript
const handleGoogle = async () => {
  setLoading(true);
  setError(null);
  try {
    await ensureGhostSession();
    await signInWithGoogleApi();
    await onSuccess();
  } catch (e) {
    onFailure?.(authCopy.signInFailed);
  } finally {
    setLoading(false);
  }
};
```

Option A: Yellow CTA triggers `handleGoogle` (keep branded button).  
Option B: Show GIS button below copy; yellow CTA hidden in onboarding mode.

Recommended: **Yellow CTA triggers pipeline** (minimal UI change); fix hidden GIS only if CTA uses `requestGoogleCredential` internally.

- [ ] **Step 3: Callers — `onSuccess` is post-login only**

HomeScreen:

```typescript
const handleOnboardingPostLogin = useCallback(async () => {
  await handlePostLoginSync(/* from session */);
  await convertDemoReceiptAfterLogin();
  await ensureConvertedDemoUploadReady();
  await refreshListFromLocal();
}, [...]);
```

Export gate: remove `onSignInWithGoogle()` from `handleGoogleSuccess`; only post-login sync.

- [ ] **Step 4: HomeScreen onboarding handler — add ensureGhost in sheet, not duplicate here**

---

### Task 4: Verification

- [ ] Run: `npm run test:unit`
- [ ] Manual: stage_4 Later → SNAP opens camera; no sheet
- [ ] Manual: stage_4 Google success → completed + demo converted
- [ ] Manual: Google fail → stay stage_4, error visible

- [ ] **Update spec status** in `2026-06-14-onboarding-optional-signup-design.md` → Code: Implemented

---

## Spec coverage checklist

| Spec § | Task |
|--------|------|
| §3 Later → completed | Task 2 |
| §4 Remove SNAP gate | Task 2 |
| §6 Google fix | Task 3 |
| §7 Migration | Task 1 |
| AC-A1~A8 | Tasks 1–4 |
