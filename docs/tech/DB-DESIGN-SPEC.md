# Snap1099 数据库设计规范

> **Canonical 文档** — 改表、索引、Prisma、DDL 前必读。  
> 表结构明细：`04-data-model.md` · DDL 脚本：`db/init-table.sql` · Prisma：`prisma/schema.prisma`

---

## 1. 技术选型

| 项 | 规范 |
|----|------|
| 引擎 | **PostgreSQL** ≥ 14 |
| 托管 | Vercel Postgres（Neon）；Production 用 **pooled** `DATABASE_URL` |
| ORM | **Prisma**（`provider = postgresql`） |
| 客户端离线 | **IndexedDB**（`lib/storage/receiptDb.ts`）；登录后 PG 为权威源 |
| 对象存储 | 小票原图在 **Vercel Blob**；库内 `image_url` 存 **pathname** |

---

## 2. 命名规范

### 2.1 PostgreSQL

| 对象 | 规则 | 示例 |
|------|------|------|
| 表名 | 小写 + `snaptax_` 前缀 + snake_case | `snaptax_users` |
| 列名 | snake_case | `user_email`, `captured_at` |
| 主键 | 列名 `id`，类型 UUID，`gen_random_uuid()` | `id UUID PRIMARY KEY` |
| 外键 | `{关联表单数}_id` → `snaptax_users.id` | `user_id UUID` |
| 索引 | `{表名}_{列简写}_{用途}` | `snaptax_receipts_user_captured_idx` |
| 唯一约束 | `{表名}_{列}_key` | `snaptax_users_auth_channel_user_id_key` |
| Prisma Model | PascalCase，`Snaptax` 前缀 | `SnaptaxUser` |
| Prisma 字段 | camelCase + `@map("snake_case")` | `userEmail @map("user_email")` |

**禁止：** 无 `snaptax_` 前缀的新业务表；camelCase 列名；在 Route Handler 中裸写 SQL（除 migration/脚本）。

### 2.2 IndexedDB（客户端离线）

| 对象 | 规则 | 示例 |
|------|------|------|
| **数据库名** | 固定 **`snaptax`**（legacy 名 `snap1099` 首次打开时自动迁移并删除） | `snaptax` |
| **Object store** | 小写 + **`snaptax_` 前缀** + snake_case；与 PG 表名对齐（客户端专有 store 仍用同前缀） | `snaptax_receipts` |
| **常量出口** | 单一模块导出 store 名；禁止在业务文件硬编码字符串 | `lib/storage/idbStores.ts`（v5 迁移时引入） |

**铁律：** 所有 IndexedDB object store 名必须以 `snaptax_` 开头，与服务器端 `snaptax_*` 表命名空间一致。

#### Object store 注册表

| Store | 职责 | PG 对应 |
|-------|------|---------|
| `snaptax_receipts` | 小票元数据 + 同步字段（`serverId` / `syncStatus` / `pendingUpload` 等） | `snaptax_receipts` |
| `snaptax_receipt_photos` | **图片元数据 only**（OPFS 路径、尺寸、同步/回收状态）；**像素在 OPFS**，见 [`12-local-image-storage-design.md`](./12-local-image-storage-design.md) | —（Blob 在 Vercel Blob；pathname 在 receipt 行） |
| `snaptax_system_meta` | 客户端元数据（`onboarding_status`、`deleted_receipt_ids` 等 KV） | — |
| `snaptax_crypto_meta` | 本地加密 DEK / 密钥材料 | — |
| `snaptax_receipt_events` | append-only 生命周期事件队列（pending → flush → synced） | `snaptax_receipt_events` |
| `snaptax_receipts_summary` | **当前税季**聚合（省税/张数/deductions）；写路径增量 + idle 校验 — [`receipt-sync-lifecycle-design.md`](../superpowers/topics/receipt-sync-lifecycle-design.md) §3.5 | — |

#### 遗留名 → 规范名（v4 → v5 迁移）

| v4（遗留，禁止新代码引用） | v5（规范） |
|---------------------------|-----------|
| `receipts` | `snaptax_receipts` |
| `photos` | `snaptax_receipt_photos` |
| `system_meta` | `snaptax_system_meta` |
| `meta` | `snaptax_crypto_meta` |

**迁移约定（`DB_VERSION = 5`）：** `onupgradeneeded` 中创建新 store → 只读旧 store 全量 copy → 删除旧 store；同一 upgrade 事务内完成。读路径在迁移完成前可双读 fallback（实现细节见 `receiptDb.ts` plan）。

**禁止：** 新建无 `snaptax_` 前缀的 object store；在 `photoStore.ts` / `keyManager.ts` / 组件内散落 store 字符串（须从 `idbStores.ts` 或 `receiptDb`  re-export 引用）；在 **`snaptax_receipt_photos` 存图片 Blob/密文**（像素必须 OPFS，见 [`12-local-image-storage-design.md`](./12-local-image-storage-design.md)）。

### 2.3 客户端图片字节（OPFS）

| 项 | 规范 |
|----|------|
| 存储 | **OPFS** `snaptax/photos/{receiptId}/`；AES-GCM 加密（LEL DEK） |
| IDB | **`snaptax_receipt_photos` 仅元数据** |
| 拍照压缩 | 长边 ≤**1280**（约 1280×960），**JPEG 75%**，目标 **200～300KB** |
| 缩略图 | 长边 **480**，JPEG 70% |
| 已同步 **≥90 天** | 删 OPFS **原图**，保留缩略图；详情走 signed URL |

详设：[`12-local-image-storage-design.md`](./12-local-image-storage-design.md)

---

## 3. 身份与关联模型

### 3.1 用户双 ID

| 字段 | 位置 | 含义 |
|------|------|------|
| `snaptax_users.id` | UUID | **内部主键** — 所有子表 FK 必须指向此列 |
| `snaptax_users.user_id` | varchar(255) | OAuth 提供方用户 ID（如 Google `sub`） |
| `snaptax_users.auth_channel` | varchar(128) | 登录渠道 |

**唯一约束：** `UNIQUE (auth_channel, user_id)` — 登录 upsert 键。

MVP 仅写入 `auth_channel = 'google'`；schema 预留多通道。

### 3.2 Ghost

| 字段 | 类型 | 规则 |
|------|------|------|
| `ghost_id` | **varchar(255)** | 全表统一；**MVP 由 `POST /api/ghost/register` 服务端签发**（HMAC Cookie 内 id） |
| Ghost ↔ User | 一对一 | `snaptax_ghost_account` **仅 Google 绑定后** INSERT；未登录 Ghost **无** ghost 表行 |
| 未登录小票 | — | `snaptax_receipts.ghost_id`；HMAC + 应用层归属校验 |

### 3.3 小票归属

- 未登录：写 `ghost_id`，`user_id` 为 NULL  
- 登录绑定后：迁移/写入 `user_id`；`ghost_id` 可保留  
- **应用层约束：** `user_id` 与 `ghost_id` 至少一个有值（库内不加 CHECK）

### 3.4 外键删除策略

| 子表 | FK | ON DELETE |
|------|-----|-----------|
| `snaptax_ghost_account` | user_id | CASCADE |
| `snaptax_receipts` | user_id | **CASCADE** |
| `snaptax_season_entitlements` | user_id | CASCADE |

---

## 4. 字段类型约定

| 语义 | PostgreSQL 类型 | 说明 |
|------|-----------------|------|
| 主键 / FK | `UUID` | 内部用户 id |
| OAuth / Ghost 外部 ID | `VARCHAR(255)` | 不用 UUID 类型 |
| 邮箱 / 名称 / 渠道 | `VARCHAR(128~255)` | 按列语义定长 |
| 金额 | `NUMERIC(10, 2)` | 不用 FLOAT |
| 时间 | **`TIMESTAMPTZ(3)`** | 毫秒精度；**带时区**；库内 UTC；Prisma `@db.Timestamptz(3)` |
| JSON | `JSONB` | AI 原始响应等 |
| Blob 对象键 | `VARCHAR(2048)` | 列名 `image_url`；存 **pathname**（非 signed/public URL） |
| 布尔 | `BOOLEAN` | 默认显式 `DEFAULT TRUE/FALSE` |

**审计列：** 每张业务表含 `created_at`、`updated_at`，`NOT NULL DEFAULT CURRENT_TIMESTAMP`；`updated_at` 由 Prisma `@updatedAt` 维护。

### 4.1 应用层 UTC（客户端 + 服务端）

| 场景 | 规范 |
|------|------|
| 写入 DB | Prisma `DateTime` → UTC instant（与 `TIMESTAMPTZ` 一致） |
| API 响应 | `date.toISOString()` 或 JSON serializer |
| API 请求体 | 解析 `capturedAt` / `snapAt` 等 **必须** 带 `Z` 或 offset |
| 客户端模块 | **`lib/time/utc.ts`** — `utcNow()` · `toUtcISOString()` · `parseUtcISOString()` |
| IndexedDB | ISO UTC 字符串；见 `lib/storage/receiptDb.ts` |
| UI | 本地时区 **仅展示**（`lib/format.ts`） |

---

## 5. 枚举与约束（E3）

**原则：** 数据库 **不加** PostgreSQL ENUM、不加 CHECK；合法值由 **应用层**（Zod / 常量）校验。

| 字段 | 应用层允许值 |
|------|-------------|
| `auth_channel` | `google`, `github`, `facebook`, `twitter` |
| `industry` | `truck_driver`, `plumber`, `electrician`, `construction`, `delivery`, `general` |
| `status`（receipts） | `processing`, `done`, `blurry` |
| `channel_code`（entitlements） | MVP: `paddle` |

合法值须写入：
1. `COMMENT ON COLUMN`（中文 + 枚举列表）
2. 应用代码常量 / Zod schema（`lib/server/validation/`）

---

## 6. 索引规范

### 6.1 必须有的索引

| 场景 | 索引模式 |
|------|----------|
| 登录 upsert | `UNIQUE (auth_channel, user_id)` |
| Ghost 查绑定 | `UNIQUE (ghost_id)` |
| 最近小票 | `(user_id, captured_at DESC)` |
| Ghost 小票列表 | `(ghost_id, captured_at DESC)` |
| AI 处理队列 | `(status) WHERE status = 'processing'` **部分索引** |
| 权益检查 | `UNIQUE (user_id, tax_season)` |
| Webhook 幂等 | `UNIQUE (transaction_id)` |

### 6.2 索引原则

- 每个索引必须对应 **真实查询**（见 `03-api.md`）；YAGNI，不 preemptive 索引  
- 低基数列（如 `channel_code`）单独索引需有明确理由  
- 新增索引同步：`db/init-table.sql` + `prisma/schema.prisma` + `COMMENT ON INDEX`  
- Prisma 不支持部分索引时：仅在 `init-table.sql` / raw migration 中维护，文档注明

---

## 7. 注释规范

- 使用 PostgreSQL **`COMMENT ON TABLE` / `COMMENT ON COLUMN` / `COMMENT ON INDEX`**  
- 语言：**简体中文**  
- 列注释含：业务含义 + 应用层枚举（如有）  
- DDL 列定义行内 `--` 仅用于开发临时说明，**不替代** `COMMENT ON`  
- Prisma 字段加 `@comment("...")` 与 DDL 注释保持一致

---

## 8. 双源同步工作流

```
db/init-table.sql  ←→  prisma/schema.prisma  ←→  docs/tech/04-data-model.md
         ↓
prisma/migrations/（deploy 用）
```

| 变更类型 | 步骤 |
|----------|------|
| 新表/列/索引 | 1. 改 `init-table.sql` 2. 改 `schema.prisma` 3. 更新 `04-data-model.md` 4. `prisma migrate dev` 5. 更新本规范（若涉及新约定） |
| 仅注释 | 改 `init-table.sql` COMMENT ON + Prisma `@comment` |
| 手工建库 | `psql "$DATABASE_URL" -f db/init-table.sql` |
| 部署 | `prisma migrate deploy`（Vercel build / CI） |

**单一真相顺序：** 设计决策 → `DB-DESIGN-SPEC.md` → DDL + Prisma → 明细文档。

---

## 9. 四表职责（不可合并）

| 表 | 职责 |
|----|------|
| `snaptax_users` | OAuth 用户主数据 |
| `snaptax_ghost_account` | Ghost ↔ User 一对一绑定 |
| `snaptax_receipts` | 小票元数据（图 pathname 在 `image_url`） |
| `snaptax_season_entitlements` | 报税季付费权益（`status`: `active` \| `disputed` \| `refunded`） |
| `snaptax_webhook_events` | 支付渠道 Webhook 审计（`(channel_code, event_id)` 幂等） |
| `snaptax_receipt_events` | append-only 客户端生命周期事件 |
| `snaptax_receipt_sync_cursors` | per-actor event ingest 高水位 |
| `snaptax_receipt_lifecycle_snapshots` | `TAX_CALCULATED` append-only 状态快照 |

**禁止：** 在 `users` 表冗余 entitlements；在 `season_entitlements` 存 `auth_channel`（已通过 `user_id` FK 表达）。

- **`snaptax_receipts.image_url`** 存 **Blob pathname**（= blob_path 语义），禁止持久化 signed/public URL
- **时间列** 一律 **`TIMESTAMPTZ(3)`**，禁止新列使用无时区 `TIMESTAMP`

---

## 10. 数据访问约定

```typescript
// 唯一入口
import { prisma } from "@/lib/prisma";

// 模型名
prisma.snaptaxUser
prisma.snaptaxGhostAccount
prisma.snaptaxReceipt
prisma.snaptaxSeasonEntitlement
```

- Serverless：全局单例 `lib/prisma.ts`，避免连接风暴  
- 事务：多表写（如 Ghost 绑定 + 小票迁移）用 `prisma.$transaction`  
- 禁止：Route Handler 内 `prisma.$queryRaw` 除非有 documented 例外

---

## 11. 禁止事项

- MySQL / SQLite / 其他引擎  
- 子表 FK 指向 `(auth_channel, user_id)` 而非 `snaptax_users.id`  
- `ghost_id` 使用 UUID 类型（与 G2 决策冲突）  
- 无注释的新表/新列  
- 仅改 Prisma 不改 `init-table.sql`（或反之）  
- 删除 `transaction_id` UNIQUE（破坏 Webhook 幂等）  
- **IndexedDB** 新建 object store 无 `snaptax_` 前缀；硬编码 legacy 名 `receipts` / `photos` / `system_meta` / `meta`  
- 在 **`snaptax_receipt_photos` 存图片 Blob**（须 OPFS，见 §2.3）

---

## 12. 相关文档

| 文档 | 用途 |
|------|------|
| [04-data-model.md](./04-data-model.md) | 表结构明细与查询示例 |
| [db/init-table.sql](../../db/init-table.sql) | 可执行 DDL |
| [2026-06-05-db-init-table-design.md](../superpowers/specs/2026-06-05-db-init-table-design.md) | 设计 ADR |
| [03-api.md](./03-api.md) | 驱动索引的 API 查询 |
| [09-deployment-vercel.md](./09-deployment-vercel.md) | `DATABASE_URL` 与 migrate deploy |
