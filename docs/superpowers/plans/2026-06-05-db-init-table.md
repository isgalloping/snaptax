# DB init-table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已批准 spec 重写 `db/init-table.sql`（DDL + 索引 + COMMENT ON），更新 rollback、Prisma schema 与数据模型文档。

**Architecture:** 单文件 PostgreSQL 事务脚本；`snaptax_*` 四表，子表 FK → `snaptax_users.id`；枚举由应用层校验（E3）；索引覆盖 API 查询与 Webhook 幂等。

**Tech Stack:** PostgreSQL 14+, Prisma (postgresql provider)

**Spec:** `docs/superpowers/specs/2026-06-05-db-init-table-design.md`

---

### Task 1: 重写 `db/init-table.sql`

**Files:**
- Modify: `db/init-table.sql`

- [ ] **Step 1:** CREATE TABLE 四表 + FK + UNIQUE（修复尾逗号、类型对齐）
- [ ] **Step 2:** CREATE INDEX（含 processing 部分索引）
- [ ] **Step 3:** COMMENT ON TABLE/COLUMN/INDEX（简体中文）
- [ ] **Step 4:** BEGIN/COMMIT 包裹

### Task 2: 更新 `db/init-table-down.sql`

**Files:**
- Modify: `db/init-table-down.sql`

- [ ] **Step 1:** 按依赖逆序 DROP 四表

### Task 3: 同步 `prisma/schema.prisma`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1:** 映射 `snaptax_*` 表名与字段；status/industry/auth_channel 用 String

### Task 4: 更新 `docs/tech/04-data-model.md`

**Files:**
- Modify: `docs/tech/04-data-model.md`

- [ ] **Step 1:** ER、表结构、索引、E3 枚举说明与 init-table 对齐

### Task 5: 验证

- [ ] **Step 1:** 检查 SQL 语法（无尾逗号、FK 引用正确）
- [ ] **Step 2:** 更新 spec 状态为「已实现」
