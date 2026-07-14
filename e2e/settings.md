# 设置、数据和迁移 E2E 测试用例

## 测试文件

`settings.spec.ts`

## 测试目的

验证设置页直接加载、主题立即应用与受支持偏好持久化、本人范围数据导出、有效 JSON 导入，以及旧 Zustand 数据的审阅确认、幂等导入和安全源数据清理。

## 测试用例概览

| 用例 ID | 功能描述 | 测试类型 |
| ------- | -------- | -------- |
| E2E-SET-01 | 主题立即应用且受支持偏好刷新保留 | 持久化测试 |
| E2E-SET-02 | 账户导出只包含本人数据 | 下载/隔离测试 |
| E2E-SET-03 | 有效 JSON 文件导入并重定向 | 上传测试 |
| E2E-SET-04 | 旧 Zustand 数据确认、幂等和安全清理 | 迁移测试 |

## 详细测试步骤

### E2E-SET-01: 主题和偏好持久化

**测试目的**: 验证主题选择立即更新根元素，保存时提交当前受支持的偏好对象，并在刷新后恢复。

**准备数据**:
- 常规用户偏好 `system/medium`。

**测试步骤**:
1. 直接打开 `/settings` 并检查命名 tablist。
2. 在 Appearance 中选择 Dark。
3. 在 Preferences 中选择 High，并确认没有无独立运行时行为的 Auto-save 控件。
4. 点击 `Save preferences`。
5. 刷新页面并重新打开 Preferences。

**预期结果**:
- 选择后 `<html>` 立即包含 `dark`。
- 显示 `Preferences saved`。
- 刷新后仍为 dark 和 High，且不会出现 Auto-save 控件。

### E2E-SET-02: 本人数据导出

**测试目的**: 验证下载文件名固定且导出内容不包含其他用户的数据或外部公开模板。

**准备数据**:
- 浏览器时间固定为 2025-01-15 12:00 UTC。
- 本人列表 `list_alpine`、`list_completed` 和本人模板 `template_conference`。

**测试步骤**:
1. 打开 Settings 的 Data 页签。
2. 捕获 `Export my data` 下载。
3. 读取并解析下载 JSON。
4. 比较列表和模板 ID。

**预期结果**:
- 文件名为 `pack-list-export-2025-01-15.json`。
- 仅包含两个本人列表和 `template_conference`。
- 不包含公开但非本人创建的 `template_weekend`。

### E2E-SET-03: JSON 导入

**测试目的**: 验证内存 JSON 文件通过真实导入对话框、校验和变更创建新列表。

**准备数据**:
- 版本 1 payload，含 `Imported coast route`、Documents 和 Boarding pass。
- 下一列表 ID 为 `list_101`。

**测试步骤**:
1. 打开 Data 页签并打开 `Import list`。
2. 将内存 JSON 设置到 `JSON file` 输入。
3. 提交导入。
4. 检查重定向后的详情标题和物品按钮。

**预期结果**:
- URL 为 `/lists/list_101`。
- 显示 `Imported coast route` 和唯一作用域内的 `Boarding pass` 物品。

### E2E-SET-04: 旧数据迁移

**测试目的**: 验证旧浏览器数据先审阅后导入、无确认时禁止提交、相同 fingerprint 不重复导入，并仅在用户操作后删除源键。

**准备数据**:
- 在 `pack-list-storage` 预置 `legacyZustandJson`。
- fixture 含 1 个有效列表、1 个有效模板和 4 条拒绝记录。

**测试步骤**:
1. 打开 Legacy migration 页签。
2. 检查可导入摘要并打开 `Review legacy import`。
3. 检查 `4 rejected records` 和禁用的导入按钮。
4. 勾选审阅确认并导入。
5. 刷新后再次打开迁移页签。
6. 检查 already imported 状态并点击 `Delete legacy source data`。
7. 读取源键和 archive 键。

**预期结果**:
- 未确认时不能导入，确认后显示成功。
- 刷新后显示 `This legacy data was already imported.`。
- 源 `pack-list-storage` 被删除，恢复/归档键仍存在。

## 测试注意事项

### Mock 策略

文件使用 Playwright 内存 payload；日期通过浏览器时钟固定。Convex 数据使用每测试独立运行时。

### 边界条件

导出必须以当前用户为范围；迁移删除仅作用于旧源键，不能删除恢复副本或其他存储。

### 异步操作

下载使用 `waitForEvent("download")`，上传使用 `setInputFiles`，刷新后通过可见状态等待；不读取个人文件，不使用 sleep。
