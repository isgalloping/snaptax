# Android WebAPK HyperOS Launch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guide Android users through HyperOS Chrome permission on WebAPK launch; harden manifest so home-screen install opens standalone reliably.

**Architecture:** Revert `start_url` to `/`, add `launch_handler`; new `WebApkLaunchGuideSheet` with `pre-install` and `post-install` variants; `PwaInstallProvider.install()` gates native prompt behind pre-sheet; `appinstalled` listener shows post-sheet.

**Tech Stack:** Next.js 16 manifest route · React 19 · Serwist PWA · i18n locales (en/de/fr)

**Spec:** `docs/superpowers/specs/2026-06-19-android-webapk-hyperos-launch-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `app/manifest.ts` | `start_url: "/"`, `launch_handler` |
| `lib/i18n/types.ts` | `pwa.webApkGuide` shape |
| `lib/i18n/locales/*.ts` | Pre/post install copy + manual step |
| `components/pwa/WebApkLaunchGuideSheet.tsx` | Bottom sheet UI (pre/post) |
| `components/pwa/PwaInstallProvider.tsx` | Install gate + post-install trigger |
| `lib/i18n/index.test.ts` | Locale shape validation |

---

### Task 1: Manifest hardening v2

**Files:**
- Modify: `app/manifest.ts`

- [ ] **Step 1:** Change `start_url` from `"/?source=pwa"` to `"/"`.

- [ ] **Step 2:** Add `launch_handler`:

```typescript
launch_handler: {
  client_mode: "navigate-existing",
},
```

If TypeScript rejects `launch_handler` on `MetadataRoute.Manifest`, cast the return object:

```typescript
return {
  // ...existing fields
  launch_handler: { client_mode: "navigate-existing" },
} as MetadataRoute.Manifest;
```

- [ ] **Step 3:** Run build:

```bash
npx next build
```

Expected: exit 0, `/manifest.webmanifest` route compiles.

- [ ] **Step 4:** Commit

```bash
git add app/manifest.ts
git commit -m "fix(pwa): align start_url and add launch_handler for WebAPK stability"
```

---

### Task 2: i18n types and copy

**Files:**
- Modify: `lib/i18n/types.ts`
- Modify: `lib/i18n/locales/en-US.ts`
- Modify: `lib/i18n/locales/de-DE.ts`
- Modify: `lib/i18n/locales/fr-FR.ts`

- [ ] **Step 1:** Add to `UserCopy.pwa`:

```typescript
webApkGuide: {
  preInstallTitle: string;
  preInstallBody: string;
  continueInstall: string;
  postInstallTitle: string;
  postInstallSteps: string[];
  gotIt: string;
};
```

- [ ] **Step 2:** Add en-US strings:

```typescript
webApkGuide: {
  preInstallTitle: "Before you install",
  preInstallBody:
    "After install, open Snap1099 from your home screen — not inside Chrome. On some Android phones, the first launch asks to open Chrome. Tap Always allow. Denying will prevent the app from opening.",
  continueInstall: "Continue install",
  postInstallTitle: "Snap1099 installed",
  postInstallSteps: [
    "Go to your home screen and tap the Snap1099 icon.",
    "If your phone asks to open Chrome, tap Always allow.",
    "The app opens full-screen with no address bar.",
  ],
  gotIt: "Got it",
},
```

- [ ] **Step 3:** Append to `manualSteps.chromiumAndroid` (3rd step):

```typescript
"On first launch from your home screen, if asked to open Chrome, tap Always allow. Denying blocks the app from opening.",
```

- [ ] **Step 4:** Add equivalent de-DE and fr-FR translations.

- [ ] **Step 5:** Run test:

```bash
npm run test:unit -- lib/i18n/index.test.ts
```

Expected: PASS

- [ ] **Step 6:** Commit

```bash
git add lib/i18n/types.ts lib/i18n/locales/en-US.ts lib/i18n/locales/de-DE.ts lib/i18n/locales/fr-FR.ts
git commit -m "feat(i18n): add WebAPK HyperOS launch guide copy"
```

---

### Task 3: WebApkLaunchGuideSheet component

**Files:**
- Create: `components/pwa/WebApkLaunchGuideSheet.tsx`

- [ ] **Step 1:** Create component matching `InstallManualSheet` / `ExitConfirmSheet` styling (black/yellow, bottom sheet, z-[100]):

```tsx
"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

export type WebApkGuideVariant = "pre-install" | "post-install";

interface WebApkLaunchGuideSheetProps {
  open: boolean;
  variant: WebApkGuideVariant;
  onContinue: () => void;
  onDismiss: () => void;
}

export function WebApkLaunchGuideSheet({
  open,
  variant,
  onContinue,
  onDismiss,
}: WebApkLaunchGuideSheetProps) {
  const guide = useUserCopy().pwa.webApkGuide;

  if (!open) return null;

  const isPre = variant === "pre-install";
  const title = isPre ? guide.preInstallTitle : guide.postInstallTitle;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="webapk-guide-title"
    >
      <button
        type="button"
        aria-label={guide.gotIt}
        className="absolute inset-0 bg-black/70"
        onClick={isPre ? onDismiss : onDismiss}
      />
      <div
        className="relative z-10 w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-4 pb-8"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2
          id="webapk-guide-title"
          className="text-lg font-black uppercase tracking-wider text-white"
        >
          {title}
        </h2>
        {isPre ? (
          <p className="mt-3 text-sm font-bold leading-snug text-zinc-300">
            {guide.preInstallBody}
          </p>
        ) : (
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm font-bold text-zinc-200">
            {guide.postInstallSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        <button
          type="button"
          onClick={isPre ? onContinue : onDismiss}
          className="mt-6 min-h-16 w-full rounded-xl bg-yellow-500 text-sm font-black uppercase tracking-wide text-black active:scale-95"
        >
          {isPre ? guide.continueInstall : guide.gotIt}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Pre-install backdrop tap calls `onDismiss` (cancel install). Post-install backdrop tap calls `onDismiss`.

- [ ] **Step 3:** Commit

```bash
git add components/pwa/WebApkLaunchGuideSheet.tsx
git commit -m "feat(pwa): add WebApkLaunchGuideSheet for pre/post install guidance"
```

---

### Task 4: Wire PwaInstallProvider

**Files:**
- Modify: `components/pwa/PwaInstallProvider.tsx`

- [ ] **Step 1:** Add state:

```typescript
const [webApkGuideOpen, setWebApkGuideOpen] = useState(false);
const [webApkGuideVariant, setWebApkGuideVariant] =
  useState<WebApkGuideVariant>("pre-install");
const pendingNativeInstallRef = useRef(false);
```

- [ ] **Step 2:** Extract native prompt into `runNativeInstall`:

```typescript
const runNativeInstall = useCallback(async () => {
  const deferredPrompt = getDeferredInstallPrompt();
  if (!deferredPrompt) {
    setManualSheetOpen(true);
    return;
  }
  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      clearDeferredInstallPrompt();
      setManualSheetOpen(false);
      setMode("none");
    }
  } catch {
    setManualSheetOpen(true);
  }
  void sync();
}, [sync]);
```

- [ ] **Step 3:** Change `install()` — on `chromium-android` with deferred prompt, open pre-install sheet instead of calling prompt immediately:

```typescript
const install = useCallback(async () => {
  const platform = getInstallPlatform();
  if (!supportsNativeInstallPrompt(platform)) {
    setManualSheetOpen(true);
    return;
  }
  if (await isPwaInstalledOnDevice()) {
    setMode("none");
    return;
  }
  const deferredPrompt = getDeferredInstallPrompt();
  if (!deferredPrompt) {
    setManualSheetOpen(true);
    return;
  }
  if (platform === "chromium-android") {
    pendingNativeInstallRef.current = true;
    setWebApkGuideVariant("pre-install");
    setWebApkGuideOpen(true);
    return;
  }
  await runNativeInstall();
}, [runNativeInstall, sync]);
```

- [ ] **Step 4:** Add handlers:

```typescript
const handleWebApkGuideContinue = useCallback(() => {
  setWebApkGuideOpen(false);
  if (pendingNativeInstallRef.current) {
    pendingNativeInstallRef.current = false;
    void runNativeInstall();
  }
}, [runNativeInstall]);

const handleWebApkGuideDismiss = useCallback(() => {
  pendingNativeInstallRef.current = false;
  setWebApkGuideOpen(false);
}, []);
```

- [ ] **Step 5:** In existing `appinstalled` listener inside `initDeferredInstallCapture` (`lib/pwa/deferredInstall.ts`), add a window event subscribers can use — **or** add listener in `PwaInstallProvider` useEffect:

```typescript
useEffect(() => {
  const onInstalled = () => {
    if (getInstallPlatform() !== "chromium-android") return;
    setWebApkGuideVariant("post-install");
    setWebApkGuideOpen(true);
  };
  window.addEventListener("appinstalled", onInstalled);
  return () => window.removeEventListener("appinstalled", onInstalled);
}, []);
```

Prefer provider-level listener (no change to deferredInstall.ts).

- [ ] **Step 6:** Render sheet in provider tree:

```tsx
<WebApkLaunchGuideSheet
  open={webApkGuideOpen}
  variant={webApkGuideVariant}
  onContinue={handleWebApkGuideContinue}
  onDismiss={handleWebApkGuideDismiss}
/>
```

- [ ] **Step 7:** Commit

```bash
git add components/pwa/PwaInstallProvider.tsx
git commit -m "feat(pwa): gate Android install with HyperOS Chrome permission guide"
```

---

### Task 5: Cross-ref prior spec

**Files:**
- Modify: `docs/superpowers/specs/2026-06-19-android-pwa-standalone-launch-design.md`

- [ ] **Step 1:** Add note at top: `start_url` superseded by `2026-06-19-android-webapk-hyperos-launch-design.md` (reverted to `/`).

- [ ] **Step 2:** Commit

```bash
git add docs/superpowers/specs/2026-06-19-android-pwa-standalone-launch-design.md docs/superpowers/specs/2026-06-19-android-webapk-hyperos-launch-design.md
git commit -m "docs: add HyperOS WebAPK launch spec and cross-ref"
```

---

### Task 6: Verification

- [ ] **Step 1:** Run unit tests:

```bash
npm run test:unit
```

Expected: all pass

- [ ] **Step 2:** Run build:

```bash
npx next build
```

Expected: exit 0

- [ ] **Step 3:** Manual on Xiaomi HyperOS (see checklist below)

---

## Manual test checklist (Xiaomi HyperOS)

- [ ] Uninstall old Snap1099 from home screen + Chrome site settings → Clear data
- [ ] Open site in Chrome → dismiss install bar (Not now) → header phone+ icon visible
- [ ] Tap install → **pre-install sheet** → Continue → Chrome native install → Accept
- [ ] **post-install sheet** appears → Got it
- [ ] Home screen icon → system「想要打开 Chrome」→ tap **始终允许** → standalone, no URL bar
- [ ] Re-test denying permission → app stuck (expected OS behavior)
- [ ] Reinstall, allow → works again

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| `start_url: "/"` | Task 1 |
| `launch_handler` | Task 1 |
| Pre-install sheet before prompt | Task 3, 4 |
| Post-install on `appinstalled` | Task 4 |
| Manual step for Chrome permission | Task 2 |
| i18n en/de/fr | Task 2 |
| Out of scope respected | No TWA / no runtime deny detection |
