# Delete Account — Topic Design

**Topic ID:** `delete-account`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-15

---

## 1. Summary

Snap1099 的 Delete Account 仅从 **Settings → Privacy & Data** 进入，经 Bottom Sheet 二次确认后执行。**必须联网**：离线时「Delete permanently」按钮禁用，不调用 API、不清本地。删除顺序恒为 **API 成功 → `clearLocalAppData()`**；API 失败则本地数据保留，用户可重试。

客户端通过 `lib/client/deleteAccountFlow.ts` 按 **实时 session**（`GET /api/auth/me`）路由：有效 Google session → `DELETE /api/users/me`；纯 Ghost → `DELETE /api/ghost/data`；若 UI 缓存了 `googleUser` 但 session 已过期 → **阻断**并提示重新登录。两侧 DELETE 仍可提交兼容旧客户端的 body `{ orphanGhostIds }`（来自 `snap1099_known_ghost_ids`），但服务端**不把客户端 ghost 列表作为删除授权**；云端擦除范围只来自当前 Ghost、当前绑定 Ghost 与服务端可推导的历史归属。

服务端删除覆盖 Postgres 小票行、Vercel Blob 图像、entitlements、checkout intents、Event Store（events / snapshots / sync cursors），并级联 User / ghost binding；Ghost 路径拒绝已绑定 Google 的 ghost（**409** `GOOGLE_LOGIN_REQUIRED`）。

删除成功后 `HomeScreen` 执行 `onAccountDeleted` 冷启动：清空 UI 状态、重置 auth 内存、重新 onboarding、注册新 Ghost session。若云端已删但本地 wipe 失败，写入 `snap1099_pending_local_wipe`；再次点 Delete 仅重试本地清除（不再打删号 API）。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | Delete Account 入口、Bottom Sheet 确认、合规门控 |
| [`docs/legal/privacy.md`](../../legal/privacy.md) §6 | 删除权：移除 server + local 与会话/账户绑定的数据 |
| [`docs/legal/data-retention.md`](../../legal/data-retention.md) | Delete Account 触发 PG + Blob 硬删（目标 30 天内完成） |
| [`docs/superpowers/topics/compliance-program-design.md`](../topics/compliance-program-design.md) | P2 retention · P6 erasure |

---

## 3. Decisions

### 3.1 User flow

```text
Settings → Privacy & Data → Delete Account
  → Bottom Sheet 确认（isSignedIn 仅用于 warning 文案）
  → [离线] Delete permanently disabled + deleteRequiresOnline
  → [pending local wipe] → clearLocalAppData only → onAccountDeleted
  → [在线]
       ├─ fetchAuthMe.user 有效 → DELETE /api/users/me {orphanGhostIds compat} → clearLocal → onAccountDeleted
       ├─ googleUser 缓存但 session null → deleteSessionExpired；不删除
       └─ 纯 Ghost → ensureGhostSession → DELETE /api/ghost/data {orphanGhostIds compat} → clearLocal → onAccountDeleted
```

| Decision | Detail |
|----------|--------|
| **唯一入口** | Settings → Delete Account；无「仅清本地」旁路 |
| **离线** | 禁止删除；按钮 `disabled={deleting \|\| offline}`（pending local wipe 例外：可重试本地） |
| **确认文案** | `isSignedIn`（localStorage `googleUser`）决定 signed-in / Ghost warning；**不**用于 API 路由 |
| **成功后** | 关闭 Sheet → `onAccountDeleted`：清 receipts/tax/sync 队列 → `auth.resetAfterAccountDelete()` → `resetOnboarding()` → `ensureGhostSession()` → `refreshListFromLocal()` → `setView("home")` |
| **Stale session 恢复** | Cancel → Continue with Google → 再次 Delete Account |
| **本地 wipe 失败** | API 已成功 → `DeleteAccountLocalClearError`；再次 Delete → 仅 `finishLocalWipeAfterAccountDelete` |

**UI：** `components/settings/PrivacyDataSection.tsx`

### 3.2 Client pipeline

**Module：** `lib/client/deleteAccountFlow.ts`

| Export | Purpose |
|--------|---------|
| `DeleteAccountOfflineError` | `code: "OFFLINE"` |
| `DeleteAccountSessionExpiredError` | `code: "SESSION_EXPIRED"` — `googleUser` 存在但 `fetchAuthMe().user == null`，或 409 `GOOGLE_LOGIN_REQUIRED` |
| `DeleteAccountLocalClearError` | `code: "LOCAL_CLEAR_FAILED"` — 云端已删、本地 wipe 失败 |
| `resolveDeleteRoute()` | 返回 `"user"` \| `"ghost"`；stale session 抛 `DeleteAccountSessionExpiredError` |
| `deleteAccountAndLocalData(deps?)` | pending wipe 短路 → 在线检查 → route → compat orphan ids → `deleteAccountApi` → mark pending → `clearLocalAppData`（含重试） |
| `finishLocalWipeAfterAccountDelete` | 仅本地 wipe（带重试） |

**Local wipe 覆盖（`clearLocalAppData`）：** IndexedDB + OPFS · `snap1099_*` localStorage/sessionStorage · `snaptax_founder_widget_seen` · Cache Storage（best-effort）· 最后清除 pending wipe flag。

**Error mapping（PrivacyDataSection）：**

| Error | i18n key |
|-------|----------|
| `DeleteAccountOfflineError` | `settings.privacyData.deleteRequiresOnline` |
| `DeleteAccountSessionExpiredError` | `settings.privacyData.deleteSessionExpired` |
| `DeleteAccountLocalClearError` | `settings.privacyData.deleteLocalClearFailed` |
| 其他 | `settings.privacyData.deleteFailed` |

**Invariant：** API 抛错时 **不得** 调用 `clearLocalAppData()`。

**Tests：** `lib/client/deleteAccountFlow.test.ts` · `lib/storage/clearLocalData.test.ts`

### 3.3 Server cleanup

#### `DELETE /api/users/me` — signed-in

**Route：** `app/api/users/me/route.ts`

1. `getSessionFromCookies()` → `session.userId`
2. 解析 body `orphanGhostIds`（可选，最多 20；兼容字段，不授予删除范围）
3. `deleteUserAccount(userId)` — `lib/receipts/accountCleanup.ts`
4. 204 + 清除 `SESSION_COOKIE_NAME` 与 `GHOST_COOKIE_NAME`

**`deleteUserAccount` receipt scope（`userAccountReceiptFilter`）：**

```typescript
// OR 条件：
//   { userId }
//   { ghostId: <id>, userId: null }  for each id in:
//     - 当前 boundGhostId（snaptax_ghost_account）
//     - historicalGhostIds（服务端从该 user 的 receipts / events / snapshots 推导）
```

执行顺序：`findMany` → `deleteReceiptBlobs` → transaction（`deleteEventStoreRecords` + receipts/entitlements/checkout_intents + `snaptaxUser.delete`）→ `logEvent`（`reason=account_deleted`）。

**Blob 删除失败：** `logEvent` error + **503 `BLOB_DELETE_FAILED`**，阻断 DB 删除（可重试，不假装擦除完成）。空 pathname 已过滤去重。

#### `DELETE /api/ghost/data` — pure Ghost

**Route：** `app/api/ghost/data/route.ts`

1. `getActor(request)` → 必须 `actor.kind === "ghost"`
2. 若 `actor.bound` → **409 `GOOGLE_LOGIN_REQUIRED`**（禁止部分删除）
3. 解析 `orphanGhostIds` 兼容字段；`deleteGhostReceipts(ghostId)` — 服务端仅删除当前 ghost
4. 擦除 receipts（`userId: null`）+ Blob + Event Store（Blob 失败同 signed-in：503）
5. 204 + 清除 `GHOST_COOKIE_NAME`

### 3.4 Invariants

| ID | Invariant |
|----|-----------|
| **I1** | 用户主动删除成功 → 该账户/ghost（含服务端可推导历史 ghost）的 server + local 数据完全移除 |
| **I2** | API 失败 → 本地数据 **保留** |
| **I3** | 离线 → 删除禁用；无 API、无本地清除（pending local wipe 重试除外） |
| **I4** | Signed-in warning 文案 ↔ 仅当 `fetchAuthMe.user` 有效时执行完整账户删除 |
| **I5** | 云端已成功、本地 wipe 失败 → pending flag；再次 Delete 只清本地 |

---

## 4. Decision log

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-14 | `archive/specs/2026-06-14-delete-account-full-cleanup-design.md` | hardening + server-cleanup |
| 2026-06-14 | `archive/specs/2026-06-14-delete-account-cleanup-hardening-design.md` | server-cleanup |
| 2026-07-03 | `archive/specs/2026-07-03-delete-account-server-cleanup-design.md` | **this topic doc** |
| 2026-07-14 | multi-ghost + local wipe retry + Event Store | **this topic doc** §3.2–3.3 |

---

## 5. Out of scope

- 离线排队：联网后补删 server
- Paddle 退款 / 订阅取消
- Admin / support 代删
- Apple Sign-In 账户删除
- 合并单一 `DELETE /api/account` 端点
- 日志 / analytics PII 超出平台 TTL 的专项清除
- Rate-limit bucket 行清理（临时计数，非小票内容）

---

## 6. Archive index

| File | Role |
|------|------|
| [`archive/specs/2026-06-14-delete-account-full-cleanup-design.md`](../archive/specs/2026-06-14-delete-account-full-cleanup-design.md) | 联网门控、删除顺序、client 模块抽取 |
| [`archive/specs/2026-06-14-delete-account-cleanup-hardening-design.md`](../archive/specs/2026-06-14-delete-account-cleanup-hardening-design.md) | bound ghost 小票、session 路由 |
| [`archive/specs/2026-07-03-delete-account-server-cleanup-design.md`](../archive/specs/2026-07-03-delete-account-server-cleanup-design.md) | stale session gate、historical ghost orphans |
| [`archive/plans/2026-07-03-delete-account-server-cleanup.md`](../archive/plans/2026-07-03-delete-account-server-cleanup.md) | 实现计划（已执行） |

**Implemented:** [`archive/plans/2026-07-03-delete-account-server-cleanup.md`](../archive/plans/2026-07-03-delete-account-server-cleanup.md)
