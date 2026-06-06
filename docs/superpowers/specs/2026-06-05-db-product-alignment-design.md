# Snap1099 数据库产品对齐设计（四表 · 无新表）

**日期：** 2026-06-05  
**状态：** 已实现  
**范围：** 在 **不新增表** 前提下，将 `db/init-table.sql` 四表与 **PRODUCT-SPEC v1.2**、**API 安全 ADR** 对齐  
**策略：** A — 对齐验证（方案 1：`init-table.sql` 为唯一 DDL 基准）

**依据：** `docs/product/PRODUCT-SPEC.md` · `db/init-table.sql` · `docs/tech/DB-DESIGN-SPEC.md` · `docs/superpowers/specs/2026-06-05-api-security-design.md`

---

## 1. 目标与锁定决策

### 1.1 目标

使 PostgreSQL 四表 **可直接支撑 MVP 产品闭环**（Ghost 联网拍票 → Google 绑定 → Paddle 导出 → Delete Account），DDL/注释/索引与产品、安全设计 **一致**；**不引入第五张业务表**。

### 1.2 锁定决策

| 决策点 | 选择 |
|--------|------|
| 表数量 | **四表不变** |
| DDL 基准 | **`db/init-table.sql` 吸收 `002_data_region.sql`**；`002` 标为已合并（保留文件仅作历史参考或删除） |
| MVP 驻留 | **美国单库**；`data_region` 默认 `'us'`，路线图预留 `eu` |
| Ghost 未登录 | **无 DB 行**；`ghost_id` 仅存于 `snaptax_receipts`；HMAC / 限流在应用层 + KV |
| Ghost 绑定 | **仅** Google 登录时 insert `snaptax_ghost_account` |
| **`image_url` 语义** | **列名保持 `image_url`，值 = Vercel Blob pathname（即 `blob_path`）**；**不存** signed URL、不存 public URL |
| 枚举 | **E3** — varchar + `COMMENT ON` + 应用层 Zod |
| Delete Account | 已登录：删 user 前删 Blob + receipts；FK 改为 **CASCADE** 防孤儿行 |
| **时间类型** | **全部时间列 `TIMESTAMPTZ(3)`**（带时区，库内 UTC；API ISO 8601） |

### 1.3 ER（不变）

```
snaptax_users 1───0..1 snaptax_ghost_account   （仅 Google 绑定后存在）
snaptax_users 1───* snaptax_receipts
snaptax_users 1───* snaptax_season_entitlements
snaptax_receipts.ghost_id ── 未登录归属（无 FK，应用层 + HMAC 校验）
snaptax_receipts.image_url ── Blob pathname（私有对象键）
```

---

## 2. 四表字段级对齐清单

### 2.1 `snaptax_users`

| 变更 | 列 | 说明 |
|------|-----|------|
| **新增** | `data_region` | `VARCHAR(8) NOT NULL DEFAULT 'us'`；应用枚举 `eu`, `us`；MVP 写入/保持 `us` |
| **新增** | `data_region_locked_at` | `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`；Google 登录确认区域时写入 |
| 不变 | 其余列 | OAuth 双 ID、`industry` 等保持 |

**产品映射：** Google 登录 upsert 用户；Settings 行业六选一；Delete Account 删本行（级联子表）。

**MVP 行为：** 所有新用户 `data_region = 'us'`；不做 EU 分库路由；Privacy 披露美国存储。

### 2.2 `snaptax_ghost_account`

| 变更 | 说明 |
|------|------|
| **无结构变更** | 仅强化 COMMENT |

**语义澄清：**

- 本表 **不是** Ghost 注册表；**不存在**「未登录 Ghost 行」。
- 仅在 `POST /api/auth/google` 成功且 `ghost_id` 首次绑定时 INSERT。
- `ghost_id` UNIQUE：一 Ghost 终生最多绑一个 User；`user_id` UNIQUE：一 User 最多绑一个 Ghost。

**API 安全：** `POST /api/ghost/register` **不写本表**；仅签发 HMAC Cookie。

### 2.3 `snaptax_receipts`

| 变更 | 列 | 说明 |
|------|-----|------|
| **COMMENT 修正** | `image_url` | **存 Blob pathname**（例：`receipts/{uuid}.jpg`），读时 `getDownloadUrl(pathname)` 生成短期 signed URL |
| **FK 修正** | `user_id` | `ON DELETE SET NULL` → **`ON DELETE CASCADE`** |
| **COMMENT 修正** | `category` | 补充 AI 输出枚举：`TRUCK GAS`, `TOOLS`, `SUPPLIES`, `EQUIPMENT`, `MATERIALS`, `PERSONAL`, `OTHER`（与 `06-receipt-ai-pipeline.md` 一致） |
| **COMMENT 修正** | `ghost_id` | 未登录必填（与 `user_id` 互斥阶段）；绑定后 `user_id` 写入，`ghost_id` **可保留** 便于审计 |
| 不变 | 其余列 | `status` 三态、`ai_raw` JSONB、`snap_at` 离线延迟上传等 |

**`image_url` = `blob_path` 约定（重要）：**

```typescript
// 写入（upload）
const pathname = `receipts/${receiptId}.jpg`;
await put(pathname, file, { access: "private" });
await prisma.snaptaxReceipt.create({
  data: { imageUrl: pathname, /* ... */ },
});

// 读取（OpenAI / 客户端预览）
const signedUrl = await getDownloadUrl(receipt.imageUrl, { expiresIn: 900 });
```

**禁止：** 将 signed URL 或 `https://*.public.blob.vercel-storage.com/...` 持久化进 `image_url`。

**应用层约束（无 DB CHECK）：** `user_id` 与 `ghost_id` 至少一个有值；未登录行 `user_id IS NULL`。

**Delete Account：**

| 场景 | SQL 语义 |
|------|----------|
| 未登录 Ghost | `DELETE FROM snaptax_receipts WHERE ghost_id = ? AND user_id IS NULL` + 按 pathname 删 Blob |
| 已登录 User | `DELETE FROM snaptax_users WHERE id = ?`（receipts **CASCADE**）+ 批量删 Blob |

### 2.4 `snaptax_season_entitlements`

| 变更 | 说明 |
|------|------|
| **无结构变更** | Paddle Webhook 幂等 `transaction_id` UNIQUE 保持 |

**产品映射：** Export 前 `GET /api/entitlements/current?season=2026` 查 `(user_id, tax_season)`。

---

## 3. 索引对齐

### 3.1 保留（无变更）

| 索引 | 用途 |
|------|------|
| `snaptax_users_auth_channel_user_id_key` | Google upsert |
| `snaptax_users_user_email_idx` | 邮箱查用户 |
| `snaptax_ghost_account_ghost_id_key` | 绑定查 Ghost |
| `snaptax_ghost_account_user_id_key` | 用户查 Ghost |
| `snaptax_receipts_user_captured_idx` | 主界面最近 3 条（已登录） |
| `snaptax_receipts_ghost_captured_idx` | Ghost 列表 + **未绑定计数**（`COUNT WHERE ghost_id AND user_id IS NULL`） |
| `snaptax_receipts_user_snap_idx` | 按拍照时间 |
| `snaptax_receipts_processing_idx` | AI 队列（部分索引） |
| `snaptax_season_entitlements_user_season_key` | Export 门控 |
| `snaptax_season_entitlements_transaction_id_key` | Webhook 幂等 |

### 3.2 刻意不加

- `image_url` 索引 — 按 id/归属查，不按 path 查
- `category` / `merchant_name` 单列索引 — MVP 无报表查询
- Ghost 注册表索引 — 无第五表

---

## 4. 应用层枚举（E3 · COMMENT 同步）

| 字段 | 表 | 允许值 |
|------|-----|--------|
| `auth_channel` | users | `google`, `github`, `facebook`, `twitter`（MVP 仅 `google`） |
| `industry` | users | `truck_driver`, `plumber`, `electrician`, `construction`, `delivery`, `general` |
| `data_region` | users | `eu`, `us`（MVP 仅 `us`） |
| `status` | receipts | `processing`, `done`, `blurry` |
| `category` | receipts | `TRUCK GAS`, `TOOLS`, `SUPPLIES`, `EQUIPMENT`, `MATERIALS`, `PERSONAL`, `OTHER` |
| `channel_code` | entitlements | MVP: `paddle` |

校验位置：`lib/server/validation/` 或各 Route Handler 入口 Zod。

---

## 5. 产品能力 → 表/列速查

| 产品能力 | 表/列 |
|----------|--------|
| Ghost 联网拍票 | `receipts.ghost_id`, `receipts.image_url`(pathname), `status=processing` |
| OpenAI 完成 | `status`, `amount`, `merchant_name`, `category`, `deductible`, `ai_raw`, `processed_at` |
| 离线延迟上传 | `snap_at` ≠ `captured_at` |
| Google 绑定 | insert `ghost_account`；`UPDATE receipts SET user_id` |
| Est. Tax Saved | `SUM(amount) WHERE status=done AND deductible=true` |
| Paddle 付费 | `season_entitlements` |
| Export Tax Pack | entitlements + receipts 聚合（无 export 任务表，MVP 即时生成） |
| Delete Account | 见 §2.3 |
| 美国存储披露 | `users.data_region='us'`（MVP 固定） |
| Ghost 50 张上限 | `COUNT(receipts) WHERE ghost_id AND user_id IS NULL` — 走 `ghost_captured_idx` |

---

## 6. 相对当前 DDL 的变更摘要

| # | 文件 | 变更 |
|---|------|------|
| 1 | `db/init-table.sql` | `users` 增加 `data_region`, `data_region_locked_at` |
| 2 | `db/init-table.sql` | `receipts.user_id` FK → `ON DELETE CASCADE` |
| 3 | `db/init-table.sql` | 更新 `image_url` / `category` / `ghost_id` / `data_region` 等 COMMENT |
| 4 | `db/002_data_region.sql` | 顶部注明 **已合并至 init-table**；新环境勿单独执行 |
| 5 | `prisma/schema.prisma` | 同步 `dataRegion`, `dataRegionLockedAt`；`imageUrl` @comment；`onDelete: Cascade` |
| 6 | `docs/tech/04-data-model.md` | 同步字段说明与 blob_path 约定 |
| 7 | `docs/tech/DB-DESIGN-SPEC.md` | §3.4 FK 策略、§9 增加 `image_url`=pathname 铁律 |
| 8 | `docs/tech/06-receipt-ai-pipeline.md` | Input 改为 pathname → signed URL |

**不变更：** 表名、列名（**保留 `image_url` 列名**，不 rename 为 `blob_path`）、表数量、Prisma Model 名。

---

## 7. 双源同步工作流

```
PRODUCT-SPEC v1.2
       ↓
本 spec（对齐 ADR）
       ↓
db/init-table.sql  ←→  prisma/schema.prisma  ←→  docs/tech/04-data-model.md
       ↓
prisma/migrations/（实施阶段）
```

---

## 8. 验证清单

1. `psql -f db/init-table.sql` 空库无报错  
2. `\d+ snaptax_receipts` 可见 `image_url` COMMENT 含 pathname 说明  
3. `DELETE FROM snaptax_users WHERE id=…` 级联删除 receipts（非 SET NULL）  
4. 插入 `image_url = 'receipts/test.jpg'` 合法；插入完整 `https://…?sig=…` 在应用层拒绝（非 DB）  
5. Prisma `snaptaxUser.delete` 级联 receipts  
6. PRODUCT-SPEC §8 与本文 ER 一致  
7. `\d snaptax_receipts` 时间列类型均为 `timestamptz(3)`

---

## 9. 不在本次范围（YAGNI）

- 第五表（Ghost 注册、Export 任务、审计日志）
- EU 分库 / 双 `DATABASE_URL`
- `image_url` 列 rename 为 `blob_path`（语义已在 COMMENT 与代码常量中对齐）
- PostgreSQL ENUM / CHECK 约束

---

## 10. 相关文档

| 文档 | 关系 |
|------|------|
| [2026-06-05-db-init-table-design.md](./2026-06-05-db-init-table-design.md) | 初版四表 ADR；**列级变更以本文为准** |
| [2026-06-05-api-security-design.md](./2026-06-05-api-security-design.md) | Blob private、Ghost HMAC、IDOR |
| [PRODUCT-SPEC.md](../../product/PRODUCT-SPEC.md) | 产品铁律 v1.2 |

**变更流程：** 产品决策 → PRODUCT-SPEC → **本 spec** → `init-table.sql` + Prisma → `04-data-model.md`

---

## 11. 时间字段：TIMESTAMPTZ(3)

### 11.1 规则

| 项 | 约定 |
|----|------|
| PostgreSQL 类型 | **`TIMESTAMPTZ(3)`** — 全表所有时间列，含审计列 |
| 精度 | 毫秒 `(3)` |
| 存储语义 | PostgreSQL 内部 **UTC**；写入带 offset 或 `Z` 的 ISO 8601 |
| Prisma | `DateTime` + `@db.Timestamptz(3)` |
| API JSON | ISO 8601 字符串，如 `2026-06-05T11:30:00.000Z` |
| 客户端 `snap_at` | 设备时间须 **`toUtcISOString()`** 再上传 |
| 应用模块 | **`lib/time/utc.ts`**（客户端/服务端共用） |

### 11.2 涉及列（14 列）

| 表 | 列 |
|----|-----|
| `snaptax_users` | `data_region_locked_at`, `created_at`, `updated_at` |
| `snaptax_ghost_account` | `bound_at`, `created_at`, `updated_at` |
| `snaptax_receipts` | `captured_at`, `snap_at`, `processed_at`, `created_at`, `updated_at` |
| `snaptax_season_entitlements` | `paid_at`, `created_at`, `updated_at` |

### 11.3 禁止

- 新时间列使用无时区 `TIMESTAMP(3)`
- API 返回无时区本地字符串
- 混用 `DateTime` 默认 `@db.Timestamp(3)` 与 `@db.Timestamptz(3)`

### 11.4 已有库升级（非 init-table 场景）

若库已用 `TIMESTAMP(3)` 建表，需独立 migration：

```sql
ALTER TABLE snaptax_users
  ALTER COLUMN created_at TYPE TIMESTAMPTZ(3) USING created_at AT TIME ZONE 'UTC';
-- 对其余 13 列重复
```

假设原数据为 UTC 写入；若曾用本地时间无 TZ 写入，迁移前需数据审计。
