# 响应式导航和几何 E2E 测试用例

## 测试文件

`responsive.spec.ts`

## 测试目的

分别在桌面 Chromium 与移动 Chromium 项目验证命名导航模型、移动 sheet 焦点、320/393px 功能页面以及 390×844 landing/auth/dashboard 无水平溢出、对话框 containment、Escape 焦点恢复和 44px 最小触控目标。项目 grep 确保移动专用用例不会以 skip 形式出现在桌面结果中。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| E2E-RWD-01 | 桌面侧栏及 rail toggle 使用正确语义 | 桌面响应测试 |
| E2E-RWD-02 | 移动底栏和命名 sheet 导航并移动焦点 | 移动/可访问性测试 |
| E2E-RWD-03 | 393px 与 320px 功能页面无水平溢出 | 移动几何测试 |
| E2E-RWD-04 | 对话框 containment、Escape 焦点和 44px 目标 | 移动可访问性测试 |
| E2E-RWD-05 | 390×844 landing/auth/dashboard 无溢出且主操作至少 44px | 启动恢复几何测试 |

## 详细测试步骤

### E2E-RWD-01: 桌面导航 rail

**测试目的**: 验证桌面布局使用命名 complementary rail 和内部导航，并可在不卸载主内容的情况下关闭。

**准备数据**:
- `desktop-chromium`，1440×900。
- 管理员场景（同时满足普通认证导航数据）。

**测试步骤**:
1. 打开首页。
2. 检查 `Journey navigation` complementary 和 `Journey views` navigation。
3. 检查移动导航隐藏。
4. 点击 `Close navigation rail`。

**预期结果**:
- 桌面 rail 初始可见。
- 关闭后 rail 隐藏、main 保持可见，并出现 `Open navigation rail`。

### E2E-RWD-02: 移动导航和焦点

**测试目的**: 验证移动底栏、菜单 disclosure、命名 sheet、内部 Primary navigation 和焦点 containment。

**准备数据**:
- `mobile-chromium` Pixel 5 项目。
- 管理员场景，用于验证 Admin 可见性。

**测试步骤**:
1. 打开首页并检查桌面 rail 隐藏、Mobile navigation 可见。
2. 点击 `Open navigation menu` 并检查 `aria-expanded=true`。
3. 检查命名 dialog、Primary navigation 和 Admin 链接。
4. 确认 activeElement 位于 sheet 内。
5. 点击 Templates。

**预期结果**:
- Sheet 打开后焦点进入其中。
- 选择 Templates 后 sheet 关闭，URL 为 `/templates`。
- 底栏 Templates 链接具有 `aria-current=page`。

### E2E-RWD-03: 移动宽度无溢出

**测试目的**: 验证核心页面在 Pixel 5 宽度与 320px 宽度下不会产生横向页面滚动。

**准备数据**:
- 移动项目。
- 宽度 393 和 320，高度 844。

**测试步骤**:
1. 依次设置两个 viewport 宽度。
2. 对 `/`、列表详情、Settings 和 Admin 直接加载。
3. 每次计算 `documentElement.scrollWidth <= innerWidth`。

**预期结果**:
- 所有页面在两个宽度下均无水平溢出。

### E2E-RWD-04: 对话框、焦点和目标尺寸

**测试目的**: 验证窄屏关键对话框位于 viewport 内，Escape 恢复焦点，并确保导航、打包复选框、分类/条目拖动手柄、排序/表单选择器和图标操作均达到 44px 最小触控面积。

**准备数据**:
- 320×844 移动 viewport。
- Alpine、Weekend Getaway 和 legacy fixture。

**测试步骤**:
1. 测量产品首页链接和底栏 Lists 链接。
2. 在列表详情测量打包复选框、分类拖动手柄、条目拖动手柄、折叠按钮、编辑和数量图标操作。
3. 打开物品编辑对话框，测量 Priority 表单选择器，检查 containment，Escape 关闭。
4. 打开列表总览并测量排序选择器。
5. 打开模板预览，重复 containment 和焦点恢复。
6. 写入 legacy 数据，打开迁移审阅对话框，检查 containment/无溢出并关闭。
7. 返回列表并增加 Insulated jacket 数量。

**预期结果**:
- 导航、复选框、拖动手柄、选择器和图标操作全部至少 44×44px。
- 三个对话框边界均在 viewport 内。
- 每次 Escape 后焦点回到原触发器。
- 数量增加后显示 `Quantity 2`。

### E2E-RWD-05: 390×844 启动、认证和 dashboard 恢复

**测试目的**: 在任务指定的 390×844 viewport 逐一验证公开 landing、Clerk sign-in splat 和已登录 dashboard 的页面宽度与主要操作目标。

**准备数据**:
- 390×844 移动 viewport。
- 初始 `signedOutScenario()`，随后通过现有测试控制边界切换为确定性已登录身份。

**测试步骤**:
1. 打开 `/`，检查友好 landing h1、无水平溢出，并测量 `Create a list` 与主区 `Sign in`。
2. 直接打开 `/sign-in/factor-two`，检查 sign-in h1、无水平溢出，并测量 `Continue as test user`。
3. 通过既有 runtime control 解析为已登录，重新打开 `/`。
4. 检查 `My packing lists`、无水平溢出，并测量 `Create new list`。

**预期结果**:
- 三个恢复后的表面均满足 `documentElement.scrollWidth <= innerWidth`。
- landing 两个主链接、认证主按钮和 dashboard 新建按钮均至少 44×44px。

## 测试注意事项

### Mock 策略

使用确定性管理员场景覆盖认证后导航/功能表面，并使用未登录场景覆盖 landing/auth 后再通过既有 runtime control 切换为已登录 dashboard；页面、导航、Radix 对话框和响应式 CSS 为真实实现。

### 边界条件

几何断言允许 1px 小数舍入误差。移动专用标题含 `@mobile`，由 Playwright 项目 grep 选择，不使用 `.skip`。

### 异步操作

使用 bounding box、自动重试轮询和语义定位；不使用截图基线、hover 前提或任意等待。
