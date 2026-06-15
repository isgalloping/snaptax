# Hero 5s Dwell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend first-visit Hero auto-advance from 3s to 5s while keeping early tap at 1.5s and button countdown 5→4→3→2→1.

**Architecture:** Single constant change in `heroLandingTiming.ts` drives auto-advance and countdown; `HeroWelcomeLanding` derives initial countdown from that constant instead of hardcoded `3`; tests assert 5s boundaries.

**Tech Stack:** Next.js 16 · React 19 · node:test · TypeScript

**Spec:** [`docs/superpowers/specs/2026-06-14-onboarding-hero-5s-dwell-design.md`](../specs/2026-06-14-onboarding-hero-5s-dwell-design.md)

---

### Task 1: Update tests for 5s countdown

**Files:**
- Modify: `lib/landing/heroLandingSession.test.ts`

- [ ] **Step 1: Add 5s boundary assertions**

```ts
it("counts down seconds for 5s auto-advance", () => {
  assert.equal(heroCountdownSeconds(5000, 0), 5);
  assert.equal(heroCountdownSeconds(5000, 500), 5);
  assert.equal(heroCountdownSeconds(5000, 1000), 4);
  assert.equal(heroCountdownSeconds(5000, 4000), 1);
  assert.equal(heroCountdownSeconds(5000, 5000), 1);
});
```

Keep existing 3s cases (they validate the helper is duration-agnostic).

- [ ] **Step 2: Run tests**

Run: `npm run test:unit -- lib/landing/heroLandingSession.test.ts`
Expected: PASS (helper already supports arbitrary duration)

- [ ] **Step 3: Commit**

```bash
git add lib/landing/heroLandingSession.test.ts
git commit -m "test: add 5s hero countdown boundary cases"
```

---

### Task 2: Change auto-advance constant to 5s

**Files:**
- Modify: `lib/landing/heroLandingTiming.ts`

- [ ] **Step 1: Update constant**

```ts
export const HERO_AUTO_ADVANCE_MS = 5000;
```

`HERO_CTA_READY_MS` stays `1500`.

- [ ] **Step 2: Commit**

```bash
git add lib/landing/heroLandingTiming.ts
git commit -m "feat: extend hero auto-advance dwell to 5s"
```

---

### Task 3: Derive initial countdown from constant

**Files:**
- Modify: `components/landing/HeroWelcomeLanding.tsx`

- [ ] **Step 1: Replace hardcoded initial state**

```ts
const HERO_COUNTDOWN_START = Math.ceil(HERO_AUTO_ADVANCE_MS / 1000);

// in component:
const [countdownSeconds, setCountdownSeconds] = useState(HERO_COUNTDOWN_START);
```

- [ ] **Step 2: Run full unit suite**

Run: `npm run test:unit`
Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add components/landing/HeroWelcomeLanding.tsx
git commit -m "fix: derive hero countdown start from auto-advance constant"
```

---

### Task 4: Verification

- [ ] **Step 1: Run unit tests**

Run: `npm run test:unit`
Expected: 0 failures

- [ ] **Manual smoke (optional)**

1. Clear site data → cold start
2. Observe `Let's Go! (5)` → `(4)` → … → `(1)`
3. At ~1.5s button enables with `Let's Go! ⚡`
4. Without tap, auto-enter at ~5s
