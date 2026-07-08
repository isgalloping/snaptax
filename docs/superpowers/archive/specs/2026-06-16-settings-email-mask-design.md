# Settings Account Email Mask — Design

**Date:** 2026-06-16  
**Status:** Approved  
**Scope:** Account status line shows masked email only.

## Display

- Before: `Signed in · full@email.com · Cloud backup on`
- After: `abc***@gmail.com` (first 3 local chars + `***` + `@domain`)

## Rules

| local part | Output |
|------------|--------|
| ≥ 3 chars | first 3 + `***` + `@domain` |
| 1–2 chars | all local + `***` + `@domain` |
| invalid | `***` |

## Scope

- `AccountStatusBlock` only
- SyncInstructionsSheet / Paywall keep full email

## Files

- `lib/client/maskEmail.ts`
- `lib/client/maskEmail.test.ts`
- `components/auth/AccountStatusBlock.tsx`
