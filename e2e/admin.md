# 管理员守卫 E2E 测试用例

## 测试文件

`admin.spec.ts`

## 测试目的

验证相同 Clerk 登录形态下，服务端确认的常规用户角色不能挂载管理员后代，而管理员角色可直接加载控制台、读取固定指标并使用真实导航操作。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| E2E-ADM-01 | 常规用户不能挂载管理员后代 | 异常/守卫测试 |
| E2E-ADM-02 | 管理员可读取指标并导航模板库 | 正向测试 |

## 详细测试步骤

### E2E-ADM-01: 常规用户拒绝

**测试目的**: 确认 Clerk 已登录不等于管理员授权，访问查询未解析和最终拒绝期间都不渲染任何特权后代。

**准备数据**:
- `regularUserScenario()`，用户已登录但 Convex 角色为 `user`。
- `users:getCurrentAccess` 初始保持加载态。

**测试步骤**:
1. 导航前安装 `[data-admin-page]` mount sentinel。
2. 直接打开 `/admin`。
3. 检查 `Checking administrator access` 状态，确认 Admin dashboard 和 Administration tablist 不存在。
4. 显式解析访问查询。
5. 检查拒绝一级标题、Admin 链接和管理员页面仍不存在。

**预期结果**:
- 未解析时只显示访问检查状态。
- 解析后显示 `Administrator access required`。
- mount sentinel 始终为 false，管理员控制台和特权内容从未挂载。

### E2E-ADM-02: 管理员控制台

**测试目的**: 验证管理员角色可进入真实控制台、读取确定性指标并从快捷操作导航。

**准备数据**:
- `adminScenario()`。
- 固定指标：12 users、34 lists、8 templates、Healthy。

**测试步骤**:
1. 直接打开 `/admin`。
2. 检查 `Admin dashboard`、Breadcrumb 的 Admin 文本和命名 tablist。
3. 检查四个固定指标。
4. 点击 `Manage templates`。
5. 检查模板库后使用浏览器返回。

**预期结果**:
- 控制台唯一一级标题、`data-admin-page` 挂载标记及固定指标可见。
- 导航到 `/templates` 后可返回 `/admin`，控制台仍正常显示。

## 测试注意事项

### Mock 策略

只在客户端边界注入不同 Convex 用户角色；Clerk 登录状态保持相同。管理 API 的真正强制授权由 `convex/admin.authorization.test.ts` 验证。

### 边界条件

常规用户拒绝时不得出现特权 tabpanel 或指标；管理员状态必须来自服务器查询而非浏览器邮箱或 metadata。

### 异步操作

等待守卫解析后的语义标题和 tablist，不使用固定延迟。
