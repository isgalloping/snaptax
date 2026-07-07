# Snap1099 / SnapTax 产品文档索引

新人或 Agent 请按此顺序阅读：

| 优先级 | 文档 | 用途 |
|--------|------|------|
| **1** | [PRODUCT-SPEC.md](./PRODUCT-SPEC.md) | **产品规范 v1.2（canonical）** — 含 EU/US 合规、PWA 安装、U2 UI、数据库摘要 |
| **2** | [../tech/13-pwa-install-architecture.md](../tech/13-pwa-install-architecture.md) | **PWA 安装 / 营销 vs `/app`** — 改 install、manifest、CTA 必读 |
| **3** | [../legal/](../legal/privacy.md) | 隐私政策 · 服务条款 |
| **4** | [../tech/README.md](../tech/README.md) | **技术文档** — 全栈架构、API、部署 |
| 5 | [../prd/0.0.1.md](../prd/0.0.1.md) | 完整 PRD（§2.5 合规） |
| 6 | [../superpowers/specs/2026-06-12-new-user-onboarding-design.md](../superpowers/specs/2026-06-12-new-user-onboarding-design.md) | **新人引导** — T1/T2 Google 软引导 |
| 7 | [../superpowers/specs/2026-07-06-pwa-snaptax-label-app-entry-gate-design.md](../superpowers/specs/2026-07-06-pwa-snaptax-label-app-entry-gate-design.md) | PWA SnapTax 图标 + `/app` 门控 ADR |
| 8 | [../superpowers/specs/2026-06-05-compliance-privacy-design.md](../superpowers/specs/2026-06-05-compliance-privacy-design.md) | 合规与隐私 ADR |
| 9 | [../ui/ui.html](../ui/ui.html) | 主界面静态视觉参考 |

## Agent / 自动化

- **Cursor Rule**：`.cursor/rules/snap1099-product.mdc`（全局产品铁律）
- **Cursor Rule**：`.cursor/rules/snap1099-pwa.mdc`（PWA / install；globs `components/pwa/**` 等）
- **Cursor Rule**：`.cursor/rules/snap1099-ui.mdc`（UI 组件约束）
- **Cursor Rule**：`.cursor/rules/snap1099-backend.mdc`（API / Prisma / 集成）
- **Cursor Rule**：`.cursor/rules/snap1099-database.mdc`（改表 / DDL / Prisma）
- **Cursor Rule**：`.cursor/rules/snap1099-compliance.mdc`（合规 / 隐私 UI）
- **Cursor Rule**：`.cursor/rules/snap1099-logging.mdc`（单行 key=value 日志）
- **Cursor Rule**：`.cursor/rules/snap1099-tax.mdc`（US/EU 省税 · OpenAI 路径）
- **Cursor Skill**：`.cursor/skills/snap1099-product/SKILL.md`（功能开发前必读流程）

**MVP 落地：** [`docs/superpowers/plans/2026-06-07-mvp-master-implementation.md`](../superpowers/plans/2026-06-07-mvp-master-implementation.md)

## 实现状态

以 **PRODUCT-SPEC §12** 为准（2026-07-07 起含营销/PWA 拆分与 SnapTax 安装门控）。改功能前核对 §12 与 §13 Agent 检查清单。
