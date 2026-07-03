# Delete Account — Server Cleanup Session Gate

**Date:** 2026-07-03  
**Status:** Approved  
**Supersedes gaps in:** `2026-06-14-delete-account-full-cleanup-design.md`, `2026-06-14-delete-account-cleanup-hardening-design.md`  
**Related:** `2026-06-07-receipt-sync-ghost-reconcile-design.md` (RC-5)

---

## 1. Problem

Users who appear signed in (Settings UI + **signed-in delete warning copy**) can complete delete while **server account and receipts survive**. On re-login with Google, cloud data returns.

### 1.1 Confirmed symptom

Delete confirm Sheet shows signed-in copy:

> This is irreversible. All cloud receipts, export records, and account data will be permanently deleted.

Local data is cleared; server user row and `userId` receipts remain.

### 1.2 Root causes

| ID | Cause | Effect |
|----|-------|--------|
| **RC-D1** | UI `isSignedIn` uses `localStorage` `googleUser`; delete routing uses live `fetchAuthMe().user` | Session expired → Ghost API path runs while UI shows signed-in warning |
| **RC-D2** | `DELETE /api/ghost/data` allows **bound** ghosts (no `GOOGLE_LOGIN_REQUIRED`) | Partial delete: only `ghostId + userId IS NULL` receipts |
| **RC-D3** | `deleteUserAccount` scopes receipts to `userId OR current boundGhostId` | Orphan receipts on **previous** ghost after rebind survive user delete |

### 1.3 Ghost vs signed-in inconsistency (before fix)

| State | API (actual) | Server scope | UI warning |
|-------|--------------|--------------|------------|
| Pure Ghost | `DELETE /api/ghost/data` | `ghostId`, `userId IS NULL` | Ghost |
| Signed-in, valid session | `DELETE /api/users/me` | User + bound ghost receipts | Signed-in |
| **Stale session** (`googleUser` cached, `user == null`) | **Ghost path (bug)** | Partial | **Signed-in (mismatch)** |

---

## 2. Decisions

**Approach A (approved):** Session gate on client + bound-ghost rejection on server + expanded user receipt scope.

| Topic | Old | New |
|-------|-----|-----|
| Routing when `user == null` + `googleUser` cached | Ghost delete | **Block** — `DeleteAccountSessionExpiredError` |
| `DELETE /api/ghost/data` on bound ghost | Allowed, partial delete | **409 `GOOGLE_LOGIN_REQUIRED`** |
| `deleteUserAccount` receipt filter | `userId OR boundGhostId` | `userId OR (ghostId IN user's receipt ghostIds AND userId IS NULL)` |
| Offline delete | Disabled | Unchanged |
| API failure | No local clear | Unchanged |
| Delete order | API → local | Unchanged |

---

## 3. Invariants

| ID | Invariant |
|----|-----------|
| **I1** | User-initiated delete success → server + local fully removed for that account/ghost |
| **I2** | API failure → local data **retained** |
| **I3** | Offline → delete disabled; no API, no local clear |
| **I4** | Signed-in warning copy ↔ full account delete only |

---

## 4. Client delete routing

### 4.1 `lib/client/deleteAccountFlow.ts`

```typescript
export class DeleteAccountSessionExpiredError extends Error {
  readonly code = "SESSION_EXPIRED" as const;
}

export async function resolveDeleteRoute(
  fetchMe: () => Promise<AuthMeResponse>,
  loadGoogleUser: () => GoogleUser | null,
): Promise<"user" | "ghost"> {
  const me = await fetchMe();
  if (me.user != null) return "user";
  if (loadGoogleUser() != null) {
    throw new DeleteAccountSessionExpiredError();
  }
  return "ghost";
}

export async function deleteAccountAndLocalData(deps = {}): Promise<void> {
  if (!isOnline()) throw new DeleteAccountOfflineError();

  const route = await resolveDeleteRoute(fetchMe, loadGoogleUser);

  if (route === "ghost") await ensureGhostSession();
  await deleteAccountApi(route === "user");
  await clearLocalAppData();
}
```

### 4.2 `PrivacyDataSection` error mapping

| Error | i18n key | UX |
|-------|----------|-----|
| `DeleteAccountOfflineError` | `deleteRequiresOnline` | Existing |
| `DeleteAccountSessionExpiredError` | `deleteSessionExpired` | Sheet stays open |
| Other | `deleteFailed` | Sheet stays open |

### 4.3 i18n — `settings.privacyData.deleteSessionExpired`

| Locale | Copy |
|--------|------|
| en-US | Your Google session expired. Sign in again with Google, then delete your account. |
| fr-FR | Votre session Google a expiré. Reconnectez-vous avec Google, puis supprimez votre compte. |
| de-DE | Ihre Google-Sitzung ist abgelaufen. Melden Sie sich erneut mit Google an und löschen Sie dann Ihr Konto. |

---

## 5. Server

### 5.1 `DELETE /api/ghost/data`

After `getActor(request)`:

```typescript
if (actor.kind !== "ghost") throw new Error("UNAUTHORIZED");
if (actor.bound) throw new Error("GOOGLE_LOGIN_REQUIRED");
await deleteGhostReceipts(actor.ghostId);
```

Aligns with `getActor(request, { requireWrite: true })` write gate.

### 5.2 `deleteUserAccount(userId)` — receipt scope

1. Load current `snaptax_ghost_account.ghostId` (may be null).
2. Collect `distinctGhostIds` from `snaptax_receipts` where `userId = userId` and `ghostId IS NOT NULL`.
3. Build filter:

```typescript
function userAccountReceiptFilter(
  userId: string,
  boundGhostId: string | null,
  historicalGhostIds: string[],
): Prisma.SnaptaxReceiptWhereInput {
  const ghostIds = new Set<string>(historicalGhostIds);
  if (boundGhostId) ghostIds.add(boundGhostId);

  const or: Prisma.SnaptaxReceiptWhereInput[] = [{ userId }];
  for (const gid of ghostIds) {
    or.push({ ghostId: gid, userId: null });
  }
  return { OR: or };
}
```

4. `findMany` → `deleteReceiptBlobs` → `deleteMany` → `snaptaxUser.delete` (cascade entitlements, checkout, ghost binding).

Blob delete failure: log warn, continue DB delete (unchanged).

### 5.3 Signed-in delete — `DELETE /api/users/me`

No route changes. Uses expanded `deleteUserAccount`.

---

## 6. User flow

```text
Settings → Privacy & Data → Delete Account
  → Confirm Sheet (signed-in / Ghost warning)
  → [offline] Delete permanently disabled
  → [online]
       ├─ session valid (fetchAuthMe.user) → DELETE /api/users/me → clearLocal → onAccountDeleted
       ├─ googleUser cached, session null → deleteSessionExpired; no delete
       └─ pure Ghost → ensureGhost → DELETE /api/ghost/data → clearLocal → onAccountDeleted
```

**Recovery for stale session:** Cancel → Continue with Google → Delete Account again.

---

## 7. Error handling

| Scenario | Local | Server | UX |
|----------|-------|--------|-----|
| Offline | Retained | Unchanged | Button disabled |
| Session expired | Retained | Unchanged | `deleteSessionExpired` |
| API 4xx/5xx | Retained | Unchanged | `deleteFailed`, retry |
| Bound ghost hits ghost DELETE | Retained | Unchanged | `deleteSessionExpired` or `deleteFailed` |
| Success | Cleared | Cleared | Close sheet, cold start |

---

## 8. Ghost vs signed-in (after fix)

| State | API | Server scope | Warning copy |
|-------|-----|--------------|--------------|
| Pure Ghost | `/api/ghost/data` | Ghost receipts (`userId IS NULL`) | Ghost |
| Signed-in, valid session | `/api/users/me` | Full account + all related receipts | Signed-in |
| Cached sign-in, no session | **Blocked** | None | Signed-in + `deleteSessionExpired` |

---

## 9. Tests

### 9.1 Client — `lib/client/deleteAccountFlow.test.ts`

| ID | Case |
|----|------|
| T1 | `user=null`, `googleUser` set → `DeleteAccountSessionExpiredError`; no API; no local clear |
| T2 | `user` set → `deleteAccountApi(true)` then local clear |
| T3 | `user=null`, `googleUser=null` → ghost ensure + `deleteAccountApi(false)` |
| T4 | Offline → `DeleteAccountOfflineError` (regression) |
| T5 | API throws → local not cleared (regression) |

### 9.2 Server — `lib/receipts/accountCleanup.test.ts`

| ID | Case |
|----|------|
| T6 | `userAccountReceiptFilter` includes `userId` receipts + bound ghost orphans + historical ghost orphans |
| T7 | No binding → `{ userId }` only (+ historical ghost orphans from user's receipts) |

### 9.3 Integration (manual / future)

| ID | Case |
|----|------|
| T8 | Signed-in delete → re-login same Google → empty account |
| T9 | Bound ghost + no session → ghost DELETE returns 409 |

---

## 10. Files to touch

| Area | Files |
|------|-------|
| Client flow | `lib/client/deleteAccountFlow.ts`, `lib/client/deleteAccountFlow.test.ts` |
| UI | `components/settings/PrivacyDataSection.tsx` |
| i18n | `lib/i18n/types.ts`, `en-US.ts`, `fr-FR.ts`, `de-DE.ts` |
| Server | `app/api/ghost/data/route.ts`, `lib/receipts/accountCleanup.ts`, `lib/receipts/accountCleanup.test.ts` |

---

## 11. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-1 | Signed-in warning + stale session → delete blocked; local retained |
| AC-2 | Signed-in + valid session → `DELETE /api/users/me`; DB has no user/receipts; re-login empty |
| AC-3 | Pure Ghost online → ghost receipts removed server + local |
| AC-4 | Bound ghost cannot use `DELETE /api/ghost/data` |
| AC-5 | User delete removes receipts on historical ghostIds (post-rebind orphans) |
| AC-6 | API failure / offline invariants unchanged |
| AC-7 | Unit tests T1–T7 pass |

---

## 12. Out of scope

- Offline queue for deferred server delete
- Paddle refund / subscription cancellation on delete
- Admin / support-initiated deletion
- Merged single `DELETE /api/account` endpoint
- Log / analytics PII purge beyond existing platform TTL

---

## 13. Compliance alignment

| Doc | Alignment |
|-----|-----------|
| `docs/legal/privacy.md` §6 | Delete Account removes server + local |
| `2026-06-30-compliance-p6-dsr-governance.md` | In-app delete satisfies erasure right |
| `2026-06-30-compliance-p2-data-lifecycle.md` | Delete triggers PG + Blob removal |

---

## 14. Implementation status

| Item | Status |
|------|--------|
| Design | ✅ Approved 2026-07-03 |
| Plan | ✅ `docs/superpowers/plans/2026-07-03-delete-account-server-cleanup.md` |
| Code | ✅ Implemented 2026-07-03 |
