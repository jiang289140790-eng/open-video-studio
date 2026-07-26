# IMAGE TOOL PAGES ACCEPTANCE

日期：2026-07-26
范围：图片生成、自然语言图片编辑、多图编辑、图片高清修复、我的创作图片详情
状态：`IMPLEMENTED_LOCAL`、`BUILD_PASSED`

## 1. 边界与结论

本批次没有新增底层工作流，没有修改 Supabase 表结构、生成 API、积分扣减或工作流节点。

当前没有任何一个本批图片工作流达到连续真实端到端验收，因此四个创建页面均显示“即将上线”，创建按钮保持禁用：

| 页面 | 当前工作流证据 | 页面状态 |
|---|---|---|
| AI 图片生成 | `IMAGE_GENERATION_E2E_REPORT.md` 为 `BLOCKED` | 即将上线，不允许提交 |
| 自然语言图片编辑 | `workflow-map.json` 为 `requires_server_config` | 即将上线，不允许提交 |
| 多图编辑 | `workflow-map.json` 为 `requires_server_config` | 即将上线，不允许提交 |
| 图片高清修复 | `workflow-map.json` 为 `requires_server_config` | 即将上线，不允许提交 |
| 我的创作图片详情 | 读取真实登录用户的作品记录 | 有真实作品时可预览和操作；不生成演示结果 |

页面仅在同时满足以下条件时才允许创建：工具已发布、工作流为 active/published、具备 workflow_id、输入/输出 schema 完整、页面标记完成 E2E 验证、积分价格有效。

## 2. 原问题与根因

1. `generate.html` 和 `image-combiner.html` 各自使用旧版独立页面结构，包含与真实后端不一致的角色、模式、预览和积分文案。
2. 图片编辑器虽已使用统一工作台，但图片生成、多图编辑和高清修复未复用该结构。
3. 旧页面可能让用户误以为未验证工作流可以提交。
4. “我的创作”预览弹层只显示媒体和简短文本，缺少图片详情及常用结果操作。
5. 用户状态恢复早于作品筛选变量初始化，首次加载可能出现 `creationFilter` 初始化错误。

## 3. 实现内容

### 3.1 统一生成工作台

以下页面统一为左侧参数区、右侧结果区：

- `/generate.html`：AI 图片生成
- `/image-editor.html`：自然语言图片编辑
- `/image-combiner.html`：多图编辑
- `/image-editor.html?operation=upscale`：图片高清修复

统一提供：

- 上传组件
- 文件格式、大小、分辨率和数量校验
- 示例参数
- 描述字符限制
- 私密结果说明
- 积分摘要
- 创建按钮及不可用原因
- empty / queued / processing / completed / failed / cancelled 结果状态
- 错误摘要
- 下载、保存、再次生成、复制参数、分享、图片转视频操作
- 最近真实任务
- 页面刷新后的任务恢复逻辑

### 3.2 页面差异

- 图片生成：参考图可选，支持纯文字描述。
- 自然语言图片编辑：单张主图 + 快捷编辑操作；多图入口转到独立多图页面。
- 多图编辑：要求 2—4 张图片，不再显示旧版假预览。
- 高清修复：单张图片，修复描述可选。
- 我的创作图片详情：新增工具、创建时间、尺寸、文件大小、可见性，并提供下载、再次生成、转视频、分享和删除。

### 3.3 防误导

- 未完成 E2E 验证的四个工具固定显示“即将上线”。
- 不显示假的成功结果。
- 不使用 `setTimeout` 伪造进度。
- 结果区和最近结果只读取真实任务/作品数据。
- 无结果时显示明确空状态。

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `apps/web/generation-workspace.js` | 增加四类图片工具配置、示例参数、工作流 E2E 门槛、统一校验与状态文案 |
| `apps/web/generate.html` | 旧图片生成页收敛到统一工作台；保留 SEO 元数据 |
| `apps/web/image-combiner.html` | 旧多图合成页收敛到统一工作台 |
| `apps/web/consumer-shell.js` | 图片生成和多图编辑纳入统一消费者 AppShell |
| `apps/web/app.js` | 图片详情弹层与操作；修复作品筛选初始化顺序 |
| `apps/web/styles.css` | 示例参数、图片详情和统一页面细节；避免桌面提交条遮挡参数 |

未修改底层工作流、Supabase 数据库、Edge Function 和生成服务。

## 5. 桌面端与移动端验证

浏览器逐页检查了 1440×900 和 390×844：

| 页面 | 1440×900 | 390×844 | 横向滚动 | Header / Sidebar 重复 |
|---|---|---|---|---|
| 图片生成 | 通过 | 通过 | 无 | 各 1 组 |
| 自然语言图片编辑 | 通过 | 通过 | 无 | 各 1 组 |
| 多图编辑 | 通过 | 通过 | 无 | 各 1 组 |
| 图片高清修复 | 通过 | 通过 | 无 | 各 1 组 |
| 我的创作 | 通过 | 通过 | 无 | 各 1 组 |

验证内容：

- 创建按钮均为禁用，并明确显示工作流未完成真实验证。
- 示例参数点击后能写入描述框，但不会绕过工作流门槛。
- 右侧结果区和最近任务存在。
- 390px 下导航为移动菜单，页面没有横向溢出。
- 修复后新开的“我的创作”页面无控制台错误。

## 6. 截图

- `artifacts/image-tools/image-generate-desktop.png`
- `artifacts/image-tools/image-generate-mobile-390.png`
- `artifacts/image-tools/my-creations-desktop.png`
- `artifacts/image-tools/my-creations-mobile-390.png`

## 7. 工程验证

| 检查 | 结果 |
|---|---|
| `npm run typecheck` | 通过 |
| `npm run build` | 通过 |
| `node --check apps/web/generation-workspace.js` | 通过 |
| `node --check apps/web/app.js` | 通过 |
| `git diff --check` | 通过 |
| `npm run lint` | `BLOCKED`：项目未定义 lint 脚本 |
| `npm test` | 未全通过：75 项中 59 通过、16 失败 |

测试失败集中在旧静态页面契约、旧 CTA/工具钩子、价格页和支付配置断言。部分断言要求保留本次明确移除的旧演示结构，例如旧工具海报 class、旧视频 preset hook 和旧角色选择。没有通过的测试没有被标记为通过，也没有为迎合旧断言恢复演示结果。

## 8. 未完成项

1. 四个图片工作流没有真实 E2E 验证，创建功能保持关闭。
2. 未使用登录生产账户验证真实作品详情，因为本任务不创建演示作品，也不伪造数据库记录。
3. 图片详情中的尺寸和文件大小取决于真实作品记录是否保存对应字段；缺失时显示“待同步”。
4. 旧静态测试契约需要在单独任务中按当前消费者产品结构更新。
5. 项目需要补充正式 lint 脚本。

## 9. 下一步依赖

只允许在对应工作流完成真实服务端接入并通过 E2E 后，将该工具的 `e2eVerified` 状态改为可用。开放前必须验证：

1. 前端提交；
2. Edge Function；
3. Zealman / ComfyUI；
4. Storage；
5. generation_jobs；
6. 页面结果；
7. 我的创作；
8. 积分扣费与失败退款。
