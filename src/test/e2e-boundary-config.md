# Task 10 E2E 边界配置单元测试用例

## 测试文件

`e2e-boundary-config.test.ts`

## 测试目的

验证 Vite 的 Clerk/Convex 测试替换只能在专用 E2E 服务器标志下启用，普通开发和生产构建不会携带活动测试边界。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| EC-01 | 普通 Vite 模式只保留应用源码别名 | 安全配置测试 |
| EC-02 | e2e mode 缺少服务器标志时立即失败 | 异常测试 |
| EC-03 | e2e 开发服务精确替换 Clerk、Convex、PWA 和 Vercel 遥测客户端边界 | 正向配置测试 |
| EC-04 | 即使设置测试标志，生产构建也拒绝 e2e 边界 | 生产安全测试 |
| EC-05 | 普通生产构建忽略服务器测试标志且不引用 mock | Tree-shaking/安全测试 |

## 详细测试步骤

### EC-01: 普通模式无测试包替换

**测试目的**: 防止测试 Clerk/Convex 边界进入普通开发或生产构建。

**准备数据**:
- 清除 `ROUTE_LEDGER_E2E`。
- 使用 mode `development`。

**测试步骤**:
1. 解析 Vite 配置函数。
2. 读取 resolve aliases。

**预期结果**:
- 包含 `@` 源码别名。
- 不包含 Clerk、Convex 或 PWA registration 测试替换。
- 所有替换路径都不引用 `src/test/mocks`。

### EC-02: 缺少专用标志时拒绝 e2e mode

**测试目的**: 防止 Playwright 误接入普通 live-provider Vite 服务。

**准备数据**:
- 清除 `ROUTE_LEDGER_E2E`。
- 使用 mode `e2e`。

**测试步骤**:
1. 解析 Vite 配置。

**预期结果**:
- 明确抛出要求 `ROUTE_LEDGER_E2E=1` 的错误。

### EC-03: 精确客户端边界替换

**测试目的**: 仅替换浏览器外部服务边界，保留 `convex/server`、生成函数引用、真实路由、页面、组件和 hooks。

**准备数据**:
- 设置 `ROUTE_LEDGER_E2E=1`。
- 使用 `serve` 命令和 mode `e2e`。

**测试步骤**:
1. 解析 Vite 配置。
2. 匹配别名 find 表达式。

**预期结果**:
- 精确包含 `@clerk/clerk-react`、`convex/react`、`convex/react-clerk`、`virtual:pwa-register/react`、`@vercel/analytics/react` 和 `@vercel/speed-insights/react`。
- Vercel 遥测在 E2E 服务中渲染为空，不产生外部 HTTP 请求。
- 不包含 `convex/server`。

### EC-04: 生产构建拒绝测试边界

**测试目的**: 防止通过 `vite build --mode e2e` 把测试身份、测试数据或 service-worker mock 打入生产包。

**准备数据**:
- 设置 `ROUTE_LEDGER_E2E=1`。
- 使用 `build` 命令和 mode `e2e`。

**测试步骤**:
1. 解析 Vite 配置。
2. 捕获配置错误。

**预期结果**:
- 配置明确拒绝生产构建或 preview 使用测试边界。
- 不生成带测试别名的生产配置。

### EC-05: 普通生产构建忽略测试标志

**测试目的**: 证明单独设置服务器环境标志不足以激活边界，必须同时使用专用 e2e 开发服务 mode。

**准备数据**:
- 设置 `ROUTE_LEDGER_E2E=1`。
- 使用 `build` 命令和 mode `production`。

**测试步骤**:
1. 解析生产配置。
2. 检查别名替换路径和客户端 define。

**预期结果**:
- 仅保留 `@` 源码别名。
- 不引用 `src/test/mocks`。
- 不把服务器测试标志通过 `define` 暴露给浏览器。

## 测试注意事项

### Mock 策略

不 mock Vite 配置；直接调用导出的配置函数。

### 边界条件

E2E 标志是服务器进程环境变量，不使用 `VITE_` 前缀，因此不会暴露到浏览器代码。只有非 preview 的 `vite serve --mode e2e` 同时收到该标志时才允许别名；任何 build 都不能激活边界。

### 异步操作

无异步计时行为。
