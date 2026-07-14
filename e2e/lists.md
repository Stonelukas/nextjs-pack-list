# 列表、分类和物品 E2E 测试用例

## 测试文件

`lists.spec.ts`

## 测试目的

验证真实仪表盘、列表创建/编辑/详情、分类和物品创建与编辑、打包、数量调整、键盘重排、跨分类移动以及物品/分类/列表删除。所有用例通过独立的确定性运行时场景执行。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| E2E-LIST-01 | 仪表盘日期/名称排序、筛选、搜索和布局状态 | URL/UI 测试 |
| E2E-LIST-02 | 创建列表并从详情页编辑 | 正向测试 |
| E2E-LIST-03 | 空列表创建分类和物品并响应式更新进度 | 正向/响应式测试 |
| E2E-LIST-04 | 编辑分类名和物品字段并增减数量 | 正向测试 |
| E2E-LIST-05 | 全部打包后取消并再次确认完成 | 对话框测试 |
| E2E-LIST-06 | 键盘重排、跨分类移动和逐级删除 | 交互/破坏性测试 |
| E2E-LIST-07 | 外部所有者列表映射为拒绝访问 UI | 异常测试 |

## 详细测试步骤

### E2E-LIST-01: 仪表盘排序、筛选和布局

**测试目的**: 验证首页默认按创建日期排序、可访问排序控件、URL 状态筛选、搜索空态和布局按钮语义。

**准备数据**:
- 常规用户固定场景。
- 较早创建的活动列表 `Alpine weekend` 和较晚创建的已完成列表 `City conference`。

**测试步骤**:
1. 打开 `/`，检查 `My packing lists` 标题，并读取列表卡片标题顺序。
2. 通过名为 `Sort packing lists` 的可访问组合框选择 `Name`。
3. 再次读取列表卡片标题顺序。
4. 直接打开 `/lists?status=completed`，检查友好 `My packing lists` h1 和 `Completed lists` h2。
5. 检查 Completed 导航的 `aria-current=page` 及结果集合。
6. 输入无匹配搜索词，检查空态，再清空搜索词。
7. 切换 `List view` 并读取按钮状态。

**预期结果**:
- 默认日期排序依次显示 `City conference`、`Alpine weekend`。
- 选择名称排序后依次显示 `Alpine weekend`、`City conference`。
- 完成筛选保留 `My packing lists` 页面 h1，以 `Completed lists` h2 标记当前集合，并只显示 `City conference`。
- 无结果时显示命名空态。
- 列表布局按钮具有 `aria-pressed=true`。

### E2E-LIST-02: 创建并编辑列表

**测试目的**: 验证真实创建表单、标签编辑、确定性 ID 重定向和编辑页面，并证明仅修改名称时不会清除已有描述。

**准备数据**:
- 常规用户场景，下一列表 ID 为 `list_101`。

**测试步骤**:
1. 打开 `/lists/new` 并确认空名称时提交禁用。
2. 填写名称和描述。
3. 添加再删除 `coast` 标签，并通过 Enter 添加 `weather`。
4. 提交创建。
5. 从详情页打开 `Edit list`，修改名称并保存。

**预期结果**:
- 创建后 URL 为 `/lists/list_101`，详情显示名称和最终标签。
- 编辑后返回同一详情 URL，并显示 `Coastal escape revised`。
- 名称更新未提交 `description`，原有 `Wind and rain ready` 描述保持可见。

### E2E-LIST-03: 创建分类和物品

**测试目的**: 验证空列表中的分类/物品创建通过真实 hooks 推动响应式查询更新。

**准备数据**:
- `emptyListScenario()`，Alpine 列表无分类和物品。

**测试步骤**:
1. 打开 Alpine 详情并检查空提示。
2. 通过命名对话框创建 Clothing 和 Documents。
3. 在 Clothing 创建数量为 2 的 `Rain shell`。
4. 在 Documents 创建 `Ferry ticket`。
5. 读取总数和命名进度条。

**预期结果**:
- 两个分类和两个物品均立即可见。
- Total items 为 2。
- `Packed against target` 的 `aria-valuenow` 为 0。

### E2E-LIST-04: 编辑分类、物品和数量

**测试目的**: 覆盖分类改名、物品名称/描述/数量/优先级/重量/备注编辑，以及行内数量增减时保留未提交的可选字段。

**准备数据**:
- 含 Clothing、Documents 和 Insulated jacket 的常规场景。

**测试步骤**:
1. 打开 Alpine 详情。
2. 点击 `Rename category`，将 Clothing 改为 Outerwear 并保存。
3. 打开 Insulated jacket 的 `Edit item`。
4. 将物品改为 `Storm jacket`，填写描述、数量 2、High 优先级、重量 1.4 和备注。
5. 保存并检查更新后的行。
6. 点击增加数量，再点击减少数量。
7. 重新打开编辑对话框，读取描述、备注、重量和优先级。

**预期结果**:
- 分类显示 `Outerwear`，输入打开时获得焦点。
- 物品显示更新名称、描述、high 优先级和 Quantity 2。
- 增加后为 Quantity 3，减少后恢复 Quantity 2。
- 数量-only 更新后，描述、备注、重量和优先级保持不变。

### E2E-LIST-05: 自动完成确认

**测试目的**: 验证最后一个未打包物品触发确认对话框，取消不会完成列表，再次触发可完成。

**准备数据**:
- Alpine 列表四项中两项已打包。

**测试步骤**:
1. 打包 Insulated jacket 和 Passport。
2. 在 `All items packed` 对话框选择 `Not yet`。
3. 将 Passport 取消打包后再次打包。
4. 在再次出现的对话框中选择 `Mark complete`。

**预期结果**:
- 第一次取消后仍显示 `Mark complete`。
- 第二次确认后显示 `Mark incomplete`。

### E2E-LIST-06: 重排、移动和删除

**测试目的**: 验证 dnd-kit KeyboardSensor 重排、物品跨分类移动以及级联破坏性操作。

**准备数据**:
- 常规 Alpine 列表，两分类各两物品。

**测试步骤**:
1. 聚焦第一个分类排序柄，使用 Enter、ArrowDown、Enter 将 Documents 移到首位。
2. 聚焦 Clothing 第一个物品排序柄，以同样方式将 Wool socks 移到首位。
3. 编辑 Insulated jacket，将 Category 改为 Documents。
4. 确认删除已移动物品。
5. 确认删除 Documents 分类。
6. 打开 `/lists`，通过列表操作菜单确认删除 Alpine 列表。

**预期结果**:
- DOM 顺序分别更新为 Documents 在前、Wool socks 在前。
- Insulated jacket 出现在 Documents 后再被删除。
- Documents 分类和 Alpine 列表分别消失。

### E2E-LIST-07: 外部列表拒绝

**测试目的**: 验证外部所有者列表的稳定领域错误映射，不泄露私有详情。

**准备数据**:
- 场景包含由 foreign user 拥有的 `list_foreign`。

**测试步骤**:
1. 直接打开 `/lists/list_foreign`。
2. 检查 `Access denied` 标题和拒绝访问消息。
3. 检查 `[data-list-detail]` 元素数量。
4. 检查外部列表名称 `Foreign private route` 和描述 `Must never appear in another tenant's query`。

**预期结果**:
- 显示 `Access denied` 一级标题。
- 显示 `You do not have access to this list`。
- `[data-list-detail]` 数量为 0，不挂载外部列表详情。
- 外部列表名称和描述均不存在于页面中。

## 测试注意事项

### Mock 策略

测试运行时实现与 Convex 公共函数同名的确定性查询/变更；真实后端强制所有权由 `convex-test` 授权套件验证。

### 边界条件

每个测试获得独立场景和计数器；不得依赖前一个测试创建的数据。破坏性操作必须作用域到对应卡片/行/对话框。

### 异步操作

使用可访问角色、响应式 DOM 和 dnd-kit 键盘公告；不使用坐标拖拽或任意等待。
