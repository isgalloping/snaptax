# Settings v3 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task.

**Goal:** Full v3 Settings interaction — viewState sub-pages, ghost sample export flow, Paywall visual upgrade, export banners, header EN/FR/DE, notification localStorage toggles.

**Spec:** [`2026-06-17-settings-v3-redesign-design.md`](../specs/2026-06-17-settings-v3-redesign-design.md)

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · node:test

---

### Task 1: lib/settings helpers + tests
- `lib/settings/notificationPrefs.ts` + `.test.ts`
- `lib/settings/exportSampleState.ts` + `.test.ts`
- `lib/settings/seasonCoverage.ts` + `.test.ts`

### Task 2: i18n + settingsVisual updates
- New strings for sub-pages, export flow, paywall checklist, banners, referral learn

### Task 3: SettingsHeader + SettingsPreferencesList
### Task 4: Subpages (language, industry, notifications, privacy)
### Task 5: Export flow pages + ExportStatusBanner
### Task 6: Account block, Paywall, Share enhancements
### Task 7: SettingsScreen viewState + HomeScreen wiring
### Task 8: PRODUCT-SPEC + verification
