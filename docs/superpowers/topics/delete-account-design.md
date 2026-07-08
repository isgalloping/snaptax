# Delete Account — Topic Design

**Topic ID:** `delete-account`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-08

---

## 1. Summary

Snap1099 的 Delete Account 仅从 **Settings → Privacy & Data** 进入，经 Bottom Sheet 二次确认后执行。**必须联网**：离线时「Delete permanently」按钮禁用，不调用 API、不清本地。删除顺序恒为 **API 成功 → `clearLocalAppData()`**；API 失败则本地数据保留，用户可重试。

客户端通过 `lib/client/deleteAccountFlow.ts` 按 **实时 session**（`GET /api/auth/me`）路由：有效 Google session → `DELETE /api/users/me`；纯 Ghost → `DELETE /api/ghost/data`；若 UI 缓存了 `googleUser` 但 session 已过期 → **阻断**并提示重新登录。服务端删除覆盖 Postgres 小票行、Vercel Blob 图像、entitlements、checkout intents，并级联 User / ghost binding；Ghost 路径拒绝已绑定 Google 的 ghost（409 `GOOGLE_LOGIN_REQUIRED`）。

删除成功后 `HomeScreen` 执行 `onAccountDeleted` 冷启动：清空 UI 状态、重置 auth 内存、重新 onboarding、注册新 Ghost session。

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
  → [在线]
       ├─ fetchAuthMe.user 有效 → DELETE /api/users/me → clearLocal → onAccountDeleted
       ├─ googleUser 缓存但 session null → deleteSessionExpired；不删除
       └─ 纯 Ghost → ensureGhostSession → DELETE /api/ghost/data → clearLocal → onAccountDeleted
```

| Decision | Detail |
|----------|--------|
| **唯一入口** | Settings → Delete Account；无「仅清本地」旁路 |
| **离线** | 禁止删除；按钮 `disabled={deleting \|\| offline}` |
| **确认文案** | `isSignedIn`（localStorage `googleUser`）决定 signed-in / Ghost warning；**不**用于 API 路由 |
| **成功后** | 关闭 Sheet → `onAccountDeleted`：清 receipts/tax/sync 队列 → `auth.resetAfterAccountDelete()` → `resetOnboarding()` → `ensureGhostSession()` → `refreshListFromLocal()` → `setView("home")` |
| **Stale session 恢复** | Cancel → Continue with Google → 再次 Delete Account |

**UI：** `components/settings/PrivacyDataSection.tsx`

### 3.2 Client pipeline

**Module：** `lib/client/deleteAccountFlow.ts`

| Export | Purpose |
|--------|---------|
| `DeleteAccountOfflineError` | `code: "OFFLINE"` |
| `DeleteAccountSessionExpiredError` | `code: "SESSION_EXPIRED"` — `googleUser` 存在但 `fetchAuthMe().user == null` |
| `resolveDeleteRoute()` | 返回 `"user"` \| `"ghost"`；stale session 抛 `DeleteAccountSessionExpiredError` |
| `deleteAccountAndLocalData(deps?)` | 在线检查 → route →（ghost 路径）`ensureGhostSession` → `deleteAccountApi` → `clearLocalAppData` |

**Error mapping（PrivacyDataSection）：**

| Error | i18n key |
|-------|----------|
| `DeleteAccountOfflineError` | `settings.privacyData.deleteRequiresOnline` |
| `DeleteAccountSessionExpiredError` | `settings.privacyData.deleteSessionExpired` |
| 其他 | `settings.privacyData.deleteFailed` |

**Invariant：** API 抛错时 **不得** 调用 `clearLocalAppData()`。

**Tests：** `lib/client/deleteAccountFlow.test.ts` — offline、stale session、user/ghost 路由、API 失败保留本地。

### 3.3 Server cleanup

#### `DELETE /api/users/me` — signed-in

**Route：** `app/api/users/me/route.ts`

1. `getSessionFromCookies()` → `session.userId`
2. `deleteUserAccount(userId)` — `lib/receipts/accountCleanup.ts`
3. 204 + 清除 `SESSION_COOKIE_NAME` 与 `GHOST_COOKIE_NAME`

**`deleteUserAccount` receipt scope（`userAccountReceiptFilter`）：**

```typescript
// OR 条件：
//   { userId }
//   { ghostId: <id>, userId: null }  for each id in:
//     - 当前 boundGhostId（snaptax_ghost_account）
//     - historicalGhostIds（该 user 小票行上 distinct ghostId，含 rebind 后孤儿票）
```

执行顺序：`findMany` → `deleteReceiptBlobs` → transaction（`deleteMany` receipts + entitlements + checkout_intents + `snaptaxUser.delete`）→ `logEvent`（`reason=account_deleted`）。

**Blob 删除失败：** `logEvent` warn，**不阻断** DB 删除。

#### `DELETE /api/ghost/data` — pure Ghost

**Route：** `app/api/ghost/data/route.ts`

1. `getActor(request)` → 必须 `actor.kind === "ghost"`
2. 若 `actor.bound` → **409 `GOOGLE_LOGIN_REQUIRED`**（禁止部分删除）
3. `deleteGhostReceipts(ghostId)` — `where: { ghostId, userId: null }` + Blob delete
4. 204 + 清除 `GHOST_COOKIE_NAME`

**数据移除（signed-in path）：** 该 user 全部 receipts（含历史 ghost 孤儿）、entitlements、checkout_intents、ghost_binding（User delete cascade）。

### 3.4 Invariants

| ID | Invariant |
|----|-----------|
| **I1** | 用户主动删除成功 → 该账户/ghost 的 server + local 数据完全移除 |
| **I2** | API 失败 → 本地数据 **保留** |
| **I3** | 离线 → 删除禁用；无 API、无本地清除 |
| **I4** | Signed-in warning 文案 ↔ 仅当 `fetchAuthMe.user` 有效时执行完整账户删除 |

---

## 4. Decision log

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-14 | `archive/specs/2026-06-14-delete-account-full-cleanup-design.md` | hardening + server-cleanup |
| 2026-06-14 | `archive/specs/2026-06-14-delete-account-cleanup-hardening-design.md` | server-cleanup |
| 2026-07-03 | `archive/specs/2026-07-03-delete-account-server-cleanup-design.md` | **this topic doc** |

---

## 5. Out of scope

- 离线排队：联网后补删 server
- Paddle 退款 / 订阅取消
- Admin / support 代删
- Apple Sign-In 账户删除
- 合并单一 `DELETE /api/account` 端点
- 日志 / analytics PII 超出平台 TTL 的专项清除

---

## 6. Archive index

| File | Role |
|------|------|
| [`archive/specs/2026-06-14-delete-account-full-cleanup-design.md`](../archive/specs/2026-06-14-delete-account-full-cleanup-design.md) | 联网门控、删除顺序、client 模块抽取 |
| [`archive/specs/2026-06-14-delete-account-cleanup-hardening-design.md`](../archive/specs/2026-06-14-delete-account-cleanup-hardening-design.md) | bound ghost 小票、session 路由 |
| [`archive/specs/2026-07-03-delete-account-server-cleanup-design.md`](../archive/specs/2026-07-03-delete-account-server-cleanup-design.md) | stale session gate、historical ghost orphans |
| [`archive/plans/2026-07-03-delete-account-server-cleanup.md`](../archive/plans/2026-07-03-delete-account-server-cleanup.md) | 实现计划（已执行） |

**Implemented:** [`archive/plans/2026-07-03-delete-account-server-cleanup.md`](../archive/plans/2026-07-03-delete-account-server-cleanup.md)
