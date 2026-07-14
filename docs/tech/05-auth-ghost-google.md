# 05 — Ghost + Google 身份

## 5.1 目标（PRD）

- 首次打开 **零阻断** Ghost
- Google 为 **唯一** 正式凭证
- 登录后 **静默绑定**，UI 数据无感
- 换机未登录 → 数据不可恢复（Settings Account + 导出/多设备硬拦截提醒）

## 5.2 Ghost 登记与 HMAC（MVP）

> 详见 [API 安全设计](../superpowers/specs/2026-06-05-api-security-design.md)

```mermaid
sequenceDiagram
    participant App
    participant API
    participant Cookie as snap1099_ghost Cookie

    App->>API: POST /api/ghost/register（首次联网）
    API->>Cookie: Set HMAC token（HttpOnly, Secure, SameSite=Lax）
    API->>App: { ghostId }（可选，仅 UI/调试）
    App->>API: 后续请求 credentials:include + Cookie
    Note over App,API: 小票写 snaptax_receipts.ghost_id；不写 snaptax_ghost_account
```

**规则：**

1. **服务端** `POST /api/ghost/register` 签发 token；载荷 `{ ghostId, exp }` + HMAC（`GHOST_HMAC_SECRET`）。
2. 客户端 **不可** 仅发送 localStorage 裸 UUID 作为信任依据。
3. `localStorage.snap1099_ghost_id` 可选，**仅** UI 调试；权威身份在 Cookie。
4. `localStorage.snap1099_known_ghost_ids` 记录客户端见过的 Ghost（最多 20 个）。当 `/api/ghost/register` 返回的 `ghostId` 与本地 UI ghost 不同时，旧 id 会被保留，用于登录后的 orphan merge。
5. **`snaptax_ghost_account` 仅 Google 绑定后 INSERT/UPDATE**（一对一 Ghost ↔ User；同一 user 重新绑定新 Ghost 时记录旧 ghost 并迁移数据）。

## 5.3 Google 登录流程

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant GIS as Google Identity
    participant API
    participant DB

    User->>Client: Continue with Google
    Client->>GIS: 获取 credential (JWT)
    Client->>Client: getClientOrphanGhostIds(currentGhost)
    Client->>API: POST /api/auth/google { credential, orphanGhostIds } + Cookie snap1099_ghost
    API->>API: 验证 JWT + Ghost HMAC
    API->>DB: upsert snaptax_users, bind/rebind snaptax_ghost_account
    API->>DB: migrate current ghost receipts + Event Store
    API->>DB: merge orphan ghosts（receipts + Event Store）
    API->>Client: Set-Cookie snap1099_session
    Client->>Client: mergeOrphanGhostsOnLogin（best-effort）
    Client->>Client: 上传 pending / delete tombstones / flush events / syncFromServer
```

**Request：** `credential`（Google ID Token）；`orphanGhostIds?: string[]`（客户端 known ghosts − current ghost，最多 20 个）。Cookie **`snap1099_ghost` 必填**。Header `X-Ghost-Id` **可选**，若存在须与 token 内 `ghostId` 一致。

### 5.3.1 Orphan Ghost merge

Orphan Ghost 指用户设备曾经拿到过、但尚未绑定 Google 的旧 Ghost。常见来源：cookie 过期后重新登记、登录前跨 session 轮换、或同一 Google user 从旧 Ghost rebind 到新 Ghost。

| 阶段 | 入口 | 发现来源 | 行为 |
|------|------|----------|------|
| Google bind 事务 | `POST /api/auth/google` → `bindGhostAndMigrateData` | rebind 前旧 Ghost、服务端历史 `ghost_id`、客户端 `orphanGhostIds` | 迁移当前 Ghost receipts + Event Store；随后合并 orphan receipts / events / snapshots / cursor |
| 登录后补偿 | `POST /api/sync/ghost-orphans` → `runOrphanGhostMergeForUser` | 服务端历史 `ghost_id`、客户端 `orphanGhostIds` | best-effort 补齐 rotate 后遗漏的数据；失败不阻塞正常 sync |

约束：

- 当前 Ghost 会从候选集合中移除。
- 已绑定到其他 user 的 Ghost 会被跳过，禁止抢占。
- 没有 receipts / events / snapshots / cursor 变化的 Ghost 不会出现在 `mergedGhostIds`。

## 5.4 Session

**MVP 推荐：** Auth.js v5（NextAuth）Google Provider + custom callback 写 `snaptax_ghost_account`

或自研：

- Cookie：`snap1099_session`（HTTP-only, Secure, SameSite=Lax）
- 值：signed JWT `{ userId, exp }`

## 5.5 门控实现

| 场景 | 检查 |
|------|------|
| 自愿登录 | Settings → Account → Continue with Google |
| Export / Multi-device | `session` required (hard sheet in Settings) |
| API 写操作（未绑定） | 有效 **Ghost HMAC Cookie** |
| API 写操作（已绑定 Google） | **Session** required（Ghost token 只读或拒绝写） |

## 5.6 环境变量

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=          # Session JWT
GHOST_HMAC_SECRET=    # Ghost token
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Google Console 回调：`https://{domain}/api/auth/callback/google`

## 5.7 安全

- 验证 ID Token：`aud`, `iss`, `exp`
- Ghost 绑定仅允许一次；已绑定 ghost 拒绝绑到其他 user（`409 GHOST_ALREADY_BOUND`）
- Rate limit 登录端点（Vercel KV 或 middleware）
- Google 绑定后：小票写/删须 Session（见 api-security ADR）
