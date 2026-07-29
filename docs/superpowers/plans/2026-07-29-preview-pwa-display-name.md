# Preview PWA Display Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show **SnapTax-Pre** as the PWA install / tab / Apple title on Preview (`snaptax-pre.lightxforge.com`); keep **SnapTax** on production and local dev.

**Architecture:** Add `getAppDisplayName()` in `lib/site/` — derives name from `getPublicSiteUrl()` hostname (`snaptax-pre` → `SnapTax-Pre`, else `SnapTax`). Wire into `manifest.ts` and two layout metadata exports. No new env vars.

**Tech Stack:** Next.js 16 App Router, TypeScript, Node built-in test runner (`npm run test:unit`).

**Spec:** `docs/superpowers/specs/2026-07-29-preview-pwa-display-name-design.md`

## Global Constraints

- Production PWA name must remain exactly **`SnapTax`**
- Preview PWA name must be exactly **`SnapTax-Pre`**
- Detection via **`NEXT_PUBLIC_APP_URL`** hostname (includes `snaptax-pre`), not `VERCEL_ENV`
- **No new environment variables**
- **Out of scope:** marketing copy, i18n, export filenames, Settings UI, storage prefixes
- Invalid/missing URL → fallback **`SnapTax`**
- PWA doc §2 already updated in design commit; no further doc task unless implementation diverges

---

### Task 1: `getAppDisplayName()` helper + unit tests

**Files:**
- Create: `lib/site/appDisplayName.ts`
- Create: `lib/site/appDisplayName.test.ts`

**Interfaces:**
- Consumes: `getPublicSiteUrl(): string` from `@/lib/site/publicSiteUrl`
- Produces: `getAppDisplayName(): string`

- [ ] **Step 1: Write the failing test**

Create `lib/site/appDisplayName.test.ts`:

```typescript
import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import { getAppDisplayName } from "@/lib/site/appDisplayName";

function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => void,
): void {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    saved[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("getAppDisplayName", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
  });

  it("returns SnapTax-Pre for snaptax-pre preview domain", () => {
    withEnv(
      {
        NEXT_PUBLIC_APP_URL: "https://snaptax-pre.lightxforge.com",
        VERCEL_URL: undefined,
      },
      () => {
        assert.equal(getAppDisplayName(), "SnapTax-Pre");
      },
    );
  });

  it("returns SnapTax for production domain", () => {
    withEnv(
      {
        NEXT_PUBLIC_APP_URL: "https://snaptax.lightxforge.com",
        VERCEL_URL: undefined,
      },
      () => {
        assert.equal(getAppDisplayName(), "SnapTax");
      },
    );
  });

  it("returns SnapTax when env unset (local default URL)", () => {
    withEnv(
      { NEXT_PUBLIC_APP_URL: undefined, VERCEL_URL: undefined },
      () => {
        assert.equal(getAppDisplayName(), "SnapTax");
      },
    );
  });

  it("returns SnapTax for invalid URL (safe fallback)", () => {
    withEnv(
      { NEXT_PUBLIC_APP_URL: "not-a-url", VERCEL_URL: undefined },
      () => {
        assert.equal(getAppDisplayName(), "SnapTax");
      },
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/site/appDisplayName.test.ts`

Expected: FAIL — cannot find module `@/lib/site/appDisplayName`

- [ ] **Step 3: Write minimal implementation**

Create `lib/site/appDisplayName.ts`:

```typescript
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

const PROD_DISPLAY_NAME = "SnapTax";
const PREVIEW_DISPLAY_NAME = "SnapTax-Pre";

/** PWA install / tab / Apple web app title only — not in-app marketing copy. */
export function getAppDisplayName(): string {
  try {
    const hostname = new URL(getPublicSiteUrl()).hostname;
    if (hostname.includes("snaptax-pre")) {
      return PREVIEW_DISPLAY_NAME;
    }
  } catch {
    // invalid URL — fall through to production name
  }
  return PROD_DISPLAY_NAME;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- lib/site/appDisplayName.test.ts`

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/site/appDisplayName.ts lib/site/appDisplayName.test.ts
git commit -m "feat(pwa): add getAppDisplayName for preview install label"
```

---

### Task 2: Wire manifest + layouts; update manifest tests

**Files:**
- Modify: `app/manifest.ts`
- Modify: `app/layout.tsx`
- Modify: `app/(pwa)/app/layout.tsx`
- Modify: `app/manifest.test.ts`

**Interfaces:**
- Consumes: `getAppDisplayName(): string` from `@/lib/site/appDisplayName`

- [ ] **Step 1: Update manifest.test.ts (add preview case first)**

Replace the single display-name test in `app/manifest.test.ts` with:

```typescript
  it("uses SnapTax display name by default", () => {
    const prevUrl = process.env.NEXT_PUBLIC_APP_URL;
    const prevVercel = process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    try {
      const data = manifest();
      assert.equal(data.name, "SnapTax");
      assert.equal(data.short_name, "SnapTax");
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = prevUrl;
      if (prevVercel === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = prevVercel;
    }
  });

  it("uses SnapTax-Pre display name on preview domain", () => {
    const prevUrl = process.env.NEXT_PUBLIC_APP_URL;
    const prevVercel = process.env.VERCEL_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://snaptax-pre.lightxforge.com";
    delete process.env.VERCEL_URL;
    try {
      const data = manifest();
      assert.equal(data.name, "SnapTax-Pre");
      assert.equal(data.short_name, "SnapTax-Pre");
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = prevUrl;
      if (prevVercel === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = prevVercel;
    }
  });
```

Run: `npm run test:unit -- app/manifest.test.ts`

Expected: preview test FAIL (still returns SnapTax) until Step 3

- [ ] **Step 2: Wire `app/manifest.ts`**

```typescript
import { getAppDisplayName } from "@/lib/site/appDisplayName";

export default function manifest(): AppManifest {
  const displayName = getAppDisplayName();
  return {
    // ...existing fields...
    name: displayName,
    short_name: displayName,
    // ...
  };
}
```

Remove hardcoded `"SnapTax"` for `name` and `short_name`.

- [ ] **Step 3: Wire `app/layout.tsx`**

Replace:

```typescript
const APP_NAME = "SnapTax";
```

With:

```typescript
import { getAppDisplayName } from "@/lib/site/appDisplayName";

const APP_NAME = getAppDisplayName();
```

Keep `APP_NAME` usage in `metadata` unchanged.

- [ ] **Step 4: Wire `app/(pwa)/app/layout.tsx`**

Replace:

```typescript
export const metadata: Metadata = {
  title: "SnapTax",
```

With:

```typescript
import { getAppDisplayName } from "@/lib/site/appDisplayName";

export const metadata: Metadata = {
  title: getAppDisplayName(),
```

- [ ] **Step 5: Run full unit suite**

Run: `npm run test:unit`

Expected: all tests PASS (including `app/manifest.test.ts` and `lib/site/appDisplayName.test.ts`)

- [ ] **Step 6: Commit**

```bash
git add app/manifest.ts app/layout.tsx app/\(pwa\)/app/layout.tsx app/manifest.test.ts
git commit -m "feat(pwa): SnapTax-Pre install name on preview domain"
```

---

### Task 3: Manual verification checklist (no code)

- [ ] Confirm Vercel **Preview** env has `NEXT_PUBLIC_APP_URL=https://snaptax-pre.lightxforge.com`
- [ ] Deploy Preview → visit `/app` → browser tab shows **SnapTax-Pre**
- [ ] Install PWA on device → home screen label **SnapTax-Pre**
- [ ] Production `/app` tab and install remain **SnapTax**
- [ ] Reinstall required for already-installed PWAs (OS does not rename in place)

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| `getAppDisplayName()` module | Task 1 |
| manifest name/short_name | Task 2 |
| root metadata + appleWebApp | Task 2 (`app/layout.tsx`) |
| pwa layout title | Task 2 |
| Unit tests | Tasks 1–2 |
| No new env vars | Global Constraints |
| Docs §2 | Already in design commit |
| Manual QA | Task 3 |
