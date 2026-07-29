# Delete Account — Full Cleanup (Online Required)

**Date:** 2026-06-14  
**Status:** Approved — Implemented 2026-06-14  
**Amends:** [`2026-06-05-compliance-privacy-design.md`](./2026-06-05-compliance-privacy-design.md) §4.3 (Ghost 离线仅清本地 → **必须联网**)

---

## 1. Problem

1. **离线静默只清本地：** `PrivacyDataSection` 在 `!navigator.onLine` 时跳过 API，仍执行 `clearLocalAppData()`，导致云端 Ghost / 用户数据残留，与 Privacy §6「Delete Account 移除 server + local」及 GDPR/CPRA 删除权不一致。
2. **删除后 session 不完整：** API 204 会清 httpOnly cookies，但 HomeScreen 未统一重置 `googleUser` / `seasonPaid` / 新 Ghost 注册；用户可能仍看到已登录 UI 或 stale 状态。
3. **顺序风险：** 若先清本地、API 失败，用户丢失本地副本但云端仍在 — 当前实现在线时顺序正确（API → local），离线路径破坏该 invariant。

**Brainstorming approved:** 2026-06-14 — Option **A**（必须联网才能删除；离线禁用或提示，保证服务端同步删除）。

---

## 2. Decisions

| Topic | Old behavior | New (this spec) |
|-------|--------------|-----------------|
| 离线删除 | 跳过 API，仅清本地 | **禁止**；确认 Sheet 内按钮 disabled + 文案 |
| 删除顺序 | 在线：API → local；离线：仅 local | **始终** API 成功 → `clearLocalAppData()` |
| Ghost 删除 | `DELETE /api/ghost/data`（在线）或跳过（离线） | 同 API；**必须在线** |
| 已登录删除 | `DELETE /api/users/me` | 不变；级联 User + receipts + entitlements + checkout_intents |
| 删除后 | `onLocalDataCleared` 部分 reset | **`onAccountDeleted`**：内存 + auth + onboarding + 新 Ghost |
| 新模块 | 逻辑在 `PrivacyDataSection` | 抽取 **`lib/client/deleteAccountFlow.ts`** |

**Approach:** **R1** — 加固现有 Settings 流程 + 小模块抽取（不新增合并 API、不新 Hook 层）。

---

## 3. User flow

```text
Settings → Privacy & Data → Delete Account
  → Bottom Sheet 确认（已登录 / Ghost 不同 warning）
  → [离线] 「Delete permanently」disabled + deleteRequiresOnline 文案
  → [在线] 执行 deleteAccountFlow → 成功 → 关闭 Sheet → HomeScreen 冷启动
```

**唯一删除入口：** Settings → Delete Account（与 compliance U2 / Privacy §6 一致）。无「仅清本地」旁路。

---

## 4. Client delete pipeline

### 4.1 `deleteAccountFlow.ts`

```typescript
export class DeleteAccountOfflineError extends Error {
  readonly code = "OFFLINE" as const;
}

export async function deleteAccountAndLocalData(
  isSignedIn: boolean,
): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new DeleteAccountOfflineError();
  }

  if (!isSignedIn) {
    await ensureGhostSession();
  }

  await deleteAccountApi(isSignedIn); // 204; signed-in also saveGoogleUser(null)
  await clearLocalAppData();
}
```

### 4.2 `PrivacyDataSection` changes

| Change | Detail |
|--------|--------|
| `handleDelete` | 调用 `deleteAccountAndLocalData(isSignedIn)`；catch offline → `deleteRequiresOnline`；其他 → `deleteFailed` |
| 离线 UI | `const offline = !navigator.onLine`；Delete 按钮 `disabled={deleting \|\| offline}` |
| 离线提示 | Sheet 内 `offline && <p role="alert">…deleteRequiresOnline</p>` |
| 成功回调 | `onAccountDeleted?.()`（HomeScreen 接线）；短期保留 `onLocalDataCleared` 别名转发 |

**Invariant:** API 抛错时 **不得** 调用 `clearLocalAppData()`。

### 4.3 Post-delete reset (`onAccountDeleted` in HomeScreen)

执行顺序（在 `deleteAccountFlow` 返回后）：

| Step | Action |
|------|--------|
| 1 | 清 UI 状态：`receipts` → `[]`，`taxSaved` → `null`，`syncStuckIds` → empty，`queueRef.clear()`，`watcherRef.reset()` |
| 2 | Auth 内存：`setGoogleUser(null)` via `auth.resetAfterAccountDelete()`（或等价）；`seasonPaid` → `false`；**不**调 `signOutApi`（DELETE 已清 session cookies） |
| 3 | `setIndustry(null)` |
| 4 | `await resetOnboarding()` |
| 5 | `await ensureGhostSession()` — 新 Ghost cookie |
| 6 | `await refreshListFromLocal()` |
| 7 | `setView("home")` |

`useAuthSession` 新增：

```typescript
resetAfterAccountDelete: () => {
  saveGoogleUser(null);
  setGoogleUser(null);
  setIndustry(null);
  setSeasonPaidState(false);
  // localStorage season keys cleared by clearLocalAppData
};
```

---

## 5. Server (audit — minimal changes)

### 5.1 Signed-in — `DELETE /api/users/me`

Existing (`app/api/users/me/route.ts`):

- `deleteUserAccount(session.userId)` — Blob paths + `snaptaxUser.delete` (Prisma cascade)
- Clear `SESSION_COOKIE_NAME` + `GHOST_COOKIE_NAME` cookies

**Data removed:** all receipts (`userId`), entitlements, checkout_intents, ghost_binding (cascade on User).

### 5.2 Ghost — `DELETE /api/ghost/data`

Existing (`app/api/ghost/data/route.ts`):

- `deleteGhostReceipts(ghostId)` — receipts where `ghostId` AND `userId IS NULL`
- Clear `GHOST_COOKIE_NAME`

**Note:** Signed-in users always use `/api/users/me` path on client (`isSignedIn === true`).

### 5.3 P2 (optional, not blocking)

- Explicit log line on delete success (`api.user` event=account_deleted)
- Unit test for `deleteUserAccount` cascade (if not covered)

---

## 6. Error handling

| Scenario | UX |
|----------|-----|
| Offline | Delete disabled; inline `deleteRequiresOnline`; no API, no local clear |
| API 4xx/5xx | Sheet stays open; `deleteFailed`; local **unchanged** |
| Network throw | Same as API failure |
| API OK, local clear throws | Rare; log error; still run `onAccountDeleted` UI reset where possible |

---

## 7. i18n

Add to `settings.privacyData` (en-US, de-DE, fr-FR):

| Key | en-US (draft) |
|-----|---------------|
| `deleteRequiresOnline` | Connect to the internet to delete your account and cloud data. |

Optional copy tweak:

| Key | Change |
|-----|--------|
| `deleteSignedInWarning` | Append mention of export/payment records if not already implied |

Update `lib/i18n/types.ts` accordingly.

---

## 8. Compliance alignment

| Doc | Alignment |
|-----|-----------|
| `docs/legal/privacy.md` §6 | Delete Account removes server + local tied to session/account |
| Compliance ADR AC#4 | Signed-in: DELETE + Blob/DB empty; Ghost: DELETE ghost data + local (both **online**) |
| PRODUCT-SPEC | Delete reachable from Settings; Bottom Sheet confirm |

**Amendment to compliance §4.3 Ghost row:** action is no longer「仅清 IndexedDB（离线可用）」→「`DELETE /api/ghost/data` + 清本地；**需联网**」。

---

## 9. Files to touch

| Area | Files |
|------|-------|
| Flow | `lib/client/deleteAccountFlow.ts` (new), `lib/client/deleteAccountFlow.test.ts` (new) |
| Settings UI | `components/settings/PrivacyDataSection.tsx` |
| Home wiring | `components/home/HomeScreen.tsx`, `components/settings/SettingsScreen.tsx` |
| Auth hook | `lib/client/useAuthSession.ts` |
| i18n | `lib/i18n/types.ts`, `en-US.ts`, `de-DE.ts`, `fr-FR.ts` |
| Docs | This spec; optional footnote in `2026-06-05-compliance-privacy-design.md` §4.3 |

**No server route changes required** for MVP of this spec.

---

## 10. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-D1 | Offline: Delete permanently **disabled**; no IndexedDB / localStorage clear |
| AC-D2 | Offline: user sees `deleteRequiresOnline` in confirm Sheet |
| AC-D3 | Online Ghost: `DELETE /api/ghost/data` then local clear; returns home with empty list |
| AC-D4 | Online signed-in: `DELETE /api/users/me` then local clear; `/api/auth/me` → no user |
| AC-D5 | API failure: local data **retained**; error shown; user can retry |
| AC-D6 | Success: new Ghost session registered; onboarding re-inits (shadow demo) |
| AC-D7 | Success: `googleUser` null in UI; no stale signed-in Settings state |
| AC-D8 | `deleteAccountFlow` unit test: offline throws; online calls API before `clearLocalAppData` |

---

## 11. Out of scope

- Offline queue to delete server when back online
- Paddle refund / subscription cancellation on delete
- Admin / support-initiated deletion
- Apple Sign-In account deletion (not in product)
- Changing Paywall or export flows

---

## 12. Implementation status

| Item | Status |
|------|--------|
| Design | ✅ Approved 2026-06-14 |
| Implementation plan | ✅ Inline with spec |
| Code | ✅ Implemented 2026-06-14 |
