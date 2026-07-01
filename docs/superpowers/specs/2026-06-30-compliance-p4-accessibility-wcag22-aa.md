# Compliance P4 — Accessibility (WCAG 2.2 AA)

**Date:** 2026-06-30  
**Status:** Approved (design)  
**Parent:** [`2026-06-30-compliance-master-matrix.md`](./2026-06-30-compliance-master-matrix.md)  
**Milestone:** M3

---

## 1. Goal

核心用户路径达到 **WCAG 2.2 Level AA**（PRODUCT 配色保持 AAA 对比度作为加分项，不替代 AA 程序）。

---

## 2. Scope — critical paths

1. 启动 / Ghost → 主界面  
2. Snap → 相机 → 快门 → 列表更新  
3. 小票详情 Sheet（查看 / 删除 / resnap）  
4. Settings → Privacy & Data → Legal Sheet  
5. Export 门控 → Paywall → 下载  
6. Delete Account 确认 Sheet  

**Out of scope M3:** Marketing landing 次要页（/help 仍应 AA，可 M3.1）

---

## 3. Requirements mapping

| WCAG 2.2 主题 | Snap1099 动作 |
|---------------|---------------|
| **1.4.3 Contrast (AA)** | 黑/白/黄已 AAA；审查 zinc 副文案 |
| **1.4.4 Resize text** | 支持 200% zoom 无横向 scroll（核心路径） |
| **1.4.11 Non-text contrast** | 图标按钮边界 |
| **2.1 Keyboard** | Snap、Settings、Export、Sheet 关闭、列表项 |
| **2.4 Focus visible** | 黄 focus ring · 禁 `outline-none` 无替代 |
| **2.5.8 Target size** | 热区 ≥44px（PRODUCT ≥64px 核心） |
| **4.1.2 Name, Role, Value** | 补全 `aria-label` / `aria-live`（processing、export 错误） |
| **2.3.3 Motion** | `prefers-reduced-motion`（widget cover 已有部分） |

---

## 4. Process

1. **Baseline audit:** axe-core CLI + VoiceOver (iOS Safari PWA) + Keyboard-only pass  
2. **VPAT-lite:** 1 页摘要存 `docs/accessibility/WCAG-22-AA-summary.md`  
3. **Fix waves:** P0 阻断 → P1 核心 → P2 余量  
4. **Regression:** CI optional `axe` on Storybook/关键 route（M3 末期）

---

## 5. Deliverables

- Audit issue list（GitHub labels `a11y`）  
- `docs/accessibility/WCAG-22-AA-summary.md`  
- PRODUCT-SPEC 新增 § Accessibility 实现状态  

---

## 6. Acceptance

1. 核心路径 axe **0 critical / 0 serious**  
2. 键盘可完成 Snap + Export + Delete Account  
3. Screen reader 可读 Est. Tax Saved 与 receipt status  
4. `prefers-reduced-motion` 关闭 widget 动画
