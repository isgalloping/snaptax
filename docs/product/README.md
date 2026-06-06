# Snap1099 产品文档索引

新人或 Agent 请按此顺序阅读：

| 优先级 | 文档 | 用途 |
|--------|------|------|
| **1** | [PRODUCT-SPEC.md](./PRODUCT-SPEC.md) | **产品规范 v1.1（canonical）** — 含 EU/US 合规、分区域数据、U2 UI、数据库摘要 |
| **2** | [../legal/](../legal/privacy.md) | 隐私政策 · 服务条款 |
| **3** | [../tech/README.md](../tech/README.md) | **技术文档** — 全栈架构、API、部署 |
| 4 | [../prd/0.0.1.md](../prd/0.0.1.md) | 完整 PRD（§2.5 合规） |
| 5 | [../superpowers/specs/2026-06-05-compliance-privacy-design.md](../superpowers/specs/2026-06-05-compliance-privacy-design.md) | 合规与隐私 ADR |
| 4 | [../superpowers/specs/2026-06-05-paddle-paywall-design.md](../superpowers/specs/2026-06-05-paddle-paywall-design.md) | Paddle 付费墙 + 换机提醒设计决策 |
| 5 | [../superpowers/specs/2026-06-05-tech-architecture-design.md](../superpowers/specs/2026-06-05-tech-architecture-design.md) | 全栈技术架构 ADR |
| 6 | [../ui/ui.html](../ui/ui.html) | 主界面静态视觉参考 |

## Agent / 自动化

- **Cursor Rule**：`.cursor/rules/snap1099-product.mdc`（全局产品铁律）
- **Cursor Rule**：`.cursor/rules/snap1099-ui.mdc`（UI 组件约束）
- **Cursor Skill**：`.cursor/skills/snap1099-product/SKILL.md`（功能开发前必读流程）

## 代码与 PRD 差距（实现前请核对 PRODUCT-SPEC §实现状态）

当前代码仍为 MVP 原型阶段，部分能力与 PRD 不一致（如手机号注册、Mock 支付）。以 PRD + PRODUCT-SPEC 为准进行对齐。
