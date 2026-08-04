# Marketing Hero Single Screenshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace marketing hero center dual-phone mockups with one current PWA home screenshot; leave left/right hero columns unchanged.

**Architecture:** Copy user-provided PNG to `public/marketing/hero-app-home.png`, trim `MARKETING_HERO_SCREENS` to a single `home` entry (457×944), simplify `MarketingHero` center column to one `Image`.

**Tech Stack:** Next.js Image, TypeScript, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-04-marketing-hero-single-screenshot-design.md`

## Global Constraints

- Hero left column (headline, checklist, CTAs, trust strip) **unchanged**
- Hero right column (4 value props) **unchanged**
- Hero background image and header **unchanged**
- Single phone only — **no** export second mockup in hero
- Static PNG asset — **no** live `/app` render
- OG `hero-phone.png` **out of scope**
- Keep green glow, `rounded-[1.35rem]`, `border border-white/10`, `shadow-2xl` on the phone image

---

### Task 1: Replace hero screenshot asset

**Files:**
- Create/Replace: `public/marketing/hero-app-home.png`
- Source: `.cursor/projects/.../assets/image-0bcb93d9-a486-441c-88ca-f81703043dd0.png` (457×944)

- [ ] **Step 1: Copy asset**

```bash
cp "/Users/huanggang/.cursor/projects/Users-huanggang-Documents-codeworks-appworks-snaptax/assets/image-0bcb93d9-a486-441c-88ca-f81703043dd0.png" \
   public/marketing/hero-app-home.png
```

- [ ] **Step 2: Verify dimensions**

Run: `sips -g pixelWidth -g pixelHeight public/marketing/hero-app-home.png`

Expected: `pixelWidth: 457`, `pixelHeight: 944`

- [ ] **Step 3: Commit**

```bash
git add public/marketing/hero-app-home.png
git commit -m "assets(marketing): update hero home screenshot to current PWA UI"
```

---

### Task 2: Single-screen hero config + tests

**Files:**
- Modify: `lib/marketing/heroScreens.ts`
- Modify: `lib/marketing/hero.test.ts`

**Interfaces:**
- Produces: `MARKETING_HERO_SCREENS` — readonly array with one `{ id: "home", src, alt, width: 457, height: 944 }`

- [ ] **Step 1: Update failing test**

In `lib/marketing/hero.test.ts`, replace the `MARKETING_HERO_SCREENS` describe block:

```typescript
describe("MARKETING_HERO_SCREENS", () => {
  it("uses a single home app screenshot", async () => {
    const { MARKETING_HERO_SCREENS } = await import("@/lib/marketing/heroScreens");
    assert.deepEqual(
      MARKETING_HERO_SCREENS.map((screen) => screen.id),
      ["home"],
    );
    assert.match(MARKETING_HERO_SCREENS[0]?.src ?? "", /hero-app-home\.png$/);
    assert.equal(MARKETING_HERO_SCREENS[0]?.width, 457);
    assert.equal(MARKETING_HERO_SCREENS[0]?.height, 944);
    assert.match(
      MARKETING_HERO_SCREENS[0]?.alt ?? "",
      /estimated tax saved/i,
    );
  });
  // keep "uses website hero background asset" test unchanged
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/marketing/hero.test.ts`

Expected: FAIL — still has `export` id or wrong dimensions

- [ ] **Step 3: Update heroScreens.ts**

```typescript
export const MARKETING_HERO_SCREENS = [
  {
    id: "home",
    src: "/marketing/hero-app-home.png",
    alt: "SnapTax home screen showing estimated tax saved, widgets, and recent receipts",
    width: 457,
    height: 944,
  },
] as const;
```

Remove the `export` entry entirely.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- lib/marketing/hero.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/marketing/heroScreens.ts lib/marketing/hero.test.ts
git commit -m "feat(marketing): single hero home screen config"
```

---

### Task 3: Simplify MarketingHero center column

**Files:**
- Modify: `components/marketing/MarketingHero.tsx`

**Interfaces:**
- Consumes: `MARKETING_HERO_SCREENS[0]` from `@/lib/marketing/heroScreens`

- [ ] **Step 1: Replace dual-phone block**

Replace lines ~159–181 (the inner `flex` with two `Image`s) with:

```tsx
            <div className="relative mx-auto w-full max-w-[24rem] sm:max-w-[26rem] xl:max-w-[27rem]">
              <Image
                src={MARKETING_HERO_SCREENS[0].src}
                alt={MARKETING_HERO_SCREENS[0].alt}
                width={MARKETING_HERO_SCREENS[0].width}
                height={MARKETING_HERO_SCREENS[0].height}
                priority
                className="h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl"
              />
            </div>
```

Remove the duplicate outer wrapper if nested twice — keep one glow + one image container. Do **not** change left or right columns.

- [ ] **Step 2: Run unit tests**

Run: `npm run test:unit -- lib/marketing/hero.test.ts`

Expected: PASS

- [ ] **Step 3: Visual check (optional)**

Run: `npm run dev` → open `http://localhost:3000/` — single centered phone; left/right unchanged.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/MarketingHero.tsx
git commit -m "feat(marketing): show single home screenshot in hero"
```

---

### Task 4: Manual QA checklist

- [ ] Desktop `/` — one phone mockup centered in hero
- [ ] Mobile `/` — hero stacks; screenshot still visible; CTAs unchanged
- [ ] No export phone visible anywhere in hero
- [ ] Left headline still "Keep more of what you earn."
- [ ] Right four value props still present

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Replace hero-app-home.png | Task 1 |
| Single home in heroScreens | Task 2 |
| MarketingHero single Image | Task 3 |
| hero.test.ts updated | Task 2 |
| Left/right/background unchanged | Task 3 (scope constraint) |
| Manual QA | Task 4 |
