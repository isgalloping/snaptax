# DB 产品对齐（四表 · image_url=pathname）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已批准 spec 将 `db/init-table.sql` 与 PRODUCT-SPEC v1.2 对齐：并入 `data_region`、`receipts.user_id` CASCADE、`image_url` 注释为 Blob pathname；同步 Prisma 与技术文档。

**Architecture:** 四表不变；`init-table.sql` 为唯一 DDL 基准；`image_url` 列名保留、值存 pathname；应用层读时生成 signed URL。

**Tech Stack:** PostgreSQL 14+, Prisma (postgresql provider)

**Spec:** `docs/superpowers/specs/2026-06-05-db-product-alignment-design.md`（含 **§11 TIMESTAMPTZ(3)**）

---

## 文件结构

| 路径 | 变更 |
|------|------|
| `db/init-table.sql` | +2 列、FK CASCADE、**全表 TIMESTAMPTZ(3)**、COMMENT 更新 |
| `db/002_data_region.sql` | 顶部合并说明 |
| `prisma/schema.prisma` | dataRegion、Cascade、imageUrl comment |
| `docs/tech/04-data-model.md` | 字段与 blob_path 约定 |
| `docs/tech/DB-DESIGN-SPEC.md` | FK 策略 + image_url 铁律 |
| `docs/tech/06-receipt-ai-pipeline.md` | Vision input 说明 |

---

### Task 1: 更新 `db/init-table.sql` — users 表

**Files:**
- Modify: `db/init-table.sql`

- [ ] **Step 1: 在 `snaptax_users` CREATE 中追加两列**

在 `auth_channel` 行之后、`created_at` 之前插入：

```sql
  data_region            VARCHAR(8) NOT NULL DEFAULT 'us',
  data_region_locked_at  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at            TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
```

**全表时间列一律 `TIMESTAMPTZ(3)`**（见 spec §11）；Prisma 使用 `@db.Timestamptz(3)`。

```sql
COMMENT ON COLUMN snaptax_users.data_region IS '数据驻留区域；应用层枚举：eu, us；MVP 固定 us';
COMMENT ON COLUMN snaptax_users.data_region_locked_at IS 'data_region 确认时间；Google 登录时写入，MVP 不可改';
```

---

### Task 2: 更新 `db/init-table.sql` — receipts FK 与 COMMENT

**Files:**
- Modify: `db/init-table.sql`

- [ ] **Step 1: 修改 FK 为 CASCADE**

将：

```sql
FOREIGN KEY (user_id) REFERENCES snaptax_users (id) ON DELETE SET NULL
```

改为：

```sql
FOREIGN KEY (user_id) REFERENCES snaptax_users (id) ON DELETE CASCADE
```

- [ ] **Step 2: 更新 receipts 列 COMMENT**

```sql
COMMENT ON COLUMN snaptax_receipts.image_url IS 'Vercel Blob pathname（私有对象键，如 receipts/{uuid}.jpg）；非 signed URL、非 public URL；读时 getDownloadUrl 生成短期链接';
COMMENT ON COLUMN snaptax_receipts.ghost_id IS '未登录 Ghost ID；绑定后 user_id 写入，ghost_id 可保留审计；与 user_id 至少一个有值（应用层）';
COMMENT ON COLUMN snaptax_receipts.category IS '费用类别；应用层枚举：TRUCK GAS, TOOLS, SUPPLIES, EQUIPMENT, MATERIALS, PERSONAL, OTHER';
```

- [ ] **Step 3: 更新 ghost_account 表 COMMENT**

```sql
COMMENT ON TABLE snaptax_ghost_account IS 'Ghost 与正式用户的一对一绑定；仅 Google 登录成功时 INSERT，非 Ghost 注册表';
COMMENT ON COLUMN snaptax_ghost_account.ghost_id IS '浏览器 Ghost ID（HMAC token 内 id）；POST /api/ghost/register 不写本表';
```

- [ ] **Step 4: 更新文件头 spec 引用**

```sql
-- Spec: docs/superpowers/specs/2026-06-05-db-product-alignment-design.md
```

---

### Task 3: 标记 `db/002_data_region.sql` 已合并

**Files:**
- Modify: `db/002_data_region.sql`

- [ ] **Step 1: 替换文件头为归档说明**

```sql
-- DEPRECATED: 已合并至 db/init-table.sql（snaptax_users.data_region / data_region_locked_at）
-- 新环境请仅执行 init-table.sql；已有库若仅缺此二列可继续执行本文件（幂等 ADD IF NOT EXISTS）
```

保留原有 `ALTER TABLE` 体，供已部署库增量升级。

---

### Task 4: 同步 `prisma/schema.prisma`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: SnaptaxUser 增加字段**

```prisma
  dataRegion          String   @default("us") @map("data_region") @db.VarChar(8) @comment("数据驻留；MVP 固定 us")
  dataRegionLockedAt DateTime @default(now()) @map("data_region_locked_at") @db.Timestamptz(3) @comment("区域确认时间")
```

所有 `DateTime` 字段加 `@db.Timestamptz(3)`（见 spec §11）。

- [ ] **Step 2: SnaptaxReceipt 更新 relation 与 comment**

```prisma
  imageUrl     String    @map("image_url") @db.VarChar(2048) @comment("Vercel Blob pathname，非 signed URL")
  // ...
  user SnaptaxUser? @relation(fields: [userId], references: [id], onDelete: Cascade)
```

- [ ] **Step 3: 更新文件头 spec 引用**

```prisma
// Spec: docs/superpowers/specs/2026-06-05-db-product-alignment-design.md
```

- [ ] **Step 4: 生成 client**

Run: `npx prisma generate`  
Expected: 无 schema 错误

---

### Task 5: 更新 `docs/tech/04-data-model.md`

**Files:**
- Modify: `docs/tech/04-data-model.md`

- [ ] **Step 1: users 表增加 data_region 两行**
- [ ] **Step 2: receipts.image_url 说明改为 pathname + signed URL 读时生成**
- [ ] **Step 3: §4.5 增加 data_region、category AI 枚举**
- [ ] **Step 4: §4.10 设计文档链接追加 product-alignment spec**

---

### Task 6: 更新 `docs/tech/DB-DESIGN-SPEC.md`

**Files:**
- Modify: `docs/tech/DB-DESIGN-SPEC.md`

- [ ] **Step 1: §3.4 FK 表 — receipts 改为 CASCADE**

| 子表 | FK | ON DELETE |
|------|-----|-----------|
| `snaptax_receipts` | user_id | **CASCADE** |

- [ ] **Step 2: §9 四表职责下增加铁律**

```markdown
- **`snaptax_receipts.image_url`** 存 **Blob pathname**（= blob_path 语义），禁止持久化 signed/public URL
```

- [ ] **Step 3: §12 相关文档增加 product-alignment spec 链接**

---

### Task 7: 更新 `docs/tech/06-receipt-ai-pipeline.md`

**Files:**
- Modify: `docs/tech/06-receipt-ai-pipeline.md`

- [ ] **Step 1: §6.3 Input 行改为**

```markdown
**Input:** 从 DB 读取 `image_url`（pathname）→ `getDownloadUrl(pathname)` 得短期 signed URL；或 upload 流程内 base64
```

---

### Task 8: 验证

- [ ] **Step 1: SQL 语法目检** — 无尾逗号、FK 正确、COMMENT 完整
- [ ] **Step 2: 若有本地 Postgres** — `psql -f db/init-table.sql` 空库执行成功
- [ ] **Step 3: CASCADE 行为**（可选 psql）

```sql
-- 插入 user + receipt 后
DELETE FROM snaptax_users WHERE id = '<user_uuid>';
-- 期望：snaptax_receipts 对应行一并删除
```

- [ ] **Step 4: 更新 spec 状态**

`docs/superpowers/specs/2026-06-05-db-product-alignment-design.md` 状态改为「已实现」

---

## Spec 覆盖自检

| Spec § | Task |
|--------|------|
| §2.1 data_region | Task 1, 3, 4, 5 |
| §2.2 ghost_account COMMENT | Task 2 |
| §2.3 image_url + CASCADE | Task 2, 4, 5, 6, 7 |
| §4 枚举 COMMENT | Task 2, 5 |
| §6 交付物清单 | Task 1–8 |

---

## 执行选项

Plan 已保存。可选：

1. **Subagent-Driven（推荐）** — 每 Task 派生子 agent，任务间 review  
2. **Inline Execution** — 本会话按 Task 1→8 顺序改文件

回复 **1** 或 **2** 开始实施；未指示前不改 DDL 文件。
