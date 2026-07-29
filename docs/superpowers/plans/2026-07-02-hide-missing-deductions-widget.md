# Hide Missing Deductions Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suppress the Find More Savings (`missing`) widget from the home WidgetPager via a module constant while keeping overlay/compute code intact.

**Architecture:** Single visibility gate in `buildWidgetPageKeys` — `effectiveHasMissing = SHOW_MISSING_DEDUCTIONS_WIDGET && data.missing.missing.length > 0`. All pager ordering branches use `effectiveHasMissing` instead of raw missing data.

**Tech Stack:** TypeScript, Node test runner, existing `buildWidgetPages` pure functions.

**Spec:** `docs/superpowers/topics/founder-program-widget-design.md` §3.7

---

### Task 1: Gate missing widget in buildWidgetPageKeys

**Files:**
- Modify: `lib/home/buildWidgetPages.ts`
- Test: `lib/home/buildWidgetPages.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `lib/home/buildWidgetPages.test.ts`:

```typescript
it("omits missing when SHOW_MISSING_DEDUCTIONS_WIDGET is false", () => {
  assert.deepEqual(
    buildWidgetPageKeys(mockData({ missing: missingResult() })),
    ["deadline", "progress"],
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/home/buildWidgetPages.test.ts`
Expected: FAIL — actual includes `"missing"` at index 0

- [ ] **Step 3: Write minimal implementation**

In `lib/home/buildWidgetPages.ts`:

```typescript
/** Product gate: set true to restore Find More Savings widget. */
export const SHOW_MISSING_DEDUCTIONS_WIDGET = false;

// inside buildWidgetPageKeys:
const effectiveHasMissing =
  SHOW_MISSING_DEDUCTIONS_WIDGET && data.missing.missing.length > 0;
// replace all `hasMissing` with `effectiveHasMissing`
```

- [ ] **Step 4: Update remaining tests**

Replace tests that expect `"missing"` in keys when constant is false:
- `"prepends missing when hints exist"` → rename to `"omits missing when widget hidden"` (assert no missing)
- `"places needAction second after missing"` → order becomes `["deadline", "needAction", "progress"]`
- `"places missing needAction cpa on tax season with action"` → `["deadline", "needAction", "cpa", "progress"]`
- `"keeps cpa fourth with missing and no action"` → `["deadline", "progress", "cpa"]`
- `"splits five widgets across two pages"` → adjust pages without missing
- `"keeps three widgets on one page when missing only"` → two widgets: deadline + progress

- [ ] **Step 5: Run tests**

Run: `npm run test:unit -- lib/home/buildWidgetPages.test.ts`
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add lib/home/buildWidgetPages.ts lib/home/buildWidgetPages.test.ts
git commit -m "feat(home): hide Missing Deductions widget from pager"
```
