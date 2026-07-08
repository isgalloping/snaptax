# TaxHeader Hero Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `/photo/hero.png` as the background inside the v2 rounded TaxHeader card; remove shield icon.

**Architecture:** Reuse existing `homeVisual` hero tokens and the pre-v2 three-layer CSS background pattern; wrap in `heroCard.shell` with `overflow-hidden`. Delete unused `TaxShieldIcon`.

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · `homeVisual.ts` tokens

**Spec:** `docs/superpowers/specs/2026-06-18-tax-header-hero-card-design.md`

---

### Task 1: homeVisual tokens

**Files:**
- Modify: `lib/ui/homeVisual.ts`

- [ ] **Step 1:** Update `heroCard.shell` — add `relative overflow-hidden`, remove `bg-zinc-900`
- [ ] **Step 2:** Add `heroCard.image` class string; remove `heroCard.shield`
- [ ] **Step 3:** Remove `@deprecated` from `heroImage`, `heroOverlay`, `heroTint`

---

### Task 2: TaxHeader hero layers

**Files:**
- Modify: `components/home/TaxHeader.tsx`
- Delete: `components/icons/TaxShieldIcon.tsx`

- [ ] **Step 1:** Add three absolute background divs (photo, overlay, tint)
- [ ] **Step 2:** Wrap content row in `relative z-10`; remove `TaxShieldIcon`
- [ ] **Step 3:** Delete `TaxShieldIcon.tsx`

---

### Task 3: Docs + verify

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1:** Update §3 TaxHeader line — photo hero card, no shield
- [ ] **Step 2:** `npm run test:unit` — all pass
- [ ] **Step 3:** Commit

```bash
git commit -m "feat(home): TaxHeader photo hero card, remove shield icon"
```
