# Superpowers 文档索引

> **不要**默认遍历 `specs/` 全目录。先读 Layer 0，再读相关 topic 终稿。

## 三层模型

```
Layer 0  Canonical     docs/product/PRODUCT-SPEC.md · docs/tech/*
Layer 1  Consolidated   docs/superpowers/topics/*.md
Layer 2  Archive        docs/superpowers/archive/**
         Active         docs/superpowers/specs/ · plans/  （进行中 ADR）
```

## Phase 1 主题（合并目标）

| Topic | 终稿 | Canonical |
|-------|------|-----------|
| onboarding-aha | [topics/onboarding-aha-design.md](./topics/onboarding-aha-design.md) · consolidated 2026-07-08 | PRODUCT-SPEC §12 蓝领新人引导 |
| home-dashboard | [topics/home-dashboard-design.md](./topics/home-dashboard-design.md) · consolidated 2026-07-08 | PRODUCT-SPEC §2.1 布局 |
| export-pipeline | [topics/export-pipeline-design.md](./topics/export-pipeline-design.md) · consolidated 2026-07-08 | [docs/tech/08-export.md](../tech/08-export.md) |
| delete-account | [topics/delete-account-design.md](./topics/delete-account-design.md) · consolidated 2026-07-08 | PRODUCT-SPEC § 合规 |
| receipt-sync-lifecycle | [topics/receipt-sync-lifecycle-design.md](./topics/receipt-sync-lifecycle-design.md) · consolidated 2026-07-08 | docs/tech/06-* · [11-ocr-pipeline-design.md](../tech/11-ocr-pipeline-design.md) |
| pwa-install | — | **[docs/tech/13-pwa-install-architecture.md](../tech/13-pwa-install-architecture.md)** · archived 2026-07-08 |

Status: Phase 0 complete · Phase 1 complete · Phase 2 complete · See [MANIFEST.csv](./MANIFEST.csv) (325 entries) · `npm run lint:docs`

## Agent 读法

| 场景 | 读什么 |
|------|--------|
| 改产品行为 | PRODUCT-SPEC → docs/tech |
| 改主题实现 | `topics/<topic>-design.md` |
| 新功能 | 新建 `specs/YYYY-MM-DD-*-design.md` |
| 考古 | `archive/`（显式要求时） |

## 归档 checklist（feature 完成后）

1. PRODUCT-SPEC §12 ✅
2. supersede 链有唯一现行行为
3. 无 open plan 依赖 active spec 路径
4. 写/更新 `topics/<topic>-design.md` + Decision log
5. `git mv` spec/plan → `archive/`
6. 原路径写 stub（见 design spec §5.2）
7. `rg` 更新引用；更新本 README 状态
8. `npm run lint:docs` 通过

**Design:** [specs/2026-07-07-superpowers-doc-consolidation-design.md](./specs/2026-07-07-superpowers-doc-consolidation-design.md)  
**Plan:** [plans/2026-07-07-superpowers-doc-consolidation.md](./plans/2026-07-07-superpowers-doc-consolidation.md)
