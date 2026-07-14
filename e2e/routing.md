# 直接路由、刷新和 PWA 状态 E2E 测试用例

## 测试文件

`routing.spec.ts`

## 测试目的

验证 Vite 开发服务器 SPA fallback、列表/设置/管理员/Clerk 嵌套路由直接访问与刷新、未知路由恢复、会话内响应式状态、离线写保护，以及可确定触发的浏览器安装和 PWA 更新提示。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| E2E-ROUTE-01 | 列表详情直接加载并刷新 | 刷新测试 |
| E2E-ROUTE-02 | 设置页直接加载并刷新 | 刷新测试 |
| E2E-ROUTE-03 | 管理员页直接加载并刷新 | 守卫/刷新测试 |
| E2E-ROUTE-04 | 登录和注册嵌套 splat 直接加载并刷新 | Clerk 路由测试 |
| E2E-ROUTE-05 | 未知路由显示 404 并恢复首页 | 404 测试 |
| E2E-ROUTE-06 | 响应式列表变更在刷新后保留 | 会话持久化测试 |
| E2E-ROUTE-07 | 离线状态显示全局提示并禁用写操作 | 离线测试 |
| E2E-ROUTE-08 | 浏览器安装事件显示提示并调用 prompt | PWA 安装测试 |
| E2E-ROUTE-09 | 可用更新请求激活和 reload | PWA 更新测试 |

## 详细测试步骤

### E2E-ROUTE-01: 列表详情直接刷新

**测试目的**: 验证 `/lists/:id` 不依赖首页导航即可加载，并在 reload 后恢复。

**准备数据**:
- 常规用户及 Alpine 列表。

**测试步骤**:
1. 使用 `page.goto` 打开 `/lists/list_alpine`。
2. 检查 `Alpine weekend` 一级标题。
3. 调用 `page.reload()` 并重复检查。

**预期结果**:
- 初始加载和刷新后均显示真实列表详情。

### E2E-ROUTE-02: 设置页直接刷新

**测试目的**: 验证受保护 `/settings` 的 SPA fallback 和路由守卫稳定。

**准备数据**:
- 常规已登录用户。

**测试步骤**:
1. 直接打开 `/settings`。
2. 检查 Settings 一级标题。
3. 刷新并再次检查。

**预期结果**:
- 两次均加载设置页，不出现 404 或登录重定向。

### E2E-ROUTE-03: 管理员页直接刷新

**测试目的**: 验证管理员角色在直接访问和刷新后均通过服务端确认守卫。

**准备数据**:
- 管理员场景。

**测试步骤**:
1. 直接打开 `/admin`。
2. 检查 Admin dashboard。
3. 刷新并再次检查。

**预期结果**:
- 两次均显示管理员控制台。

### E2E-ROUTE-04: Clerk 嵌套路由刷新

**测试目的**: 验证登录和注册 splat 路由的直接访问与刷新。

**准备数据**:
- 未登录身份。

**测试步骤**:
1. 直接打开 `/sign-in/factor-two`，检查标题并刷新。
2. 直接打开 `/sign-up/verify-email-address`，检查标题并刷新。

**预期结果**:
- 两个路径刷新前后均挂载对应 Clerk 表面。

### E2E-ROUTE-05: 未知路由恢复

**测试目的**: 验证未知路径经刷新后仍显示应用 404，并可恢复首页。

**准备数据**:
- 常规已登录用户。

**测试步骤**:
1. 打开 `/removed-next-route`。
2. 检查 itinerary 404 一级标题。
3. 刷新后点击 `Return to Route Ledger`。

**预期结果**:
- 未知路由不崩溃。
- 恢复链接导航到 `/`。

### E2E-ROUTE-06: 会话内刷新持久化

**测试目的**: 验证确定性运行时通过 sessionStorage 模拟 Convex 会话状态，刷新不会回退已确认变更。

**准备数据**:
- Alpine 编辑路由。

**测试步骤**:
1. 将名称改为 `Alpine refresh proof` 并保存。
2. 检查详情标题。
3. 刷新页面并再次检查。

**预期结果**:
- 刷新前后均显示新名称。

### E2E-ROUTE-07: 离线写保护

**测试目的**: 验证浏览器离线事件驱动全局提示和真实页面写控件禁用，且不宣称已验证生产 service worker 缓存。

**准备数据**:
- 在线加载 Alpine 详情后将 Playwright context 切换为 offline。

**测试步骤**:
1. 打开列表详情并等待 Alpine 详情标题，证明页面专用模块已就绪。
2. 设置 context offline 并派发 `offline` 事件。
3. 检查全局状态和列表内重连说明。
4. 检查完成按钮及打包 checkbox。
5. 恢复 context online 并派发 `online` 事件。

**预期结果**:
- 显示完整离线文案和 `Reconnect to save changes to this list.`。
- 持久化操作禁用。
- 不因过早断网而让 Vite 懒加载模块进入错误边界。
- 浏览器控制台无 React hook 警告。

### E2E-ROUTE-08: 安装提示

**测试目的**: 在浏览器可确定控制的边界内验证 `beforeinstallprompt` 处理和用户安装操作。

**准备数据**:
- 已挂载真实根布局。
- 合成可取消 `beforeinstallprompt`，提供可观察的 `prompt()` 和 accepted `userChoice`。

**测试步骤**:
1. 打开首页并等待 `My packing lists` 页面标题，确认安装监听器所在根布局已完成挂载。
2. 派发安装事件。
3. 检查 `Install Route Ledger` 命名 region。
4. 点击 `Install app`。
5. 检查提示消失和 prompt 标志。

**预期结果**:
- 事件被应用捕获并显示安装 UI。
- 点击后调用事件 `prompt()` 且 UI 关闭。

### E2E-ROUTE-09: 更新提示

**测试目的**: 验证测试 PWA 注册边界报告更新时，`Update now` 请求激活并要求 reload。

**准备数据**:
- `needRefresh=true` 的独立场景。

**测试步骤**:
1. 打开首页并检查 `Application update available` region。
2. 点击 `Update now`。
3. 读取 sessionStorage 中的确定性运行时 PWA 状态。

**预期结果**:
- 更新提示关闭。
- `needRefresh=false`、`updateRequested=true`、`reloadRequested=true`。

## 测试注意事项

### Mock 策略

service worker 在 Playwright context 中保持阻止；安装事件和 `virtual:pwa-register/react` 仅在 e2e Vite 模式通过确定性边界控制。生产 preview 缓存和部署 rewrite 属于部署层验证。

### 边界条件

每个直接路由必须通过 `page.goto` 开始，并显式 `page.reload`；更新场景不得污染其他测试。

### 异步操作

使用页面语义、URL、sessionStorage 和自动重试轮询；不使用任意 sleep。
