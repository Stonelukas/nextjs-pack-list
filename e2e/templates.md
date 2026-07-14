# 模板库 E2E 测试用例

## 测试文件

`templates.spec.ts`

## 测试目的

验证模板可见性、URL 驱动筛选、组合筛选空态、预览对话框焦点、应用公开模板和从本人列表保存私有模板。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| E2E-TPL-01 | 本人/最近及组合筛选同步 URL | URL/边界测试 |
| E2E-TPL-02 | 预览模板并恢复触发器焦点 | 可访问性测试 |
| E2E-TPL-03 | 应用公开模板生成完整列表 | 正向测试 |
| E2E-TPL-04 | 从列表保存私有模板并在本人筛选显示 | 正向测试 |

## 详细测试步骤

### E2E-TPL-01: 可见性和筛选

**测试目的**: 验证公开与本人私有模板可见，外部私有模板隐藏，并确认筛选状态与 URL 同步。

**准备数据**:
- 公开 `Weekend Getaway`。
- 本人私有 `Conference Kit`。
- 外部私有 `Hidden private expedition`。

**测试步骤**:
1. 打开 `/templates` 并检查初始可见性。
2. 点击 `My templates`。
3. 点击 `Recent`。
4. 输入搜索词并选择 travel 类别和 Advanced 难度。
5. 检查空态后点击 `Clear filters`。

**预期结果**:
- 外部私有模板始终不可见。
- 本人筛选 URL 为 `?filter=mine`，Recent 为 `?filter=recent`。
- 不匹配组合显示 `No templates found`。
- 清空后 URL 恢复 `/templates` 且公开模板可见。

### E2E-TPL-02: 模板预览焦点

**测试目的**: 验证预览对话框具有可访问名称并在 Escape 后恢复触发器焦点。

**准备数据**:
- Weekend Getaway 模板含两个分类和固定物品。

**测试步骤**:
1. 在模板卡片点击 `Preview`。
2. 检查命名对话框、分类摘要和 `T-shirts`。
3. 按 Escape。

**预期结果**:
- 对话框名称为 `Weekend Getaway`。
- 对话框关闭后焦点返回原 Preview 按钮。

### E2E-TPL-03: 应用公开模板

**测试目的**: 验证模板预览到创建列表的完整流程及分类/物品克隆。

**准备数据**:
- 公开 Weekend Getaway 模板。
- 下一列表 ID 为 `list_101`。

**测试步骤**:
1. 点击 Weekend Getaway 卡片的 `Use template`。
2. 在模板预览中再次选择 `Use template`。
3. 输入新列表名 `Weekend in Porto` 并创建。
4. 检查详情页。

**预期结果**:
- URL 为 `/lists/list_101`。
- 详情显示新名称、Clothing 分类和 Phone charger 物品。

### E2E-TPL-04: 保存私有模板

**测试目的**: 验证本人列表可保存为默认私有模板并出现在本人模板集合。

**准备数据**:
- 本人拥有的 Alpine 列表。

**测试步骤**:
1. 打开 Alpine 详情并点击 `Save as template`。
2. 填写名称和描述。
3. 确认显示 `Private template` 并保存。
4. 打开 `/templates?filter=mine`。

**预期结果**:
- 保存对话框成功关闭。
- `Alpine private kit` 出现在本人模板筛选结果。

## 测试注意事项

### Mock 策略

模板查询和变更通过确定性 Convex 客户端边界执行；组件、对话框、路由和 hooks 使用真实实现。

### 边界条件

公开模板与本人模板可能重叠，外部私有模板必须始终隐藏。真正的服务端私有模板拒绝由 Convex 授权测试覆盖。

### 异步操作

通过角色、URL 和响应式页面断言等待结果，不使用 sleep。
