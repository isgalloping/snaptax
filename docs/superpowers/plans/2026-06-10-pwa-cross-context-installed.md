# PWA Cross-Context Installed Detection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide install UI in browser tabs when the PWA is already installed on the same profile, using layered detection and documented cross-browser limits.

**Architecture:** Extend `isPwaInstalledOnDevice()` with standalone mark, Chromium `getInstalledRelatedApps` (manifest self-reference), and Safari-safe sticky `localStorage`. Clear sticky only on Chromium when related apps returns empty.

**Tech Stack:** Next.js 16 manifest route, Serwist PWA, Node test runner + tsx

**Spec:** `docs/superpowers/specs/2026-06-10-pwa-cross-context-installed-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `app/manifest.ts` | Add `related_applications` for Chromium self-detection |
| `lib/pwa/installedDetect.ts` | Layered install detection + optional pure helper |
| `lib/pwa/installedDetect.test.ts` | Unit tests for detection branches |
| `docs/superpowers/specs/2026-06-10-pwa-cross-browser-install-design.md` | Cross-reference updated detection |

---

### Task 1: Manifest self-reference

**Files:**
- Modify: `app/manifest.ts`

- [ ] **Step 1: Add related_applications**

After `id: "/"`, add:

```typescript
related_applications: [
  {
    platform: "webapp",
    url: "/manifest.webmanifest",
    id: "/",
  },
],
```

- [ ] **Step 2: Verify manifest builds**

Run: `npm run build`  
Expected: `manifest.webmanifest` route succeeds; no TypeScript errors on `MetadataRoute.Manifest`.

---

### Task 2: Pure detection helper (testable)

**Files:**
- Modify: `lib/pwa/installedDetect.ts`
- Test: `lib/pwa/installedDetect.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `lib/pwa/installedDetect.test.ts`:

```typescript
import {
  evaluateInstalledSignals,
  resolveInstallUiModeWithInstalled,
} from "./installedDetect";

describe("evaluateInstalledSignals", () => {
  it("returns installed when standalone", () => {
    const r = evaluateInstalledSignals({
      standalone: true,
      hasRelatedAppsApi: true,
      relatedAppCount: 0,
      stickyLocal: false,
    });
    assert.equal(r.installed, true);
    assert.equal(r.shouldMarkLocal, true);
    assert.equal(r.shouldClearLocal, false);
  });

  it("returns installed when Chromium related apps hit", () => {
    const r = evaluateInstalledSignals({
      standalone: false,
      hasRelatedAppsApi: true,
      relatedAppCount: 1,
      stickyLocal: false,
    });
    assert.equal(r.installed, true);
    assert.equal(r.shouldMarkLocal, true);
    assert.equal(r.shouldClearLocal, false);
  });

  it("clears sticky when Chromium related apps empty", () => {
    const r = evaluateInstalledSignals({
      standalone: false,
      hasRelatedAppsApi: true,
      relatedAppCount: 0,
      stickyLocal: true,
    });
    assert.equal(r.installed, false);
    assert.equal(r.shouldMarkLocal, false);
    assert.equal(r.shouldClearLocal, true);
  });

  it("trusts sticky local when no related apps API", () => {
    const r = evaluateInstalledSignals({
      standalone: false,
      hasRelatedAppsApi: false,
      relatedAppCount: 0,
      stickyLocal: true,
    });
    assert.equal(r.installed, true);
    assert.equal(r.shouldClearLocal, false);
  });

  it("not installed when no API and no sticky", () => {
    const r = evaluateInstalledSignals({
      standalone: false,
      hasRelatedAppsApi: false,
      relatedAppCount: 0,
      stickyLocal: false,
    });
    assert.equal(r.installed, false);
  });
});
```

- [ ] **Step 2: Run tests to verify fail**

Run: `node --import tsx --test lib/pwa/installedDetect.test.ts`  
Expected: FAIL — `evaluateInstalledSignals` not exported

- [ ] **Step 3: Implement helper**

Add to `lib/pwa/installedDetect.ts`:

```typescript
export type InstalledSignalInput = {
  standalone: boolean;
  hasRelatedAppsApi: boolean;
  relatedAppCount: number;
  stickyLocal: boolean;
};

export type InstalledSignalResult = {
  installed: boolean;
  shouldMarkLocal: boolean;
  shouldClearLocal: boolean;
};

export function evaluateInstalledSignals(
  input: InstalledSignalInput,
): InstalledSignalResult {
  if (input.standalone) {
    return {
      installed: true,
      shouldMarkLocal: true,
      shouldClearLocal: false,
    };
  }

  if (input.hasRelatedAppsApi) {
    if (input.relatedAppCount > 0) {
      return {
        installed: true,
        shouldMarkLocal: true,
        shouldClearLocal: false,
      };
    }
    return {
      installed: false,
      shouldMarkLocal: false,
      shouldClearLocal: input.stickyLocal,
    };
  }

  if (input.stickyLocal) {
    return {
      installed: true,
      shouldMarkLocal: false,
      shouldClearLocal: false,
    };
  }

  return {
    installed: false,
    shouldMarkLocal: false,
    shouldClearLocal: false,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `node --import tsx --test lib/pwa/installedDetect.test.ts`  
Expected: all pass

---

### Task 3: Wire async detector

**Files:**
- Modify: `lib/pwa/installedDetect.ts`

- [ ] **Step 1: Refactor isPwaInstalledOnDevice**

Replace body with:

```typescript
export async function isPwaInstalledOnDevice(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const standalone = isStandaloneDisplayMode();
  const stickyLocal = readPwaInstalledLocally();
  const hasRelatedAppsApi =
    typeof navigator !== "undefined" &&
    typeof (
      navigator as Navigator & {
        getInstalledRelatedApps?: () => Promise<RelatedWebApp[]>;
      }
    ).getInstalledRelatedApps === "function";

  const related = hasRelatedAppsApi ? await queryInstalledRelatedApps() : [];

  const result = evaluateInstalledSignals({
    standalone,
    hasRelatedAppsApi,
    relatedAppCount: related.length,
    stickyLocal,
  });

  if (result.shouldMarkLocal) markPwaInstalledLocally();
  if (result.shouldClearLocal) clearPwaInstalledLocally();

  return result.installed;
}
```

Remove the old block that cleared sticky whenever related apps was empty regardless of API support.

- [ ] **Step 2: Run all PWA tests**

Run: `node --import tsx --test lib/pwa/*.test.ts`  
Expected: all pass

---

### Task 4: Docs cross-reference

**Files:**
- Modify: `docs/superpowers/specs/2026-06-10-pwa-cross-browser-install-design.md`

- [ ] **Step 1: Update Installed detection section**

Replace the short standalone-only snippet with:

```markdown
## Installed detection

See **`2026-06-10-pwa-cross-context-installed-design.md`** for full rules.

Summary:

- Standalone / iOS A2HS → installed
- Chromium tab → `getInstalledRelatedApps()` + manifest `related_applications`
- Safari → sticky `localStorage` after standalone launch or Chromium `appinstalled`
- Cross-engine (Chrome ↔ Safari ↔ Edge) → not detectable; install UI may remain
```

---

### Task 5: Verify

- [ ] **Step 1: Full build**

Run: `npm run build`  
Expected: exit 0

- [ ] **Step 2: Manual checklist (production HTTPS)**

1. Chrome Android: install → browser tab → no install UI  
2. Uninstall → install UI returns  
3. iOS Safari: A2HS + one home-screen launch → Safari tab → no install UI  

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| manifest `related_applications` | Task 1 |
| Layered detection logic | Tasks 2–3 |
| Safari never clears sticky | Task 2 tests + Task 3 |
| Chromium uninstall clears sticky | Task 2 tests |
| Document cross-browser limits | Task 4 + spec file |
| Unit + build verification | Tasks 2, 3, 5 |

No placeholders. Types consistent across tasks.
