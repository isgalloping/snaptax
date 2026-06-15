# Google Login — Production Fix Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-14-onboarding-optional-signup-design.md`](./2026-06-14-onboarding-optional-signup-design.md) §6

**Brainstorming approved:** 2026-06-14 — symptom B (GIS OK, POST fails); production env configured; onboarding must not prompt login.

---

## 1. Problem

Production users see **Sign-in failed** after tapping Google (GIS button renders). Likely causes: ghost cookie missing on `POST /api/auth/google`, client/server Client ID mismatch after deploy, or opaque `GOOGLE_AUTH_FAILED` masking 401/409/500.

Onboarding demo flow must **never** require or nudge Google login.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Onboarding | No soft/hard Google sheets while `stage_*`; demo export without login |
| 401 on `/api/auth/google` | `ensureGhostSession()` once, retry POST |
| Error UX | Map `UNAUTHORIZED`, `GHOST_ALREADY_BOUND`, `INTERNAL_ERROR` to distinct copy |
| Auth vs sync | API success + `applyGoogleSignIn` even if `onSuccess` sync throws; warn only |
| GIS | Single `initialize` per client ID; per-mount callback via dispatcher |
| Preparing UX | Show `Loading Google sign-in…` while mounting GIS |

---

## 3. Flow

```text
GoogleSignInSheet open
  → ensureGhostSession()
  → mount GIS button
User picks account
  → POST /api/auth/google (credentials: include)
  → 401? ensureGhostSession + retry once
  → 200? applyGoogleSignIn + onSuccess (sync errors = warning only)
```

---

## 4. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-GL1 | Onboarding `stage_*`: no Google sheet / nudge |
| AC-GL2 | Settings/Export login succeeds in production |
| AC-GL3 | 401 triggers ghost retry before showing error |
| AC-GL4 | `GHOST_ALREADY_BOUND` shows dedicated message |
| AC-GL5 | Sync failure after login does not show auth failure |

---

## 5. Files

| File | Change |
|------|--------|
| `lib/client/authApi.ts` | Parse error codes; 401 ghost retry |
| `lib/client/googleAuthErrors.ts` | Error class + message mapping |
| `lib/client/googleAuth.ts` | GIS singleton initialize |
| `components/auth/GoogleSignInSheet.tsx` | Preparing UI; split auth/sync errors |
| `lib/i18n/*` | New error strings |

---

## 6. Production checklist

1. Vercel Production: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `GHOST_HMAC_SECRET`
2. Redeploy after env change (rebuild client bundle for Client ID)
3. Google Console Authorized JavaScript origins includes production domain
