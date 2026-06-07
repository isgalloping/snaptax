# Receipt Detail Zoom + Processing UI — Design

**Date:** 2026-06-07  
**Status:** Approved  

## Summary

全状态（processing / done / blurry）统一「Original Receipt Capture」图片区；缩略图点击打开全屏 zoom viewer（pinch / pan / 双击 / +/-）。processing 态对齐参考图：Stepper、日期条、加密脚注。

## Decisions

| 主题 | 选择 |
|------|------|
| 范围 | **C** — 全状态详情 + processing 参考图 UI |
| 缩放 | **C** — pinch + 拖动 + 双击 + 底部 +/- 大按钮 |
| 实现 | 方案 1 — 自研 `ReceiptImageZoomViewer`，不引新依赖 |

## Processing 布局

```
[ handle · × Close ]
  🧾 glow
  Calculating your deductions...
  This may take a few seconds.

  [ Stepper: Photo ✓ | Analyzing ⟳ | Calculating ○ ]

  📅 Date Captured: June 7, 2026 at 2:43 PM

  ORIGINAL RECEIPT CAPTURE
  [ object-contain 缩略图 · 可点 zoom ]

  🛡 Your data is encrypted and secure...
```

- syncStuck：hero 文案切换 + Retry 按钮保留
- Stepper：processing 时 step1 ✓、step2 active、step3 pending；blurry 时 step2 failed

## Zoom Viewer

- `z-[60]`，高于 DetailSheet `z-50`
- scale 1×–4×；±0.5× 步进；scale=1 时重置 pan
- 关闭：右上角 ×（背景不关闭，防误触）
- processing 中也可 zoom，不触发 resnap

## 缩略图（Sheet 内）

- 三态统一 `object-contain`，`max-h-52`
- blurry 态去掉 backdrop-blur 遮罩
- 无图：占位文案，不可点

## Files

| 文件 | 动作 |
|------|------|
| `components/receipts/ReceiptImageZoomViewer.tsx` | 新建 |
| `components/receipts/ReceiptImageFullscreen.tsx` | re-export ZoomViewer |
| `components/receipts/ReceiptDetailStepper.tsx` | 新建 |
| `components/receipts/ReceiptCaptureSection.tsx` | 新建 |
| `components/receipts/ReceiptDetailSheet.tsx` | 重构三态 |
| `lib/format.ts` | `formatReceiptDetailLongDateTime` |

## Acceptance

1. 三态均可点图进全屏 zoom
2. pinch / 双击 / +/- 可用
3. processing 含 Stepper + 日期条 + 加密脚注
4. blurry 放大后可辨文字
5. `npx next build` 通过
