# Superpowers 文档合并与分层索引设计

> **Status:** Approved (2026-07-07)  
> **Motivation:** (A) Agent/新人难找当前有效决策；(C) 同功能多轮 spec 冗余（如 6/14 onboarding ~20 篇）  
> **Scope:** `docs/superpowers/` 共 ~218 篇（151 specs + 67 plans）；**不**合并 `docs/product/`、`docs/tech/`、`docs/legal/`

---

## 1. 问题陈述

| 现象 | 影响 |
|------|------|
| 151 篇 spec 按日期平铺，无顶层索引 | Agent 随机命中 **superseded** 旧决策 |
| 同一主题多轮迭代（onboarding、home、export、PWA） | 读 20 篇才能拼出终态 |
| 部分真相已上收 `PRODUCT-SPEC` / `docs/tech/*` | superpowers 与 canonical 重复、优先级不清 |
| spec/plan 1:1 配对 | 实现完成后 plan 仍占「活跃」目录，加重噪音 |

**目标：** 建立三层可读性；已完成主题收成 **1 篇终稿**；历史进 archive；**不**大面积删路径（stub 保链）。

**非目标：**

- 不把 218 篇物理合成个位数 mega-file
- 不把 plan 正文并入 spec（plan 整份归档）
- 不改动 brainstorming → spec → plan → implement 的 **新功能** 工作流

---

## 2. 三层文档模型

```
Layer 0  Canonical      docs/product/PRODUCT-SPEC.md · docs/tech/*
Layer 1  Consolidated   docs/superpowers/topics/*.md
Layer 2  Archive        docs/superpowers/archive/specs/** · archive/plans/**
         Active         docs/superpowers/specs/** · plans/**  （进行中 / 单次 ADR）
```

### 2.1 Layer 0 — Canonical

改产品行为或跨模块契约时 **先读**。已有上收范例：

- PWA 安装 → `docs/tech/13-pwa-install-architecture.md`
- 本地图片 → `docs/tech/12-local-image-storage-design.md`
- 日志 → `docs/superpowers/specs/2026-06-06-logging-design.md`（tech README ADR 索引）

**规则：** 若主题已有 tech numbered doc 且与 PRODUCT-SPEC 一致，**终稿指向 tech**，superpowers 该主题只留 stub + archive。

### 2.2 Layer 1 — Consolidated topics

每个 **已完成、多 spec 迭代** 的主题一篇终稿，结构固定：

1. **Summary** — 3–5 句当前行为
2. **Canonical links** — PRODUCT-SPEC §、docs/tech
3. **Decisions** — 按模块分节，只写 **现行** 决策
4. **Decision log** — 表格：日期 | 旧 spec 路径 | 取代关系
5. **Out of scope / 已知缺口** — 可选
6. **Archive index** — 指向 `archive/` 下原文件列表

### 2.3 Layer 2 — Archive

- 已 superseded 且已并入终稿的 spec → `archive/specs/YYYY-MM-DD-*.md`（**保留原文件名**）
- 已执行完毕的 plan → `archive/plans/YYYY-MM-DD-*.md`
- Git history 保留；移动用 `git mv`

### 2.4 Active specs/plans

保留在 `specs/`、`plans/` 当且仅当：

- 功能 **未** 在 PRODUCT-SPEC §12 标完成，或
- 单次小 ADR（< ~30 行、无 supersede 链），或
- 正在进行 brainstorm/plan/execute

---

## 3. 合并准入条件

四条 **全部** 满足才从 active → consolidated + archive：

| # | 条件 |
|---|------|
| 1 | PRODUCT-SPEC §12 或等价记录标 **已上线** |
| 2 | supersede 链可解析出 **唯一现行行为** |
| 3 | 无 open plan 依赖该 spec 的 **active** 路径 |
| 4 | 终稿含 **Decision log**，且至少一名维护者（或 Agent）核对与代码一致 |

---

## 4. Phase 1 主题清单（优先合并）

| Topic ID | 终稿路径 | 约略 active 篇数 | Canonical 上收 |
|----------|----------|------------------|----------------|
| `onboarding-aha` | `topics/onboarding-aha-design.md` | ~20 | PRODUCT-SPEC § onboarding / 门控 |
| `home-dashboard` | `topics/home-dashboard-design.md` | ~15 | PRODUCT-SPEC §2.1 布局、Widget |
| `export-pipeline` | `topics/export-pipeline-design.md` | ~12 | `docs/tech/08-export.md` |
| `delete-account` | `topics/delete-account-design.md` | 3 | PRODUCT-SPEC § 合规 / 删除 |
| `receipt-sync-lifecycle` | `topics/receipt-sync-lifecycle-design.md` | ~8 | `docs/tech/06-*`、OCR pipeline |
| `pwa-install` | —（不上收新 topics 文件） | ~8 | **`docs/tech/13-pwa-install-architecture.md`** |

**Phase 2（扫尾）：** camera footer 链、navigation/history、founder widget、compliance 子 spec、其余含 `supersedes` 标记的 ~26 篇。

**不合并（保持 active 或仅索引）：** foundation ADR（auth、paddle、db、logging、api-security）、单行 UI tweak spec、进行中的 2026-07 功能。

---

## 5. 归档操作规范

### 5.1 目录结构（新增）

```
docs/superpowers/
  README.md                 # 主索引：主题 → Layer 0/1/2
  topics/
    onboarding-aha-design.md
    home-dashboard-design.md
    ...
  archive/
    specs/                  # git mv 自 specs/
    plans/                  # git mv 自 plans/
  specs/                    # 仅 active
  plans/                    # 仅 active
```

### 5.2 Stub 格式（原路径保留）

原 `docs/superpowers/specs/2026-06-14-onboarding-hero-countdown-design.md` **替换为**：

```markdown
# [Archived] Onboarding hero countdown

> **Status:** Archived · superseded by consolidated topic spec  
> **Current truth:** [onboarding-aha-design.md](../topics/onboarding-aha-design.md)  
> **Full text:** [archive/specs/2026-06-14-onboarding-hero-countdown-design.md](../archive/specs/2026-06-14-onboarding-hero-countdown-design.md)

Do not use this stub for implementation decisions.
```

- stub **≤ 10 行**，无决策正文
- plan 同理：`Current truth` 可指向 topic 或 `Implemented (archived plan)`

### 5.3 引用更新策略

| 引用来源 | 动作 |
|----------|------|
| `docs/product/README.md`、`docs/tech/README.md` | 指向 `topics/*` 或 Layer 0 |
| `AGENTS.md`、`.cursor/rules/*.mdc` | 只链 Layer 0 + 相关 `topics/*`；去掉长 superpowers 列表 |
| plan 内 `**Spec:**` | 归档时改指向 topic 或 stub |
| 其他 spec 内 cross-ref | 批量 grep；优先改 **active** spec；archive 内不改 |
| Git commit message | 不要求改历史 |

**工具：** `rg 'docs/superpowers/specs/<basename>'`  per 移动文件；CI 可选 `scripts/check-doc-links.mjs`（Phase 2）。

### 5.4 Plan 生命周期

```
plans/active  →  execute  →  git mv to archive/plans/
                         →  topic 终稿加行：Implemented: archive/plans/...
```

未执行或部分执行的 plan **留 active**，topic 终稿 Decision log 注明「部分落地见 active plan X」。

---

## 6. Agent / 新人读法（写入 README 与 AGENTS）

| 场景 | 阅读顺序 |
|------|----------|
| 改产品行为 | `PRODUCT-SPEC` → 相关 `docs/tech/*` |
| 改某主题实现 | `docs/superpowers/topics/<topic>-design.md` |
| 新功能 | 仍新建 `specs/YYYY-MM-DD-*-design.md`；完成后按 §3 准入归档 |
| 考古 / 审计 | 仅当显式要求时读 `archive/` |
| **禁止** | 默认遍历 `specs/` 全目录 |

`docs/superpowers/README.md` 必含：

- 三层模型图（ASCII）
- Phase 1 主题表 + 链接
- 「Active specs 计数」与「Last consolidated」日期
- 新 spec 完成后的 **归档 checklist**（§3 四条 + stub + 引用 grep）

---

## 7. 分阶段执行计划

### Phase 0 — 分类（~0.5d，无内容合并）

1. 新增 `docs/superpowers/README.md` 骨架
2. 生成 `docs/superpowers/MANIFEST.csv`（可选）：`path, topic, layer, status, supersedes, canonical_ref`
3. 对 218 文件打标：`canonical-ref | consolidate | archive-only | keep-active`
4. 更新 `docs/product/README.md`：superpowers 降为「主题终稿 / 归档」说明

**产出：** 可执行的 Phase 1 文件列表；**不**移动任何 spec。

### Phase 1 — 五主题终稿 + 归档（~2–3d）

按顺序（依赖少 → 多）：

1. **delete-account**（3 篇，链短）
2. **export-pipeline**（对齐 `docs/tech/08-export.md`）
3. **onboarding-aha**（最大收益）
4. **home-dashboard**
5. **receipt-sync-lifecycle**
6. **pwa-install** — 仅 stub 指向 `tech/13`，移 archive，**不写** topics 重复文

每主题 PR 原子步骤：

1. 写 `topics/<topic>-design.md`
2. `git mv` 旧 spec/plan → `archive/`
3. 原路径写 stub
4. `rg` 更新引用
5. README 更新该主题状态

### Phase 2 — 扫尾 + 工具（~1–2d）

- 其余 `supersedes` 链并入已有 topic 或新建小 topic
- 可选：`scripts/check-doc-links.mjs` 在 `npm run lint:docs` 或 CI
- PRODUCT-SPEC §13 Agent 检查清单加一条：「改 X 前先读 topics/X」

### Phase 3 — 维护制度

- 新 spec **merge 前**：若属已有 topic，更新 topic 终稿 + Decision log，旧 spec 走 archive
- 季度：MANIFEST 复核 active 计数

---

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| Stub 遗漏导致 Agent 仍读空壳 | stub 首行 `[Archived]` + README 禁止默认扫 specs |
| 终稿与代码漂移 | 准入条件 #4；改代码时同 PR 更新 topic |
| 合并 onboarding 丢细节 | Decision log + archive 全文；终稿只保留 **行为** 不删 **约束** |
| 大 PR 难 review | **一主题一 PR** |
| plan 与 spec 路径断裂 | 归档 plan 时同步 stub；topic 列 Implemented 链接 |

---

## 9. 成功标准

| 指标 | 目标 |
|------|------|
| Agent 入口文档数（改 onboarding） | 1 topic + PRODUCT-SPEC，**非** 20 spec |
| Active specs 数 | Phase 1 后 ≤ 100（−50 量级） |
| 断链 | `rg` 扫移动 basename 零未更新 **active** 引用 |
| 新人路径 | `docs/product/README.md` → topic 或 tech，≤ 3 跳 |

---

## 10. 不在此次范围

- 合并 `docs/prd/`、`docs/ui/`
- 重写 PRODUCT-SPEC 全文
- 自动 LLM 摘要生成终稿（人工核对为准）
- 删除 git 历史或 archive 文件

---

## 11. 下一步

1. 用户确认本 spec
2. 执行 **Phase 0**（MANIFEST + README）
3. 按 Phase 1 顺序开 PR；**不**与功能代码混 PR
4. 实现计划见：[`docs/superpowers/plans/2026-07-07-superpowers-doc-consolidation.md`](../plans/2026-07-07-superpowers-doc-consolidation.md)
