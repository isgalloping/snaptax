# Delete Account Server Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure user-initiated Delete Account removes server data for signed-in users (fix stale-session ghost path) and harden ghost/user delete consistency.

**Architecture:** Client `resolveDeleteRoute` gates on live session vs cached `googleUser`; server rejects bound-ghost DELETE and expands `userAccountReceiptFilter` to include historical ghost orphans.

**Tech Stack:** Next.js 16 Route Handlers, Prisma, node:test + tsx, React client components, i18n locales.

**Spec:** `docs/superpowers/specs/2026-07-03-delete-account-server-cleanup-design.md`

---

### Task 1: Client session gate

**Files:**
- Modify: `lib/client/deleteAccountFlow.ts`
- Modify: `lib/client/deleteAccountFlow.test.ts`
- Modify: `components/settings/PrivacyDataSection.tsx`

- [ ] Add `DeleteAccountSessionExpiredError`, `resolveDeleteRoute`, `isDeleteAccountSessionExpiredError`
- [ ] Update `deleteAccountAndLocalData` to use route gate + `loadGoogleUser` dep
- [ ] Tests: stale session throws; pure ghost unchanged; user path unchanged
- [ ] UI: map session expired to `deleteSessionExpired` i18n key

### Task 2: i18n

**Files:**
- Modify: `lib/i18n/types.ts`, `en-US.ts`, `fr-FR.ts`, `de-DE.ts`

- [ ] Add `deleteSessionExpired` under `settings.privacyData`

### Task 3: Server bound-ghost guard

**Files:**
- Modify: `app/api/ghost/data/route.ts`

- [ ] After `getActor`, if `actor.bound` throw `GOOGLE_LOGIN_REQUIRED`

### Task 4: Expanded user receipt deletion

**Files:**
- Modify: `lib/receipts/accountCleanup.ts`
- Modify: `lib/receipts/accountCleanup.test.ts`

- [ ] Extend `userAccountReceiptFilter(userId, boundGhostId, historicalGhostIds)`
- [ ] `deleteUserAccount` queries distinct ghostIds from user's receipts
- [ ] Tests for historical ghost orphans

### Task 5: Verify

- [ ] Run `npm run test:unit`
- [ ] Commit and push
