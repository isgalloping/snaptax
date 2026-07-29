# App Navigation History — Topic Design

**Topic ID:** `app-navigation-history`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-08

---

## 1. Summary

全屏子流程（Home overlay、Settings 子页）的返回行为与 **浏览器 History API** 同步，使 **`< BACK` 按钮 · 应用内左右滑 · Android 系统返回** 均调用同一管道 `navigateBack()` → `history.back()` → `popstate` 更新 React 状态，避免 PWA 单条目历史导致 **一次返回即退出应用**。

**Swipe-back（2026-06-18）：** `useSwipeBack` 检测水平滑动手势（`|dx| ≥ 60` 且水平主导）；左右滑均触发 `onBack`。Shell 层挂载于 `OverlayShell` / `SettingsSubPageShell`。

**History sync（2026-06-19）：** 前进 `pushState({ snap1099: key })`；根屏 **trap**（双 `home` 条目）使首次系统返回不退出；第二次允许退出。

**Out of scope：** Bottom Sheet（Camera / Paywall / Legal 等）· WidgetPager 横向分页 · `/help` 路由。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | 2 逻辑页 · `< BACK` 模式 |
| [`lib/client/appNavigationHistory.ts`](../../../lib/client/appNavigationHistory.ts) | encode/decode · trap · dedupe |
| [`lib/client/useAppNavigation.ts`](../../../lib/client/useAppNavigation.ts) | bootstrap · pushScreen · navigateBack |
| [`lib/client/useSwipeBack.ts`](../../../lib/client/useSwipeBack.ts) | 手势检测 |
| [`components/home/HomeScreen.tsx`](../../../components/home/HomeScreen.tsx) | overlay + view 同步 |
| [`components/settings/SettingsScreen.tsx`](../../../components/settings/SettingsScreen.tsx) | viewState 同步 |
| [`components/home/overlays/OverlayShell.tsx`](../../../components/home/overlays/OverlayShell.tsx) | swipe + navigateBack |
| [`components/settings/SettingsSubPageShell.tsx`](../../../components/settings/SettingsSubPageShell.tsx) | swipe + navigateBack |
| [`docs/superpowers/topics/home-dashboard-design.md`](./home-dashboard-design.md) | Home exit confirm（builds on nav trap） |

---

## 3. Decisions

### 3.1 Swipe-back scope & gesture

| Decision | Detail |
|----------|--------|
| **范围** | 全屏子流程 only；Home 主屏 · Widget pager · Settings 根 · Sheet 排除 |
| **方向** | 左滑 **或** 右滑均触发 back |
| **阈值** | `\|dx\| ≥ 60px` 且 `\|dx\| > \|dy\| × 1.5` |
| **频率** | 每手势最多一次 `onBack`（`touchend`） |
| **滚动** | 垂直主导移动不 preventDefault |

### 3.2 History sync bridge

| Decision | Detail |
|----------|--------|
| **State key** | `history.state.snap1099` 字符串 |
| **Back pipeline** | 所有 BACK / swipe / system back → **`navigateBack()`** → `history.back()` |
| **Forward** | `pushScreen(key)`；`shouldPushNavKey` 去重 |
| **Bootstrap** | `replaceState(home)` + `pushState(home)` trap |
| **Root trap** | 首次 back 在 Home 不退出；第二次可退出 PWA |
| **Settings root back** | `settings:main` back → Home (`view=home`) |
| **Anti-loop** | `navigatingRef` guard · 有向图 · 无任意 stack |

### 3.3 Navigation state graph

```text
home (root + trap)
├── overlay:privacy-trust | deadline-detail | tax-year-detail | missing-deductions
│     └── overlay:missing-deduction-item:{hintId}
└── settings
      ├── settings:main
      └── settings:language | industry | notifications | privacy-center
            | sample-export | export-completed
```

### 3.4 SnapNavKey encoding

| Key pattern | React action |
|-------------|--------------|
| `home` | `setHomeOverlay(null)`; `setView("home")` |
| `overlay:*` | `setHomeOverlay(...)` |
| `settings` | `setView("settings")`; `viewState=main` |
| `settings:*` | `setView("settings")`; `viewState=page` |

### 3.5 In-scope surfaces

**Home overlays:** privacy-trust · deadline-detail · tax-year-detail · missing-deductions · missing-deduction-item（item back → list）

**Settings sub-pages:** language · industry · notifications · privacy-center · sample-export · export-completed

**export-completed side effects:** 在 `popstate` 离开该页时执行（等同原 `handleHeaderBack`）

---

## 4. Architecture

```text
appNavigationHistory.ts  (pure encode/decode/trap)
        ↓
useAppNavigation.ts      (bootstrap, pushScreen, navigateBack, popstate)
        ↓
HomeScreen / SettingsScreen
        ↓
OverlayShell / SettingsSubPageShell
  useSwipeBack({ onBack: navigateBack })
```

---

## 5. Decision log

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-18 | `archive/specs/2026-06-18-swipe-back-navigation-design.md` | **this topic** §3.1 (gesture); back execution → §3.2 |
| 2026-06-19 | `archive/specs/2026-06-19-app-navigation-history-design.md` | **this topic** §3.2–3.4 (History sync) |

**Partial supersede:** swipe-back spec 的手势规则仍有效；**返回执行**必须由 History sync 统一（非直接 `setState`）。

---

## 6. Archive index

### Specs (2)

| File | Role |
|------|------|
| [`archive/specs/2026-06-18-swipe-back-navigation-design.md`](../archive/specs/2026-06-18-swipe-back-navigation-design.md) | 双向滑动手势 · Shell 挂载 |
| [`archive/specs/2026-06-19-app-navigation-history-design.md`](../archive/specs/2026-06-19-app-navigation-history-design.md) | History sync · root trap |

### Plans (2)

| Plan | Status |
|------|--------|
| [`archive/plans/2026-06-18-swipe-back-navigation.md`](../archive/plans/2026-06-18-swipe-back-navigation.md) | Done |
| [`archive/plans/2026-06-19-app-navigation-history.md`](../archive/plans/2026-06-19-app-navigation-history.md) | Done |

---

## 7. Implemented plans

- [`archive/plans/2026-06-18-swipe-back-navigation.md`](../archive/plans/2026-06-18-swipe-back-navigation.md) — `useSwipeBack` + Shell 集成
- [`archive/plans/2026-06-19-app-navigation-history.md`](../archive/plans/2026-06-19-app-navigation-history.md) — `appNavigationHistory` + `useAppNavigation` + Home/Settings 接线
