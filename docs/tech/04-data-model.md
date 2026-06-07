# 04 — 数据模型

> **设计规范（改表前必读）：** [DB-DESIGN-SPEC.md](./DB-DESIGN-SPEC.md)

**数据库引擎：PostgreSQL**（≥ 14）  
**生产托管：** Vercel Postgres（Neon）  
**ORM：** Prisma（`prisma/schema.prisma` + `@prisma/client`）  
**DDL 脚本：** `db/init-table.sql`（含索引与 COMMENT ON）

> 客户端离线队列仍用 **IndexedDB**；登录后服务端 **PostgreSQL** 为权威数据源。  
> 枚举字段（status、industry、auth_channel 等）**应用层校验**，数据库不加 ENUM/CHECK。  
> **时间字段** 一律 **`TIMESTAMPTZ(3)`**（UTC 存储；API 用 ISO 8601）。

## 4.1 目录结构

```
db/
├── init-table.sql         # PostgreSQL 建表 + 索引 + 注释
└── init-table-down.sql    # 回滚

prisma/
├── schema.prisma          # 模型定义（provider = postgresql）
└── migrations/            # prisma migrate 生成

lib/
└── prisma.ts              # PrismaClient 单例（Serverless 友好）
```

## 4.2 ER 关系

```
snaptax_users 1───0..1 snaptax_ghost_account
snaptax_users 1───* snaptax_receipts
snaptax_users 1───* snaptax_season_entitlements
snaptax_receipts *───1 image (image_url → Vercel Blob)
```

- Ghost ↔ User：**一对一**（`ghost_id` UNIQUE，`user_id` UNIQUE）  
- 子表统一 FK → `snaptax_users.id`（内部 UUID）  
- Receipt：登录前挂 `ghost_id`（varchar）；绑定后写入 `user_id`

## 4.3 表结构

### snaptax_users

| 列 | 类型 | 说明 |
|----|------|------|
| id | UUID PK | 内部主键，子表 FK 锚点 |
| user_id | varchar(255) | OAuth 用户 ID（如 Google sub） |
| user_name | varchar(255)? | 显示名 |
| user_email | varchar(255) | 邮箱 |
| industry | varchar(128)? | 应用枚举见 §4.6 |
| auth_channel | varchar(128) | 应用枚举见 §4.6 |
| data_region | varchar(8) | 默认 `us`；MVP 固定美国 |
| data_region_locked_at | TIMESTAMPTZ(3) | 区域确认时间 |
| created_at / updated_at | TIMESTAMPTZ(3) | 审计时间（UTC） |

**唯一：** `(auth_channel, user_id)`

### snaptax_ghost_account

| 列 | 类型 | 说明 |
|----|------|------|
| id | UUID PK | 记录主键 |
| ghost_id | varchar(255) UNIQUE | HMAC token 内 id；**绑定表**查 ghost（非裸 X-Ghost-Id） |
| user_id | UUID UNIQUE FK | → snaptax_users.id CASCADE |
| bound_at | TIMESTAMPTZ(3) | 绑定时间 |

### snaptax_receipts

| 列 | 类型 | 说明 |
|----|------|------|
| id | UUID PK | 小票主键 |
| user_id | UUID? FK | → users.id **CASCADE** |
| ghost_id | varchar(255)? | 未登录 Ghost |
| image_url | varchar(2048) | **Vercel Blob pathname**（非 signed URL）；读时 `getDownloadUrl` |
| status | varchar(32) | processing / done / blurry |
| amount, currency | NUMERIC / varchar | 金额与币种 |
| merchant_name, category | varchar | AI 识别 |
| deductible | BOOLEAN | 默认 true |
| **tax_amount** | NUMERIC(10,2) | 估算省税；**仅 OpenAI 路径写入**；顶栏 SUM |
| **data_region** | varchar(8) | 税法辖区快照 `us` \| `eu`（与物理驻留解耦） |
| ai_raw | JSONB | OpenAI 原始响应 + ratio/VAT 等 |
| captured_at | TIMESTAMPTZ(3) | 上传时间 |
| snap_at | TIMESTAMPTZ(3)? | 拍照时间 |
| processed_at | TIMESTAMPTZ(3)? | AI 完成时间 |

**应用层约束：** `user_id` 与 `ghost_id` 至少一个有值。

### snaptax_season_entitlements

| 列 | 类型 | 说明 |
|----|------|------|
| id | UUID PK | 权益主键 |
| user_id | UUID FK | → users.id CASCADE |
| tax_season | varchar(255) | 如 `2026` |
| transaction_id | varchar(128) UNIQUE | Paddle 交易号 |
| paid_at | TIMESTAMPTZ(3) | 支付时间 |
| amount | NUMERIC(10,2) | 实付金额 |
| channel_code | varchar(64) | 如 `paddle` |

**唯一：** `(user_id, tax_season)`

## 4.4 索引

| 索引 | 用途 |
|------|------|
| users (auth_channel, user_id) UNIQUE | 登录 upsert |
| users (user_email) | 邮箱查用户 |
| ghost_account (ghost_id) UNIQUE | Ghost 绑定查 ghost_id |
| ghost_account (user_id) UNIQUE | 用户查 Ghost |
| receipts (user_id, captured_at DESC) | 主界面最近小票 |
| receipts (ghost_id, captured_at DESC) | Ghost 列表 |
| receipts (user_id, snap_at DESC) | 按拍照时间 |
| receipts (status) WHERE processing | AI 队列（部分索引） |
| entitlements (user_id, tax_season) UNIQUE | Export 权益 |
| entitlements (transaction_id) UNIQUE | Webhook 幂等 |

## 4.5 应用层枚举（E3）

| 字段 | 允许值 |
|------|--------|
| auth_channel | google, github, facebook, twitter |
| industry | truck_driver, plumber, electrician, construction, delivery, general |
| data_region | eu, us（MVP 仅 us） |
| status | processing, done, blurry |
| category | TRUCK GAS, TOOLS, SUPPLIES, EQUIPMENT, MATERIALS, PERSONAL, OTHER |
| channel_code | paddle（MVP） |

MVP 阶段仅写入 `auth_channel = 'google'`。

## 4.6 Prisma Client 单例

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

## 4.7 客户端 IndexedDB（已有）

Store `receipts` + `photos` — 字段与 server 对齐，额外：

| 字段 | 说明 |
|------|------|
| serverId | 同步后服务端 id |
| syncStatus | `local` \| `synced` \| `failed` |
| timestamp | UTC ISO 8601 字符串（`toUtcISOString`）；读时 `parseUtcISOString` |

## 4.8 迁移与工作流

| 命令 | 场景 |
|------|------|
| `psql "$DATABASE_URL" -f db/init-table.sql` | 手工建库 / 审查 DDL |
| `npx prisma migrate dev --name init` | 本地开发，生成 migration |
| `npx prisma migrate deploy` | Production / Preview 部署 |
| `npx prisma generate` | 生成 client（build 必跑） |

## 4.9 查询示例

```typescript
// 最近小票（GET /api/receipts?limit=3）
await prisma.snaptaxReceipt.findMany({
  where: { userId },
  orderBy: { capturedAt: "desc" },
  take: 3,
});

// 本季权益（GET /api/entitlements/current）
await prisma.snaptaxSeasonEntitlement.findUnique({
  where: { userId_taxSeason: { userId, taxSeason: "2026" } },
});

// 退税估算
const sum = await prisma.snaptaxReceipt.aggregate({
  where: { userId, status: "done", deductible: true },
  _sum: { amount: true },
});
```

## 4.10 设计文档

- Spec: [docs/superpowers/specs/2026-06-05-db-product-alignment-design.md](../superpowers/specs/2026-06-05-db-product-alignment-design.md)
- Plan: [docs/superpowers/plans/2026-06-05-db-init-table.md](../superpowers/plans/2026-06-05-db-init-table.md)
