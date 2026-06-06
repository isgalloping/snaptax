# Snap1099 数据库 init-table 设计规范

**日期：** 2026-06-05  
**状态：** 已实现  
**范围：** `db/init-table.sql` 建表准确性、索引、注释  
**引擎：** PostgreSQL ≥ 14（Vercel Postgres / Neon / 本地）

---

## 1. 背景与目标

对当前 `db/init-table.sql` 草稿进行三项工作：

1. **验证并修正建表语句** — 可执行的 PostgreSQL DDL，类型/FK/唯一约束一致  
2. **设计合适索引** — 覆盖 API 查询与 Webhook 幂等  
3. **增加正确注释** — `COMMENT ON TABLE/COLUMN/INDEX`，枚举合法值由注释文档化（应用层校验）

### 1.1 已锁定决策

| 决策点 | 选择 |
|--------|------|
| Schema 基准 | 当前 `init-table.sql` 草稿（`snaptax_` 表前缀、多登录通道、扩展字段） |
| 用户关联 | 子表统一 FK → `snaptax_users.id`（内部 UUID） |
| `ghost_id` 类型 | 全表 `varchar(255)` |
| 枚举约束 | **E3** — 纯 `varchar`，不加 PostgreSQL ENUM / CHECK；应用层校验 |
| 交付方式 | **单文件** `init-table.sql`（DDL + 索引 + COMMENT ON，`BEGIN/COMMIT`） |

### 1.2 与 PRD MVP 的关系

- PRD MVP 仅实现 **Google + Paddle**；schema 预留多通道字段（`auth_channel` 等）  
- MVP 阶段应用层只写入 `auth_channel = 'google'`，其余通道字段 nullable 预留  
- 后续需同步更新 `prisma/schema.prisma` 与 `docs/tech/04-data-model.md`（implementation plan 阶段）

---

## 2. ER 关系

```
snaptax_users 1───0..1 snaptax_ghost_account
snaptax_users 1───* snaptax_receipts
snaptax_users 1───* snaptax_season_entitlements
snaptax_receipts *───1 image (image_url → Vercel Blob)
```

- Ghost ↔ User：**一对一**（`ghost_id` UNIQUE，`user_id` UNIQUE）  
- Receipt：登录前挂 `ghost_id`；登录绑定后迁移至 `user_id`，`ghost_id` 可保留  
- Entitlement：每用户每报税季一条（`user_id + tax_season` UNIQUE）

---

## 3. 表结构定稿

### 3.1 `snaptax_users`

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 内部主键，子表 FK 锚点 |
| user_id | varchar(255) | NOT NULL | OAuth 提供方用户 ID（如 Google sub） |
| user_name | varchar(255) | NULL | 显示名；无 email 时可用（如 Facebook） |
| user_email | varchar(255) | NOT NULL | 邮箱 |
| industry | varchar(128) | NULL | 行业；应用枚举见 §6 |
| auth_channel | varchar(128) | NOT NULL | 登录渠道；应用枚举见 §6 |
| created_at | TIMESTAMP(3) | NOT NULL, DEFAULT now | 创建时间 |
| updated_at | TIMESTAMP(3) | NOT NULL, DEFAULT now | 更新时间 |

**唯一约束：** `UNIQUE (auth_channel, user_id)`

### 3.2 `snaptax_ghost_account`

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 记录主键 |
| ghost_id | varchar(255) | NOT NULL, UNIQUE | 浏览器 localStorage Ghost ID |
| user_id | UUID | NOT NULL, UNIQUE, FK → users.id CASCADE | 绑定的内部用户 ID |
| bound_at | TIMESTAMP(3) | NOT NULL, DEFAULT now | 绑定时间 |
| created_at | TIMESTAMP(3) | NOT NULL, DEFAULT now | 创建时间 |
| updated_at | TIMESTAMP(3) | NOT NULL, DEFAULT now | 更新时间 |

### 3.3 `snaptax_receipts`

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 小票主键 |
| user_id | UUID | NULL, FK → users.id SET NULL | 登录用户；未登录为 NULL |
| ghost_id | varchar(255) | NULL | 未登录 Ghost ID |
| image_url | varchar(2048) | NOT NULL | Vercel Blob 图片 URL |
| status | varchar(32) | NOT NULL, DEFAULT 'processing' | 应用枚举见 §6 |
| amount | NUMERIC(10,2) | NULL | 金额 |
| currency | varchar(32) | NULL | 币种（如 USD） |
| merchant_name | varchar(255) | NULL | 商户名 |
| category | varchar(128) | NULL | 费用类别 |
| deductible | BOOLEAN | NOT NULL, DEFAULT TRUE | 是否可抵扣 |
| ai_raw | JSONB | NULL | OpenAI 原始响应 |
| captured_at | TIMESTAMP(3) | NOT NULL | 上传/入库时间 |
| snap_at | TIMESTAMP(3) | NULL | 拍照时间（可与 captured_at 不同） |
| processed_at | TIMESTAMP(3) | NULL | AI 完成时间 |
| created_at | TIMESTAMP(3) | NOT NULL, DEFAULT now | 记录创建 |
| updated_at | TIMESTAMP(3) | NOT NULL, DEFAULT now | 记录更新 |

**应用层约束（无 DB CHECK）：** `user_id` 与 `ghost_id` 至少一个有值。

### 3.4 `snaptax_season_entitlements`

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 权益记录主键 |
| user_id | UUID | NOT NULL, FK → users.id CASCADE | 付费用户（内部 UUID） |
| tax_season | varchar(255) | NOT NULL | 报税季，如 `2026` |
| transaction_id | varchar(128) | NOT NULL, UNIQUE | 支付交易号（Paddle 等） |
| paid_at | TIMESTAMP(3) | NOT NULL | 支付成功时间 |
| amount | NUMERIC(10,2) | NOT NULL | 实付金额 |
| channel_code | varchar(64) | NOT NULL | 支付渠道，如 `paddle` |
| created_at | TIMESTAMP(3) | NOT NULL, DEFAULT now | 创建时间 |
| updated_at | TIMESTAMP(3) | NOT NULL, DEFAULT now | 更新时间 |

**唯一约束：** `UNIQUE (user_id, tax_season)`

**移除字段：** `auth_channel`（用户身份已通过 `user_id` UUID FK 表达，避免双轨）

---

## 4. 相对草稿的修正清单

| # | 问题 | 修正 |
|---|------|------|
| 1 | 三表 CREATE 语句尾逗号 | 删除 |
| 2 | BEGIN/COMMIT 被注释 | 恢复事务包裹 |
| 3 | `receipts.ghost_id` 为 UUID | 改为 varchar(255) |
| 4 | `season_entitlements.user_id` 为 varchar | 改为 UUID FK |
| 5 | 无 FK / UNIQUE | 按 §3 补齐 |
| 6 | `users.auth_channel` 可空 | NOT NULL |
| 7 | `receipts.image_url` 可空 | NOT NULL |
| 8 | `season_entitlements.auth_channel` 冗余 | 删除 |
| 9 | 注释块引用旧表名/字段 | 重写 COMMENT ON |
| 10 | 无实际索引 | 按 §5 创建 |

---

## 5. 索引设计

| 表 | 索引名 | 定义 | 用途 |
|----|--------|------|------|
| snaptax_users | `snaptax_users_auth_channel_user_id_key` | UNIQUE (auth_channel, user_id) | 登录 upsert |
| snaptax_users | `snaptax_users_user_email_idx` | (user_email) | 邮箱查用户 |
| snaptax_ghost_account | `snaptax_ghost_account_ghost_id_key` | UNIQUE (ghost_id) | X-Ghost-Id 查绑定 |
| snaptax_ghost_account | `snaptax_ghost_account_user_id_key` | UNIQUE (user_id) | 用户查 Ghost |
| snaptax_receipts | `snaptax_receipts_user_captured_idx` | (user_id, captured_at DESC) | 主界面最近小票 |
| snaptax_receipts | `snaptax_receipts_ghost_captured_idx` | (ghost_id, captured_at DESC) | Ghost 维度列表 |
| snaptax_receipts | `snaptax_receipts_user_snap_idx` | (user_id, snap_at DESC) | 按拍照时间排序 |
| snaptax_receipts | `snaptax_receipts_processing_idx` | (status) WHERE status = 'processing' | AI 处理队列（部分索引） |
| snaptax_season_entitlements | `snaptax_season_entitlements_user_season_key` | UNIQUE (user_id, tax_season) | Export 权益检查 |
| snaptax_season_entitlements | `snaptax_season_entitlements_transaction_id_key` | UNIQUE (transaction_id) | Webhook 幂等 |

**刻意不加：** `category`、`merchant_name`、`channel_code` 单列索引（MVP 无对应查询）。

---

## 6. 应用层枚举（E3，注释中引用）

| 字段 | 允许值 |
|------|--------|
| auth_channel | `google`, `github`, `facebook`, `twitter` |
| industry | `truck_driver`, `plumber`, `electrician`, `construction`, `delivery`, `general` |
| status | `processing`, `done`, `blurry` |
| channel_code | MVP: `paddle` |

校验位置（implementation plan）：`lib/server/validation/` 或 Zod schema，Route Handler 入口。

---

## 7. 注释规范

- 使用 `COMMENT ON TABLE` / `COMMENT ON COLUMN` / `COMMENT ON INDEX`  
- 列注释包含：业务含义 + 应用层枚举（如有）  
- DDL 列定义行内 `-- 建查询索引` 类注释移除，改由索引段与 `COMMENT ON INDEX` 表达  
- 注释语言：**简体中文**

---

## 8. 文件交付物

| 文件 | 内容 |
|------|------|
| `db/init-table.sql` | CREATE TABLE + INDEX + COMMENT ON（单事务） |
| `db/init-table-down.sql` | DROP INDEX / TABLE（逆序，供本地重置） |

**执行：**

```bash
psql "$DATABASE_URL" -f db/init-table.sql
```

---

## 9. 后续同步（implementation plan 范围，非本 spec 直接改动）

- 更新 `prisma/schema.prisma` 映射新表名与字段  
- 更新 `docs/tech/04-data-model.md`  
- 应用层 Zod 枚举与 API 对齐  
- Export 聚合查询：`(user_id, status)` 若 P95 慢再补索引（YAGNI）

---

## 10. 测试验证

1. `psql -f db/init-table.sql` 在空库执行无报错  
2. `psql -f db/init-table-down.sql` 可完整回滚  
3. 插入违反 UNIQUE/FK 的数据应失败  
4. `\d+ snaptax_receipts` 可见 COMMENT 与部分索引  
5. `EXPLAIN` 验证 `GET /api/receipts` 等价查询走 `snaptax_receipts_user_captured_idx`
