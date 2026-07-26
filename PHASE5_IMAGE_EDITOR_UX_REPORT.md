# Phase 5 — Image Editor UX

## 任务范围

本阶段在 Phase 4 统一生成工作台上完善图片编辑器体验，未修改具体模型、ComfyUI 节点或工作流 JSON。

## 一、现状与生产能力审计

### 涉及页面与代码

- 页面：`apps/web/image-editor.html`
- 统一工作台：`apps/web/generation-workspace.js`
- 样式：`apps/web/styles.css`
- 浏览器 API 适配：`apps/web/api-service.js`
- 生成任务入口：`supabase/functions/ai/index.ts`
- 静态工作流映射：`apps/web/workflow-map.json`

### 生产数据结论

只读检查 Supabase 当前 `image-editor` 工具及关联工作流：

- 工具状态：`published`
- 工作流状态：`published`
- 工具价格：`0`
- 工作流价格：`0`
- `input_schema`：空对象
- `output_schema`：空对象
- 静态工作流映射只声明：`image`、`prompt`
- 工作流映射状态：`requires_server_config`

因此当前生产能力只可确认：

- 一张主图片
- 一段 prompt

不能确认：

- 多图角色输入
- 输出比例
- 输出数量
- 清晰度
- 保留人脸
- 创意强度

正式页面不会把这些未确认能力显示为可用，也不会把 0 积分解释成免费。

## 二、实现内容

### 1. 单图与多图模式

页面保留：

- 单张图片
- 多张图片

正式生产页面：

- 单图模式可选。
- 多图模式可见但禁用。
- 页面明确说明当前工作流只支持一张主图片。
- 不展示或启用虚假的参考槽位。

工作流 schema 未来真正开放后，页面会按字段自动显示：

- 主图片
- 参考脸
- 参考服装
- 参考场景

支持的 schema 别名已兼容常见驼峰和下划线命名。多图模式要求主图片和至少一个已开放参考槽位，避免把只有一张图的任务误标为多图任务。

### 2. 快捷编辑

新增八个快捷入口：

- 移除背景
- 更换背景
- 更换服装
- 改善光线
- 修复脸部
- 改变姿势
- 扩展画面
- 自定义编辑

点击后的行为：

1. 设置标准化 `operation`。
2. 自动填入基础 prompt。
3. 用户仍可继续修改。
4. 请求同时携带 `operation` 与 `prompt`。

标准 operation：

```text
remove_background
replace_background
change_outfit
improve_lighting
repair_face
change_pose
outpaint
custom
```

生成任务入口会校验 operation 白名单，并把 `operation`、`editorMode` 和受支持的输出设置保存到 `generation_jobs.input_params`。没有修改工作流执行参数。

### 3. Prompt 体验

已实现：

- 快捷操作自动填充示例描述
- 自定义编辑
- 清空
- 最近 8 条本地历史提示词
- 1200 字符限制
- 实时字符计数
- 中文输入说明
- 明确说明不会展示内部 system prompt
- 可选“优化描述”

“优化描述”调用现有 Supabase `ai` Edge Function 的 `enhance-prompt` 动作：

- 不自动调用
- 不强制替换
- 仅用户主动点击
- 失败时保留原描述
- 未登录时提示登录后使用

### 4. 输出设置

输出设置严格由生产 `input_schema` 控制。

只有 schema 明确包含对应字段时才显示：

- `aspectRatio`：输出比例
- `imageCount`：输出数量
- `resolution`：清晰度
- `preserveFace`：保留人脸
- `creativity`：创意强度

当前正式生产 schema 为空，因此这些控件不显示。

### 5. 请求参数

图片编辑提交新增：

```text
prompt
operation
editorMode
roleAssets
outputSettings
file
files
privacy
idempotencyKey
```

未开放的角色槽位和输出设置不会产生参数。

### 6. 结果操作

图片结果成功且存在真实结果 URL 时支持：

- 下载
- 对比原图
- 再次编辑
- 转成视频
- 保存到作品
- 复制提示词
- 分享

无真实结果 URL 时不会生成假预览，而是提示到“我的作品”核对。

### 7. 恢复与积分

继续复用 Phase 4：

- `generation_jobs`
- `credits`
- `credit_transactions`
- `user_creations`
- 任务轮询
- sessionStorage 最近任务引用
- idempotency key
- 失败退款显示
- 刷新后真实任务恢复

查看历史任务时，图片编辑器会恢复任务中的 prompt 和 operation。

## 三、修改文件

| 文件 | 修改内容 |
|---|---|
| `apps/web/generation-workspace.js` | 图片编辑模式、动态角色槽位、快捷操作、提示词历史/优化、动态输出设置、标准化参数、结果操作 |
| `apps/web/styles.css` | 模式切换、快捷操作、角色槽位、提示词工具和输出设置的桌面/移动端样式 |
| `supabase/functions/ai/index.ts` | 校验并保存标准化 operation、editorMode、outputSettings；未修改工作流执行 |

## 四、验收结果

### 正式生产能力页面

| 检查项 | 结果 |
|---|---|
| 单图模式 | 通过 |
| 多图入口保留 | 通过 |
| 多图未支持时禁用 | 通过 |
| 未支持角色槽位不显示 | 通过 |
| 未支持输出参数不显示 | 通过 |
| 8 个快捷操作 | 通过 |
| 快捷操作自动填充 prompt | 通过 |
| 自定义编辑 | 通过 |
| 清空 | 通过 |
| 字符计数 | 通过 |
| 积分读取与价格保护 | 通过 |
| 页面无横向滚动 | 通过 |

### 本地能力契约验收

仅在 `localhost` / `127.0.0.1` 使用显式 QA 参数模拟完整 schema，不进入生产页面、不写数据库：

- 四个角色槽位按 schema 出现。
- 五类输出设置按 schema 出现。
- 100 积分、12 积分消耗显示正确。
- 多图模式要求主图和至少一个参考图。

### 任务状态

复用并复查 Phase 4：

- 失败状态：通过
- 失败退款文案：通过
- 排队/处理中状态：通过
- 成功但无结果 URL 的安全提示：通过
- 刷新恢复逻辑：通过

### 响应式

- 1440×900：通过
- 390×844：通过
- 移动端快捷操作两列
- 无横向滚动
- 固定提交区保持可见

### 浏览器错误

- Console error：0
- Console warning：0

### 项目检查

- `npm run typecheck`：通过
- `npm run build`：通过
- `git diff --check`：通过

构建仍会报告项目已有的 classic script 与 `home-assets` 运行时路径警告，本阶段未新增这些警告。

## 五、截图

- `docs/screenshots/phase5-image-editor/image-editor-single-1440.png`
- `docs/screenshots/phase5-image-editor/image-editor-multi-capabilities-1440.png`
- `docs/screenshots/phase5-image-editor/image-editor-390.png`

## 六、未完成项

### 1. 真实多图生成

状态：UI 与 schema 适配逻辑已完成，生产能力未开放。

原因：

- 当前工作流只声明 `image + prompt`。
- 数据库 `input_schema` 为空。
- 当前上传/工作流桥没有参考脸、服装和场景的真实字段契约。

下一步：

- 后端为真实工作流发布角色输入 schema。
- 将角色文件上传为服务端可访问的资产 URL。
- 完成后再把工作流切换为 `active`。

### 2. 输出设置

状态：动态 UI 已完成，生产页面不显示。

原因：

- 当前后端未声明这些参数。

下一步：

- 后端工作流实际支持后，在 `input_schema` 发布明确字段、类型、范围和默认值。

### 3. 真实成功结果全链路

状态：结果操作已实现，未进行收费生产任务。

原因：

- 工作流未达到 `active`。
- 价格仍为 0。
- 输入/输出 schema 不完整。

没有伪造成功结果、积分扣减或退款记录。

### 4. 浏览器文件选择自动化

本地验收浏览器不支持自动附加文件，因此未通过浏览器自动化上传真实本地图片。上传读取、格式、大小、分辨率、替换和删除逻辑沿用 Phase 4 已实现代码路径；生产前仍需在支持文件选择的真实浏览器完成一次人工上传验收。

## 七、下一阶段依赖

1. 明确 image-editor 真实工作流支持的输入节点。
2. 发布非空 `input_schema` / `output_schema`。
3. 配置正积分价格。
4. 建立主图和参考图的 Storage / 资产 URL 契约。
5. 完成一次真实人工成功生成。
6. 验证下载、对比、保存、再次编辑和转视频全链路。
