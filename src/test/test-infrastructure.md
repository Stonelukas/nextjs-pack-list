# Task 10 共享测试基础设施单元测试用例

## 测试文件

`test-infrastructure.test.ts`

## 测试目的

验证客户端测试边界使用固定身份、固定领域数据、单调 ID 和逻辑时钟，能够像 Convex React 一样提供引用稳定的响应式查询，并且在测试间完整重置，避免访问真实 Clerk 或 Convex 服务。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| TI-01 | 常规用户场景仅返回本人列表和可见模板 | 正向/安全边界测试 |
| TI-02 | 单次事务变更只发布一次、保持查询快照引用稳定，并保留未提交的列表描述 | 响应式状态/部分更新测试 |
| TI-02B | 仅更新数量时保留条目的描述、备注、重量、标签和优先级 | 部分更新回归测试 |
| TI-02C | 未提供新名称时按后端契约复制列表并清除模板/公开标志 | 运行时契约回归测试 |
| TI-02D | 提供新名称时按后端契约使用该名称并清除模板/公开标志 | 运行时契约回归测试 |
| TI-03 | 创建列表使用固定逻辑时钟和单调 ID，并可持久化后恢复 | 确定性/刷新测试 |
| TI-04 | 未支持的函数名立即失败，而不是静默返回空数据 | 异常测试 |
| TI-05 | 显式查询加载态和领域错误注入可重复重放 | 加载/错误测试 |
| TI-06 | 共享渲染器装配真实路由并保持外部边界可控 | 路由集成测试 |
| TI-06A | 共享渲染器走生产 unconfigured-runtime provider 分支 | Provider parity 测试 |
| TI-06B | 生产 provider 顺序支持 bootstrap 后主题同步和路由 | Provider parity 测试 |
| TI-06C | unresolved auth helper 只提供外部输入，不伪造 unavailable | 认证边界测试 |
| TI-07 | service-worker 更新状态驱动真实更新提示并记录激活请求 | PWA 响应式边界测试 |
| TI-08 | 渲染前注入离线状态并禁用真实页面变更操作 | 在线/离线边界测试 |
| TI-09 | 显式解除查询加载态后发布解析结果 | 可控异步边界测试 |
| TI-10 | 首次浏览器启动缺少 seed 和持久状态时立即失败 | 确定性/失败关闭测试 |
| TI-11 | 场景 nonce 随会话状态持久化并可在刷新后验证 | 场景隔离测试 |
| TI-12 | 网络沙箱只信任配置的应用 origin | 网络隔离测试 |

## 详细测试步骤

### TI-01: 隔离本人数据和公开模板

**测试目的**: 确保共享测试边界模拟真实客户端可见性，不把外部租户数据当作本人数据返回。

**准备数据**:
- 使用固定常规用户身份。
- 使用 `Alpine weekend`、外部用户列表、公开模板、本人私有模板和外部私有模板。

**测试步骤**:
1. 重置运行时为常规用户场景。
2. 查询 `lists:getListSummaries`。
3. 分页查询 `templates:getPublicTemplateSummaries`。
4. 分页查询 `templates:getOwnedTemplateSummaries`。
5. 比较返回 ID、分类/项目计数，并确认摘要不含嵌套分类。

**预期结果**:
- 本人列表可见，外部列表不可见。
- 公共摘要只包含公开模板；本人摘要只包含当前用户拥有的模板。
- 外部私有模板不可见。
- 摘要包含 `categoryCount` / `itemCount`，详情由单独的授权查询加载。

### TI-02: 原子事务和稳定快照

**测试目的**: 避免 `useSyncExternalStore` 因每次分配新对象产生循环渲染，并保证一次变更只通知一次。

**准备数据**:
- 常规用户场景。
- 一个订阅计数器。

**测试步骤**:
1. 连续读取同一函数和参数的查询快照。
2. 订阅运行时。
3. 执行一次列表更新。
4. 再次读取查询。

**预期结果**:
- 变更前连续读取返回同一对象引用。
- 一次事务只触发一次订阅通知。
- 变更后返回新引用和更新后的值。
- 仅提交列表名称时，原有描述保持不变。

### TI-02B: 条目部分更新保留未提交字段

**测试目的**: 让确定性 Convex 传输与 `ctx.db.patch` 一致，只修改参数对象实际拥有的字段。

**准备数据**:
- 常规用户场景中的 `item_jacket`。
- 完整描述、备注、重量、标签和高优先级元数据。

**测试步骤**:
1. 先提交完整条目元数据。
2. 再执行只包含 `quantity` 的更新。
3. 重新查询所属列表和条目。

**预期结果**:
- 数量更新为 2。
- 描述、备注、重量、标签和优先级保持原值。

### TI-02C: 默认名称复制契约

**测试目的**: 保证确定性运行时的 `lists:duplicateList` 与 Convex 后端一致，在省略 `newName` 时使用 `Copy of <source name>`，并且复制结果始终不是模板或公开列表。

**准备数据**:
- 常规用户场景中的 `Alpine weekend`。
- 将源列表的 `isTemplate` 和 `isPublic` 设置为 true，以证明复制时不会继承这些标志。

**测试步骤**:
1. 不提供 `newName` 调用 `lists:duplicateList`。
2. 使用返回的列表 ID 查询公开复制结果。
3. 读取确定性运行时的内部存储快照。

**预期结果**:
- 公开复制结果名称为 `Copy of Alpine weekend`，并且不暴露 `isTemplate` 或 `isPublic`。
- 内部兼容存储仍记录 `isTemplate=false` 和 `isPublic=false`。

### TI-02D: 显式名称复制契约

**测试目的**: 保证确定性运行时与 Convex 后端一致，提供 `newName` 时原样使用该名称，并且复制结果始终不是模板或公开列表。

**准备数据**:
- 常规用户场景中的 `Alpine weekend`。
- 将源列表的 `isTemplate` 和 `isPublic` 设置为 true，以证明复制时不会继承这些标志。

**测试步骤**:
1. 使用 `newName="Custom alpine copy"` 调用 `lists:duplicateList`。
2. 使用返回的列表 ID 查询公开复制结果。
3. 读取确定性运行时的内部存储快照。

**预期结果**:
- 公开复制结果名称为 `Custom alpine copy`，并且不暴露 `isTemplate` 或 `isPublic`。
- 内部兼容存储仍记录 `isTemplate=false` 和 `isPublic=false`。

### TI-03: 确定性 ID、时间和刷新恢复

**测试目的**: 保证 CI 结果不依赖 UUID、`Math.random` 或墙上时钟，并支持浏览器刷新后的状态恢复。

**准备数据**:
- 固定纪元和列表计数器。
- 可写 `sessionStorage`。

**测试步骤**:
1. 创建两个列表。
2. 检查返回 ID 和 `createdAt`。
3. 从会话存储重新建立运行时。
4. 查询用户列表。

**预期结果**:
- ID 按固定前缀和递增计数生成。
- 时间按固定逻辑时钟递增。
- 重新建立后仍能看到两个新列表。

### TI-04: 未支持函数立即失败

**测试目的**: 防止新增客户端 API 在测试中被错误地当成 `undefined` 或空数组处理。

**准备数据**:
- 常规用户场景。

**测试步骤**:
1. 查询未注册函数名。
2. 捕获异常。

**预期结果**:
- 异常明确包含未支持的函数名。

### TI-05: 显式加载和领域错误

**测试目的**: 允许实际页面测试覆盖加载和用户可恢复错误，而不使用计时等待。

**准备数据**:
- 把 `lists:getListSummaries` 标记为加载中。
- 为 `lists:getList` 注入 `FORBIDDEN` 领域错误。

**测试步骤**:
1. 读取加载中的查询。
2. 读取注入错误的查询。

**预期结果**:
- 加载查询返回 `undefined`。
- 错误查询抛出包含稳定 `data.code` 的错误。

### TI-06: 真实路由共享渲染

**测试目的**: 证明共享帮助器装配真实 `appRoutes`、主题和测试边界，而不是替换页面或功能 hooks。

**准备数据**:
- 未登录场景。
- 初始 URL `/`。

**测试步骤**:
1. 使用 `renderAppRoute` 创建内存数据路由。
2. 等待真实首页懒加载完成。
3. 查询页面标题、主区域和登录操作。

**预期结果**:
- 显示唯一的公开首页 h1。
- 存在 `main` 地标和可访问的登录按钮。
- 返回预配置的 `userEvent` 和 router，供后续页面集成测试使用。

### TI-06A: 生产 unconfigured-runtime 分支

**测试目的**: 证明 `renderAppRoute` 不再维护一套手工 provider 副本，而是把内存 router 和可控 runtime configuration 交给真实 `AppProviders`。

**准备数据**:
- 未登录场景。
- 缺少公开 Clerk 配置的 `RuntimeEnvResult`。

**测试步骤**:
1. 通过 `renderAppRoute` 打开 `/` 并传入 unconfigured runtime。
2. 检查完整友好首页、unavailable 提示和 Retry。

**预期结果**:
- 不构造 live Clerk/Convex 服务。
- 真实 production unconfigured provider 分支保持首页可用并投影恢复操作。

### TI-06B: 生产 provider 顺序

**测试目的**: 用可观察行为证明 production `ThemeProvider -> RuntimeConfigurationProvider -> Clerk/Convex -> AuthReadinessProvider -> ConvexUserBootstrap -> PreferenceThemeSync -> RouterProvider` 顺序也用于共享渲染器。

**准备数据**:
- 已登录常规用户，服务器偏好为 dark，浏览器初始主题为 light。

**测试步骤**:
1. 通过 `renderAppRoute` 打开 signed-in `/`。
2. 等待真实 dashboard h1。
3. 等待 `PreferenceThemeSync` 把根元素更新为 dark。

**预期结果**:
- auth/bootstrap 上下文在 route 渲染前可用。
- theme provider 包围 preference sync，router 在完整生产 provider 子树内渲染。

### TI-06C: unresolved auth 输入

**测试目的**: 保证测试 helper 只提供 `isLoaded=false` 的 Clerk 外部输入；最终 `unavailable` 仍由真实 `AuthReadinessProvider` timeout 投影。

**预期结果**:
- `unavailableAuth()` 返回未解析、未登录、无用户的纯输入，不包含最终 readiness 状态。

### TI-07: 响应式 service-worker 更新状态

**测试目的**: 验证 PWA 外部边界可由纯数据场景驱动，同时仍渲染真实 `PwaUpdatePrompt` 组件。

**准备数据**:
- 常规用户场景。
- `pwa.needRefresh=true`，其他更新标志为 false。

**测试步骤**:
1. 打开真实 `/lists` 路由。
2. 等待更新可用 region。
3. 点击 `Update now`。
4. 读取测试运行时 PWA 状态。

**预期结果**:
- 真实更新提示可见。
- 更新请求记录 `updateRequested=true` 和 `reloadRequested=true`。
- `needRefresh` 变为 false，提示响应式消失。

### TI-08: 渲染前离线状态

**测试目的**: 让组件测试无需真实断网即可确定性覆盖离线 UI 和变更禁用逻辑。

**准备数据**:
- 常规用户场景。
- `online=false`。
- 初始 URL `/lists/new`。

**测试步骤**:
1. 在路由挂载前设置 `navigator.onLine=false`。
2. 等待真实离线 banner。
3. 输入有效列表名称。
4. 检查创建操作。

**预期结果**:
- 离线消息位于 `role=status` 容器。
- 即使表单数据有效，`Create list` 仍禁用。

### TI-09: 显式解析加载查询

**测试目的**: 浏览器测试可以先证明保护内容未提前挂载，再在不使用 sleep 的情况下解除指定查询加载态。

**准备数据**:
- 常规用户场景。
- 把 `users:getCurrentAccess` 标记为加载中。

**测试步骤**:
1. 查询管理员访问结果并确认返回 `undefined`。
2. 调用运行时的 `resolveQuery`。
3. 再次查询相同函数。

**预期结果**:
- 解析前保持加载态。
- 解析后发布常规用户访问结果并触发订阅更新。

### TI-10: 首次启动必须显式提供 seed

**测试目的**: 防止 E2E fixture 失效时静默回退到常规用户场景。

**准备数据**:
- 清空活动运行时和 `sessionStorage`。
- 删除全局 seed。

**测试步骤**:
1. 调用浏览器运行时入口。
2. 捕获异常。

**预期结果**:
- 入口立即抛出缺少显式 seed 或持久状态的错误。
- 不设置通用成功 boundary。

### TI-11: 场景 nonce 随刷新保持

**测试目的**: 让 fixture 能验证请求场景确实被消费，而不是只等待任意布尔 boundary。

**准备数据**:
- 带固定 `scenarioId` 的常规用户场景。
- 可写 `sessionStorage`。

**测试步骤**:
1. 使用 seed 创建运行时并持久化。
2. 从同一会话存储恢复运行时。
3. 读取两个运行时的场景 ID。

**预期结果**:
- 首次运行时和恢复运行时都返回请求的同一场景 ID。

### TI-12: 网络沙箱限定应用 origin

**测试目的**: 防止 E2E 测试错误依赖开发者机器上的其他本地服务。

**准备数据**:
- 配置应用 origin `http://127.0.0.1:4173`。
- 同 origin URL、另一端口、`localhost` 别名和外部 HTTPS URL。

**测试步骤**:
1. 对每个 URL 调用 HTTP origin 判定函数。
2. 比较允许结果。

**预期结果**:
- 仅精确匹配配置应用 origin 的 HTTP 请求允许通过。
- 其他本地端口、主机别名和外部 origin 全部拒绝。

## 测试注意事项

### Mock 策略

- 只替换 `@clerk/clerk-react`、`convex/react`、`convex/react-clerk` 和 `virtual:pwa-register/react` 的客户端外部边界。
- `convex/server`、生成的函数引用、React Router、页面、组件、feature hooks 和 `convex-test` 后端测试保持真实。
- 授权强制证明仍由 Convex 测试负责；本模块只验证客户端可见性、角色 UX、响应式状态和恢复 UI。
- `online` 渲染选项只控制测试浏览器的 `navigator.onLine`，不会绕过生产网络或认证逻辑。

### 边界条件

- 未登录、常规用户、管理员和空账户必须使用纯 JSON 场景创建。
- 查询加载和错误必须按函数名显式配置。
- 不允许未知函数静默回退。

### 异步操作

- 变更在一个同步状态替换中完成，再统一通知订阅者。
- 不使用全局假计时器或任意 sleep。
