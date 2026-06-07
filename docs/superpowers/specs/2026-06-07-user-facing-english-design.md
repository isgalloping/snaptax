# User-Facing English Copy — Design

**Date:** 2026-06-07  
**Status:** Approved  
**Approach:** A — Direct English replacement (no i18n framework)

---

## 1. Goal

Replace all user-visible Chinese strings with English across the Snap1099 PWA runtime UI. Align with PRODUCT-SPEC target market (US / EU 1099 contractors). No `next-intl` or locale switching in this phase.

---

## 2. Scope

### In scope

| File | Change |
|------|--------|
| `lib/copy/userFacing.ts` | **New** — centralized English copy |
| `components/pwa/InstallPrompt.tsx` | Use `USER_COPY.pwa` |
| `components/camera/CameraOverlay.tsx` | Use `USER_COPY.camera` |
| `lib/camera/capturePhoto.ts` | `getCameraErrorMessage` → `USER_COPY.camera.errors` |
| `app/offline/page.tsx` | Use `USER_COPY.offline` |
| `app/layout.tsx` | `lang="en"`, shared app description |
| `app/manifest.ts` | Shared app description |
| `scripts/verify-offline.mjs` | Update assertions to English strings |

### Out of scope

- Internal docs (`docs/`, PRD, PRODUCT-SPEC)
- API `clientMessage` (already English)
- Legal pages (`privacy`, `terms` — already English)
- `docs/ui/ui.html` mockup (internal design artifact)
- i18n infrastructure or locale toggle

---

## 3. Architecture

```
lib/copy/userFacing.ts
  └── USER_COPY
        ├── app      { description }
        ├── pwa      { title, subtitle, install, dismiss }
        ├── camera   { opening, retry, gallery, errors.* }
        └── offline  { title, body, backHome }

components / app → import USER_COPY
```

**Rationale:** Single audit point; grep `[\u4e00-\u9fff]` on `components/`, `app/`, `lib/camera/`, `lib/copy/` must return zero matches after implementation.

---

## 4. Copy table

### App metadata (`layout.tsx`, `manifest.ts`)

- `lang`: `en` (was `zh-CN`)
- `description`: `Snap receipts, auto-categorize. Simple 1099 bookkeeping.`

### PWA install prompt

| Key | English |
|-----|---------|
| `title` | Add Snap1099 to Home Screen |
| `subtitle` | Open like a native app — snap receipts one-handed on the job site |
| `install` | Install |
| `dismiss` | Not now |

### Camera

| Key | English |
|-----|---------|
| `opening` | Opening camera… |
| `openFailed` | Couldn't open camera. Try again. |
| `captureFailed` | Capture failed. Try again. |
| `retry` | Retry |
| `chooseGallery` | Choose from gallery |
| `errors.notAllowed` | Camera access is required to snap receipts. Allow camera in your browser settings. |
| `errors.notFound` | No camera found |
| `errors.notReadable` | Camera is in use by another app |
| `errors.abort` | Couldn't open camera. Try again. |
| `errors.default` | Couldn't open camera. Try again. |

### Offline page

| Key | English |
|-----|---------|
| `title` | You're offline |
| `body` | You can still snap receipts. They'll upload when you're back online. |
| `backHome` | Back to home |

---

## 5. Verification

```bash
# No CJK in user-facing runtime paths
rg '[\u4e00-\u9fff]' components app lib/camera lib/copy --glob '*.{tsx,ts}'

npm run build
node scripts/verify-offline.mjs   # after npm run build && npm start
```

---

## 6. Risks

| Risk | Mitigation |
|------|------------|
| `verify-offline.mjs` breaks | Update string assertions in same PR |
| Future multi-language | `userFacing.ts` can become `en.ts` later; no UI toggle now |

---

## 7. Non-goals

- Locale detection from `Accept-Language`
- Translating internal documentation
- Changing existing English UI strings (SNAP RECEIPT, Processing…, etc.)
