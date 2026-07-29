# Delete Account Cleanup Hardening

**Date:** 2026-06-14  
**Status:** Implemented  
**Supersedes gaps in:** `2026-06-14-delete-account-full-cleanup-design.md` (G1/G3)

## Problem

After delete account, residual data could remain:

1. **Server:** Receipts uploaded as Ghost (`userId = null`, `ghostId` set) before Google bind were not deleted by `DELETE /api/users/me` (only `userId` match).
2. **Client:** Delete path used UI `isSignedIn` / local `googleUser` cache instead of live session from `GET /api/auth/me`.

## Solution

### Server — `lib/receipts/accountCleanup.ts`

- `userAccountReceiptFilter(userId, boundGhostId)` builds Prisma `where`:
  - No binding → `{ userId }`
  - With binding → `{ OR: [{ userId }, { ghostId: boundGhostId }] }`
- `deleteUserAccount`:
  1. Load `snaptax_ghost_account` for `boundGhostId`
  2. `findMany` + `deleteReceiptBlobs` + `deleteMany` on filter
  3. `snaptaxUser.delete` (cascade entitlements, checkout, ghost binding)
- Blob delete failure: `logEvent` warn, do not block DB delete

### Client — `lib/client/deleteAccountFlow.ts`

- `resolveDeleteUsesUserApi()` calls `fetchAuthMe()`; `user != null` → `DELETE /api/users/me`
- Ghost path unchanged: `ensureGhostSession` then `DELETE /api/ghost/data`
- API failure: no local clear (unchanged)

### UI

- `PrivacyDataSection`: `deleteAccountAndLocalData()` without `isSignedIn` for API routing; `isSignedIn` retained only for warning copy

## Acceptance

| Check | Expected |
|-------|----------|
| DB after signed-in delete | No user, binding, or receipts for userId **or** bound ghostId |
| Local after success | IndexedDB + `snap1099_*` cleared |
| Re-login same Google | Empty account |
| Offline delete | `DeleteAccountOfflineError`, no API/local wipe |
| API error | Local data preserved |

## Tests

- `lib/receipts/accountCleanup.test.ts` — `userAccountReceiptFilter`
- `lib/client/deleteAccountFlow.test.ts` — session-based routing
