# 认证与公开路由 E2E 测试用例

## 测试文件

`auth.spec.ts`

## 测试目的

验证认证未解析时保护后代从未挂载且完整友好首页保持可用，真实十秒 readiness timeout 显示可恢复的 unavailable 状态，Retry 回到 connecting，未登录用户通过普通路由链接进入可访问的登录页面、受保护深链保留完整返回地址、登录/注册嵌套 splat 路由由真实 React Router 路由树处理，以及已登录首页保留友好的 dashboard 标题层级和文案。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| E2E-AUTH-00 | 认证未解析时显示加载状态且保护后代从未挂载 | 加载/守卫测试 |
| E2E-AUTH-01 | 未登录首页通过 `/sign-in` 链接进入可访问的登录页面 | 正向/可访问性测试 |
| E2E-AUTH-02 | 受保护深链登录后返回完整 path/search/hash | 路由集成测试 |
| E2E-AUTH-03 | 登录和注册嵌套 Clerk splat 可直接加载 | 直接路由测试 |
| E2E-AUTH-04 | 完整友好首页经历真实十秒 timeout 并可 Retry 回 connecting | readiness 恢复测试 |
| E2E-AUTH-05 | 已登录首页显示友好 dashboard 标题、文案和统计层级 | 认证后呈现测试 |

## 详细测试步骤

### E2E-AUTH-00: 未解析认证守卫

**测试目的**: 证明 `RequireAuth` 在 Clerk 加载完成前只显示会话检查状态，列表详情即使短暂出现也会被 MutationObserver mount sentinel 记录。

**准备数据**:
- `loadingAuth()` 未解析身份。
- 固定未登录场景和 `/lists/list_alpine` 深链。

**测试步骤**:
1. 导航前安装 `[data-list-detail]` mount sentinel。
2. 直接打开保护深链。
3. 检查 `Checking your session` 状态和列表详情不存在。
4. 显式把测试身份解析为未登录。
5. 检查登录重定向。

**预期结果**:
- 未解析期间只显示加载状态。
- mount sentinel 在解析前后都保持 false。
- 解析为未登录后跳转到保留深链的登录 URL。

### E2E-AUTH-01: 公开首页和登录路由

**测试目的**: 确认未登录首页不挂载认证后导航，并验证主内容区的登录链接进入可访问的 `/sign-in` 页面。

**准备数据**:
- `signedOutScenario()` 固定未登录场景。
- Clerk 使用本地确定性测试边界，不访问真实账户。

**测试步骤**:
1. 直接打开 `/`。
2. 检查唯一一级标题、`main` 和 `Route Ledger home` 链接。
3. 确认认证后 `Journey navigation` 不存在。
4. 检查首页主内容区 `Sign in` 链接的 `href` 为 `/sign-in`，然后点击。
5. 检查 URL 为 `/sign-in`，并显示可访问的 `Sign in` 一级标题和 `Continue as test user` 控件。

**预期结果**:
- 首页公开内容可见且不存在认证后侧栏。
- `Sign in` 是进入 `/sign-in` 的普通路由链接，而不是弹窗触发器。
- 登录页面公开可访问的标题和确定性测试用户控件。

### E2E-AUTH-02: 保护深链登录返回

**测试目的**: 验证真实 `RequireAuth` 保存并恢复路径、查询参数和 hash，且未登录时不会提前挂载保护内容。

**准备数据**:
- 未登录身份。
- 含 `list_alpine` 的固定场景。
- 初始 URL `/lists/list_alpine?status=active#manifest`。

**测试步骤**:
1. 直接打开保护 URL。
2. 检查跳转后的 `redirect_url` 编码值。
3. 确认 Alpine 详情标题尚未出现。
4. 点击 `Continue as test user`。
5. 等待列表详情页。

**预期结果**:
- 未登录时 URL 为 `/sign-in?redirect_url=...`。
- 登录后返回完整 `/lists/list_alpine?status=active#manifest`。
- 返回后真实详情页显示 `Alpine weekend`。

### E2E-AUTH-03: Clerk 嵌套 splat 路由

**测试目的**: 确认 React Router 将嵌套 Clerk 路径交给登录/注册表面而非 404。

**准备数据**:
- 固定未登录身份。

**测试步骤**:
1. 直接打开 `/sign-in/factor-two`。
2. 检查 `Sign in` 一级标题且不存在 404 文案。
3. 直接打开 `/sign-up/verify-email-address`。
4. 检查 `Create account` 一级标题且不存在 404 文案。

**预期结果**:
- 两个嵌套路径均挂载对应 Clerk 测试表面。
- 不显示 `This route is not on the itinerary`。

### E2E-AUTH-04: 公开首页 readiness timeout 与重试

**测试目的**: 证明 unresolved Clerk 输入不会把公开首页替换为空白或全屏阻塞；真实 `AuthReadinessProvider` 在十秒后投影 unavailable，并由生产 Retry 流程重新挂载 provider subtree、回到 connecting。

**准备数据**:
- `unavailableAuth()` 仅提供 `isLoaded=false` 的未解析外部输入；最终 unavailable 状态仍由真实 provider 计时产生。
- Playwright Clock 固定时间并精确快进 10,000ms，不进行真实十秒等待。

**测试步骤**:
1. 安装 Playwright Clock 并打开 `/`。
2. 检查 hero h1、功能标题、示例 checklist 和 `Connecting to authentication`。
3. 快进 10,000ms。
4. 检查 `Authentication is unavailable right now.`、Retry 和完整首页仍可见。
5. 点击 Retry。

**预期结果**:
- timeout 前后首页 hero、功能内容和 checklist 均保持可见。
- 十秒后显示真实 unavailable 恢复控件。
- Retry 后 unavailable 消失，`Connecting to authentication` 重新出现。

### E2E-AUTH-05: 已登录友好 dashboard

**测试目的**: 验证 signed-in bootstrap 完成后首页切换为恢复后的 dashboard，而不是公开 hero、旧运营文案或空白状态。

**准备数据**:
- `regularUserScenario()` 和确定性已登录身份。

**测试步骤**:
1. 直接打开 `/`。
2. 检查 `My packing lists` h1 和友好说明。
3. 检查 `Packing lists` h2 与命名统计 group。

**预期结果**:
- dashboard 使用唯一 h1、清楚的说明、二级列表区标题和可访问统计层级。

## 测试注意事项

### Mock 策略

仅在 Vite e2e 模式替换 Clerk/Convex React 客户端边界；页面、路由守卫和布局均使用真实实现。

### 边界条件

返回地址必须同时保留 pathname、search 和 hash；任何保护内容闪现均视为失败。

### 异步操作

使用角色、URL、自动重试断言和 Playwright Clock；十秒 readiness 验证通过精确快进完成，不使用任意 sleep。
