# Plumber SEO UI Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `/tax-deductions/plumber` structurally with `docs/seo/plumber/plumber.0.0.1.png` — full-bleed Hero background, mockup section layouts — without regressing electrician/HVAC.

**Architecture:** Add `presentation?: "default" | "mockup"` on `IndustrySeoPage`. Plumber sets `"mockup"`. Rewrite spotlight Hero to use `workerImage` as background + scrim (no right-column worker card). Branch DeductionCards, ProblemSolution, Checklist, BuiltFor, FAQ (and light HowItWorks/FinalCta polish) when `presentation === "mockup"`.

**Tech Stack:** Next.js, React, Tailwind 4, existing marketing SEO components, node:test

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-09-plumber-seo-ui-fidelity-design.md`
- Baseline UI: `docs/seo/plumber/plumber.0.0.1.png`
- Plumber only via `presentation: "mockup"` — never change electrician/HVAC default layouts
- Hero: `workerImage` full-bleed background + ~65% black scrim; **no** worker card; left order pill → H1 → body → trust → CTAs
- Structural fidelity; simplified SVG icons OK
- Keep SEO copy locks, honesty, FAQ×7, CTAs `/app` + `#deductions`
- Branch: `feat/plumber-seo-landing` (update PR #227 / preview after)

## File map

| File | Responsibility |
|------|----------------|
| `lib/marketing/seo/types.ts` | `presentation?`, optional `problemsClosing?` |
| `lib/marketing/seo/industries/plumber.ts` | Set mockup + closing line |
| `lib/marketing/seo/industries.test.ts` | Assert presentation mockup |
| `components/marketing/seo/IndustryHero.tsx` | Background spotlight |
| `components/marketing/seo/DeductionCards.tsx` | Mockup 4-col + icons |
| `components/marketing/seo/ProblemSolution.tsx` | Mockup cards + closer |
| `components/marketing/seo/RecordkeepingChecklist.tsx` | Mockup panel layout |
| `components/marketing/seo/BuiltForBand.tsx` | Mockup 5-up flow |
| `components/marketing/seo/IndustryFaq.tsx` | Mockup 2-col cards |
| `components/marketing/seo/HowItWorks.tsx` | Light mockup polish |
| `components/marketing/seo/IndustryFinalCta.tsx` | Light mockup polish |
| `components/marketing/seo/IndustrySeoPage.tsx` | Pass `page` into checklist/FAQ as needed |
| `components/marketing/seo/mockupIcons.tsx` | Tiny shared SVG icon helpers (optional new file) |

---

### Task 1: Types + plumber presentation flag

**Files:**
- Modify: `lib/marketing/seo/types.ts`
- Modify: `lib/marketing/seo/industries/plumber.ts`
- Modify: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Produces: `presentation?: "default" | "mockup"`; `problemsClosing?: string`; plumber has both set

- [ ] **Step 1: Extend types**

On `IndustrySeoPage` root (alongside `slug`):

```ts
  /** default when omitted. mockup = Plumber UI-fidelity section variants. */
  presentation?: "default" | "mockup";
```

Near problems fields:

```ts
  problemsTitle: string;
  /** Optional green closer under problem cards (mockup). */
  problemsClosing?: string;
  problems: { title: string; body: string; solution: string }[];
```

- [ ] **Step 2: Set plumber data**

In `plumber.ts` top-level:

```ts
  presentation: "mockup",
```

After `problemsTitle` / problems array, add:

```ts
  problemsClosing:
    "SnapTax keeps every plumbing receipt organized and ready for tax time.",
```

- [ ] **Step 3: Test**

Append:

```ts
  it("plumber uses mockup presentation for UI fidelity", () => {
    const page = getIndustryBySlug("plumber");
    assert.ok(page);
    assert.equal(page.presentation, "mockup");
    assert.ok(page.problemsClosing);
    assert.equal(getIndustryBySlug("electrician")?.presentation, undefined);
    assert.equal(getIndustryBySlug("hvac")?.presentation, undefined);
  });
```

Run: `npm run test:unit -- lib/marketing/seo/industries.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/marketing/seo/types.ts \
  lib/marketing/seo/industries/plumber.ts \
  lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): mark Plumber landing as mockup presentation

EOF
)"
```

---

### Task 2: IndustryHero full-bleed background spotlight

**Files:**
- Modify: `components/marketing/seo/IndustryHero.tsx`

**Interfaces:**
- Consumes: `visualLayout === "spotlight"`, `workerImage`, `phoneImage`, `highlights`
- Produces: background hero; no worker card

- [ ] **Step 1: Replace spotlight branch structure**

When `useSpotlight` is true, render approximately:

```tsx
    <section className="relative overflow-hidden border-b border-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={page.hero.workerImage.src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/65" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <IndustryBreadcrumb … />
        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)_minmax(0,0.95fr)] lg:gap-8">
          {/* LEFT: pill, H1 accent, body, trustItems, THEN CTAs */}
          {/* CENTER: phoneImage */}
          {/* RIGHT: highlights with simple green SVG icon per item — NO worker img */}
        </div>
      </div>
    </section>
```

Rules:
- Use empty `alt=""` + `aria-hidden` on decorative background; meaningful scene alt can move to a visually hidden text if needed, or keep `workerImage.alt` on a `sr-only` span.
- **Reorder left column:** trust list **before** CTA row (matches PNG).
- Do **not** render the right-column worker `<img>` card.
- Keep non-spotlight paths (`useComposite` / stacked) in a separate `return` or early branch so their markup stays unchanged.

Highlight icon: inline 20×20 green stroke SVG (generic check/spark) repeated, or cycle 4 simple shapes — no external assets required.

- [ ] **Step 2: Manual / self-check**

Confirm in code review: no `workerImage.src` inside the right column for spotlight; background `img` present once.

- [ ] **Step 3: Commit**

```bash
git add components/marketing/seo/IndustryHero.tsx
git commit -m "$(cat <<'EOF'
fix(seo): use plumber hero photo as full-bleed spotlight background

EOF
)"
```

---

### Task 3: DeductionCards mockup grid + icons

**Files:**
- Modify: `components/marketing/seo/DeductionCards.tsx`
- Optional Create: `components/marketing/seo/mockupIcons.tsx`

- [ ] **Step 1: Branch on mockup**

```tsx
const isMockup = page.presentation === "mockup";
```

Default path: keep current 3-col grid + examples list.

Mockup path:
- Title: `text-center` + stronger tracking optional
- Grid: `mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4`
- Card: icon (from helper keyed by `card.title`) + title + body only — **skip** `card.examples` map
- Icon helper example in `mockupIcons.tsx`:

```tsx
export function MockupLineIcon({ name }: { name: string }) {
  // return a simple 24x24 stroke SVG; ignore name or switch lightly
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  );
}
```

Color icon with `style={{ color: MARKETING_TOKENS.accentGreen }}`.

- [ ] **Step 2: Commit**

```bash
git add components/marketing/seo/DeductionCards.tsx \
  components/marketing/seo/mockupIcons.tsx
git commit -m "$(cat <<'EOF'
feat(seo): mockup deduction card grid for Plumber landing

EOF
)"
```

---

### Task 4: ProblemSolution + Checklist + BuiltFor mockup

**Files:**
- Modify: `components/marketing/seo/ProblemSolution.tsx`
- Modify: `components/marketing/seo/RecordkeepingChecklist.tsx`
- Modify: `components/marketing/seo/BuiltForBand.tsx`
- Modify: `components/marketing/seo/IndustrySeoPage.tsx` (pass `page` into checklist)

- [ ] **Step 1: ProblemSolution**

If `page.presentation === "mockup"`:
- Keep 3-col cards; add small warm/orange circular icon mark above title
- After `<ul>`, if `page.problemsClosing`:

```tsx
<p className="mt-10 text-center text-sm font-bold sm:text-base" style={{ color: MARKETING_TOKENS.accentGreen }}>
  {page.problemsClosing}
</p>
```

Default path unchanged (no closer unless set — only plumber sets it).

- [ ] **Step 2: RecordkeepingChecklist**

Change signature to accept full page or presentation:

```tsx
export function RecordkeepingChecklist({
  page,
}: {
  page: IndustrySeoPage;
}) {
  const checklist = page.checklist;
  if (!checklist) return null;
  const isMockup = page.presentation === "mockup";
  …
}
```

Update `IndustrySeoPage.tsx`:

```tsx
{page.checklist ? <RecordkeepingChecklist page={page} /> : null}
```

Mockup layout:
- Outer bordered panel `rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8`
- Flex/grid: left icon well (clipboard SVG ~80px green) + right `sm:grid-cols-2` items
- Default: keep current simple grid of item chips

- [ ] **Step 3: BuiltForBand mockup**

If mockup:
- Title centered optional
- `ul` as `flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between`
- Between items on `xl`, render a dashed connector (`hidden xl:block` border or `→`)
- Default: keep existing `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` (or current) for non-mockup

- [ ] **Step 4: Commit**

```bash
git add components/marketing/seo/ProblemSolution.tsx \
  components/marketing/seo/RecordkeepingChecklist.tsx \
  components/marketing/seo/BuiltForBand.tsx \
  components/marketing/seo/IndustrySeoPage.tsx
git commit -m "$(cat <<'EOF'
feat(seo): mockup problem, checklist, and built-for layouts for Plumber

EOF
)"
```

---

### Task 5: IndustryFaq two-column mockup + light HowItWorks/FinalCta

**Files:**
- Modify: `components/marketing/seo/IndustryFaq.tsx`
- Modify: `components/marketing/seo/IndustrySeoPage.tsx`
- Modify: `components/marketing/seo/HowItWorks.tsx`
- Modify: `components/marketing/seo/IndustryFinalCta.tsx`

- [ ] **Step 1: FAQ API**

```tsx
export function IndustryFaq({
  items,
  title = "Frequently Asked Questions",
  presentation,
}: {
  items: readonly { question: string; answer: string }[];
  title?: string;
  presentation?: IndustrySeoPage["presentation"];
}) {
```

Call site:

```tsx
<IndustryFaq items={page.faq} presentation={page.presentation} />
```

Mockup:
- Wrapper grid `mt-8 grid gap-4 sm:grid-cols-2` of cards
- Each card: `rounded-xl border border-white/10 bg-white/5 px-4`
- Button + answer `hidden` pattern preserved (SEO)

Default: keep current single-column divide-y list.

- [ ] **Step 2: HowItWorks polish (mockup only)**

If `page.presentation === "mockup"`: ensure `h2` is `text-center`; slightly increase banner top margin (`mt-14`).

- [ ] **Step 3: FinalCta polish (mockup only)**

If mockup and `backgroundImage`: ensure overlay scrim readable (`bg-black/70` already OK); center text block if not already.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/seo/IndustryFaq.tsx \
  components/marketing/seo/IndustrySeoPage.tsx \
  components/marketing/seo/HowItWorks.tsx \
  components/marketing/seo/IndustryFinalCta.tsx
git commit -m "$(cat <<'EOF'
feat(seo): mockup FAQ grid and section polish for Plumber landing

EOF
)"
```

---

### Task 6: Acceptance + push preview

- [ ] **Step 1: Unit tests**

```bash
npm run test:unit -- lib/marketing/seo/industries.test.ts lib/marketing/seo/jsonLd.test.ts
```

Expected: PASS

- [ ] **Step 2: Visual checklist vs PNG**

Open `/tax-deductions/plumber`:
- [ ] Full-bleed hero background, no worker card
- [ ] Left order: pill → H1 → body → trust → CTAs
- [ ] 2×4 deductions; 2-col FAQ; checklist panel; BuiltFor five-up
- [ ] `/electrician` and `/hvac` unchanged

- [ ] **Step 3: Push feature branch + merge to preview**

```bash
git push origin feat/plumber-seo-landing
git checkout preview && git pull origin preview
git merge feat/plumber-seo-landing -m "merge: plumber SEO UI fidelity into preview"
git push origin preview
git checkout feat/plumber-seo-landing
```

- [ ] **Step 4: Commit only if cleanup remains**

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| `presentation: mockup` | Task 1 |
| Hero background + no worker card + trust before CTA | Task 2 |
| Deduction 2×4 + icons, hide examples | Task 3 |
| Problems closer + checklist panel + BuiltFor flow | Task 4 |
| FAQ 2-col + light polish | Task 5 |
| Acceptance + preview | Task 6 |
| Electrician/HVAC unchanged | All tasks (default branches) |

**Placeholder scan:** none intentional.  
**Type consistency:** `presentation === "mockup"` used uniformly.
