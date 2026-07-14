# Task 10 真实路由组件集成测试用例

## 测试文件

`app-journeys.test.tsx`

## 测试目的

通过共享 Clerk/Convex 客户端边界装配真实 `appRoutes`、布局、守卫、功能 hooks、页面和组件，验证关键成功路径及响应式数据传播。后端强制授权仍由 `convex-test` 套件证明。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| AJ-01 | 未登录访问嵌套路由时保留 path/search/hash 并返回原路由 | 认证路由测试 |
| AJ-02 | 从真实新建页面创建列表并重定向到确定性详情 URL | 正向集成测试 |
| AJ-03 | 从真实编辑页面保存名称并在详情页响应式显示 | 正向集成测试 |
| AJ-04 | 列表详情打包操作通过真实 hook 更新页面进度 | 响应式集成测试 |
| AJ-05 | 模板“我的”筛选同步 URL 且隐藏非本人模板 | URL 状态测试 |
| AJ-06 | 设置页立即应用主题并保存受支持偏好对象 | 设置/持久化测试 |
| AJ-07 | 常规用户被管理员守卫拒绝，管理员可进入真实控制台 | 授权 UX 测试 |

## 详细测试步骤

### AJ-01: 登录返回地址

**测试目的**: 验证真实 `RequireAuth`、登录页和测试 Clerk 表面协作。

**准备数据**:
- 未登录场景。
- 初始 URL `/lists/list_alpine?status=active#manifest`。

**测试步骤**:
1. 渲染真实路由。
2. 断言跳转到带完整编码返回地址的登录页。
3. 点击 `Continue as test user`。
4. 等待真实列表详情页。

**预期结果**:
- 未登录时不挂载受保护详情。
- 登录后回到原 path/search/hash。

### AJ-02: 创建列表成功

**测试目的**: 验证真实表单、`useListActions`、响应式运行时和 React Router 重定向。

**准备数据**:
- 常规用户场景。
- 初始 URL `/lists/new`。

**测试步骤**:
1. 输入列表名称、描述和标签。
2. 添加并移除标签以验证可编辑状态，再添加最终标签。
3. 提交。

**预期结果**:
- 空名称时提交按钮禁用。
- 创建后跳转 `/lists/list_101`。
- 详情页显示新名称和标签。

### AJ-03: 编辑列表成功

**测试目的**: 验证真实查询值用于初始化表单，更新后详情页立即读取新快照。

**准备数据**:
- 常规用户场景。
- `/lists/list_alpine/edit`。

**测试步骤**:
1. 修改列表名称。
2. 保存。
3. 等待详情页。

**预期结果**:
- URL 返回 `/lists/list_alpine`。
- h1 显示更新名称。

### AJ-04: 打包响应式更新

**测试目的**: 证明实际页面事件通过真实 hook 调用测试 Convex mutation，并推动订阅页面重渲染。

**准备数据**:
- 包含四项、两项已打包的 Alpine 列表。

**测试步骤**:
1. 打开详情页。
2. 点击 `Mark Insulated jacket packed`。
3. 读取复选框名称和汇总值。

**预期结果**:
- 控件名称变为 `Mark Insulated jacket unpacked`。
- Packed 汇总从 2 更新为 3。

### AJ-05: 模板 URL 筛选

**测试目的**: 验证实际模板页的 URL 状态和本人模板可见性。

**准备数据**:
- 公开 `Weekend Getaway`、本人私有 `Conference Kit`、外部私有模板。

**测试步骤**:
1. 打开 `/templates`。
2. 点击 `My templates`。
3. 检查 URL 和卡片。

**预期结果**:
- URL 为 `?filter=mine`。
- 仅本人模板显示。
- 外部私有模板始终不可见。

### AJ-06: 主题和偏好保存

**测试目的**: 验证 Appearance 选择立即更新根类名，保存时发送当前受支持的服务器偏好。

**准备数据**:
- 默认 system/medium 偏好；旧的 autoSave 值保持不变但不提供无行为的控件。

**测试步骤**:
1. 在 Appearance 选择 Dark。
2. 检查根元素 class。
3. 在 Preferences 选择 High，并确认没有 Auto-save 控件。
4. 保存并读取测试运行时用户。

**预期结果**:
- 保存前主题已立即变暗。
- 用户偏好等于 dark/high，原有 autoSave 值保持 true。

### AJ-07: 管理员守卫

**测试目的**: 验证 Clerk 登录状态不等于管理员授权，角色来自 Convex 用户。

**准备数据**:
- 常规用户场景和管理员场景。

**测试步骤**:
1. 常规用户直接打开 `/admin`。
2. 管理员直接打开 `/admin`。

**预期结果**:
- 常规用户只看到 `Administrator access required`。
- 管理员看到唯一 `Admin dashboard` h1 和 Administration tablist。

## 测试注意事项

### Mock 策略

- 不 mock 页面或 feature hooks。
- 只替换外部 Clerk/Convex React 客户端包。
- 使用真实生成函数引用解析函数名。

### 边界条件

- 所有 ID、时间和返回 URL 固定。
- 外部租户记录保留在场景中，用于证明 UI 可见性过滤；真正强制隔离由 Convex 授权测试覆盖。

### 异步操作

- 使用 Testing Library 的 `findByRole`、`waitFor` 和 user-event。
- 不使用任意 sleep 或全局假计时器。
