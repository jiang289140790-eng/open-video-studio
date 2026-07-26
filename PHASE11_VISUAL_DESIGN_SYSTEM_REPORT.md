# Phase 11 — Luravyn Visual Design System 报告

## 1. 范围与结论

本阶段只统一 Luravyn 消费者前台的视觉系统、组件外观、响应式规则与基础无障碍行为。未修改生成 API、工作流、积分扣减、支付逻辑、Supabase 数据结构、用户生成内容或 AI Marketing Studio 后台。

消费者前台现已采用统一的深黑灰背景、暗紫表面、粉紫主操作色。信息蓝仅用于提示，不再作为主要品牌色。缺少真实媒体或 active workflow 的效果继续保持“预览准备中 / 即将上线”，没有伪造预览或可生成状态。

## 2. 视觉审计

### 2.1 审计结果

审计对象为 `apps/web/styles.css`、消费者页面、效果目录和 Phase 2 媒体审计数据。

| 项目 | 审计结果 | 主要问题 |
|---|---:|---|
| CSS 规模 | 约 9,214 行（本阶段修改前） | 多阶段样式叠加，页面局部规则优先级冲突 |
| 颜色表达式 | 约 677 种 | 白色透明度、灰色、粉色、紫色和蓝色存在大量近似值 |
| 字号值 | 约 106 种 | 同级标题和辅助文字缺少统一层级 |
| 圆角值 | 约 29 种 | 卡片、输入框、按钮和弹层外观不一致 |
| 阴影值 | 约 55 种 | 同类卡片的悬浮深度不一致 |
| `gap` 值 | 约 30 种 | 网格和表单间距缺少固定节奏 |
| `padding` 值 | 约 167 种 | 页面容器和卡片内边距差异过大 |
| 响应式规则 | 约 44 组 | 断点分散在 375—1200px，容易互相覆盖 |
| 效果资源 | 25 个效果；active 0；preview_only 25 | 当前没有经批准且绑定 active workflow 的真实预览 |
| 媒体路径 | 12 个本地媒体引用、66 个外部引用 | 需要继续遵守统一 URL 解析与失败回退 |

高频颜色中存在 `#fff`、多种白色透明度、`#ff62bb`、`#ff5ab3` 及多套灰紫色。原样式还混有蓝色信息卡、粉色按钮、紫色容器、卡通占位和真人内容，造成品牌层级不稳定。

### 2.2 根因

1. 历史页面各自声明按钮、卡片和表单样式，缺少统一语义变量。
2. 同一组件在不同阶段追加覆盖规则，导致字号、圆角和间距逐步分叉。
3. 旧的品牌变量与页面直接颜色值并存。
4. 响应式断点按页面分别编写，缺少 mobile / tablet / desktop / wide 的统一定义。
5. 媒体资源不完整时，旧卡片容易形成大面积深色空白；Phase 2 已建立诚实回退，本阶段统一其视觉。

## 3. 修改文件

| 文件 | 修改内容 |
|---|---|
| `apps/web/styles.css` | 建立语义 Design Tokens；增加仅作用于消费者前台的最终统一层；统一组件、卡片、断点、焦点和 reduced-motion |
| `apps/web/design-system.js` | 新增通用无障碍增强：弹层焦点管理、焦点循环、Escape 关闭、图标按钮标签、表单错误关联 |
| `apps/web/app.js` | 初始化视觉系统的通用无障碍行为 |
| `apps/web/effect-card-system.js` | 为 anime / illustration 增加独立视觉风格标签 |
| `tests/visual-design-system.test.js` | 新增 Design Tokens、组件层、断点、无障碍和风格分类测试 |
| `PHASE11_VISUAL_DESIGN_SYSTEM_REPORT.md` | 本报告 |

## 4. Design Tokens

已建立并保留旧变量兼容映射，避免大规模重写：

- 颜色：`background`、`surface`、`surfaceElevated`、`border`、`textPrimary`、`textSecondary`、`primary`、`primaryHover`、`success`、`warning`、`danger`、`info`、`focus`
- 间距：4px 基础节奏，`space-0` 至 `space-16`
- 圆角：`xs`、`sm`、`md`、`lg`、`xl`、`pill`
- 阴影：`sm`、`md`、`lg`
- 布局：内容最大宽度 1440px、Header 72px、Sidebar 240px

新系统限定在 `body.consumer-app-page` 下，运营后台不受影响。

## 5. 统一组件

已对现有 DOM 和组件类进行统一，不创建第二套业务组件：

- `PrimaryButton`：粉紫主按钮及 hover / pressed / disabled 状态
- `SecondaryButton`：暗色表面和清晰边框
- `IconButton`：统一方形点击区域、圆角和焦点
- `Input` / `Textarea` / `Select`：统一背景、边框、占位符、错误和焦点
- `Tabs`：统一选中态和键盘焦点
- `Badge`：统一高度、圆角和语义颜色
- `Card`：暗紫表面、统一边框与层级
- `Modal`：遮罩、表面、焦点循环、Escape 关闭和焦点恢复
- `Toast`：统一语义提示色
- `EmptyState`：非误导性空状态
- `Skeleton`：统一加载动画并支持 reduced-motion

## 6. 卡片与媒体规则

### 效果卡

- 媒体区域统一为 4:3，信息位置与标签层级一致。
- 桌面指针设备才启用悬浮位移，移动端不依赖 hover。
- 缺少媒体时显示“预览准备中”，不显示纯黑空卡。
- 缺少 workflow 时保持“即将上线”，不显示立即生成。
- anime 和 illustration 分别显示“动漫”“插画”标签；真人写实内容作为默认主风格。

### 作品卡

- 保留用户媒体原始比例和内容，不对用户生成内容做视觉替换。
- 只统一卡片外壳、文字层级和操作区。

### 套餐卡

- 统一价格、积分、单位价格、标签和主操作层级。
- 不改变套餐配置和支付逻辑。

## 7. 响应式

统一断点：

- mobile：`0—639px`
- tablet：`640—1023px`
- desktop：`1024—1439px`
- wide：`1440px+`

实现内容：

- 移动端卡片与表单双列/多列布局收敛为单列。
- 页面容器使用统一安全内边距，fixed 操作考虑安全区。
- 控制文字换行、媒体宽度和主容器 `min-width: 0`，避免横向溢出。
- tablet 使用中等间距和两列网格。
- wide 限制内容最大宽度，避免 1920px 页面过度拉伸。

静态规则覆盖用户要求的 390×844、430×932、768×1024、1440×900、1920×1080。当前内置浏览器运行时固定提供 1280×720 视口，无法可靠切换到上述精确尺寸；因此本次完成了断点代码与自动化检查，并在 1280×720 对全部消费者页面进行了真实渲染和无横向溢出检查。精确尺寸截图仍需在支持设备模拟的浏览器环境补拍。

## 8. 无障碍

- 所有交互元素增加清晰的 `:focus-visible`。
- 动态弹层自动设置 `role="dialog"` 与 `aria-modal="true"`。
- 弹层打开后聚焦首个可操作元素，Tab 保持在弹层内，Escape 关闭，关闭后恢复原焦点。
- 无可聚焦子元素的弹层可聚焦自身。
- 具有 title 或 tooltip 的纯图标按钮自动补充 `aria-label`。
- 带 `data-field-error` 的表单错误自动关联 `aria-describedby` 和 `aria-invalid`。
- 尊重 `prefers-reduced-motion`。
- 主文字、辅助文字、边框和粉紫按钮使用统一对比层级。

## 9. 验证结果

### 自动化

| 检查 | 结果 |
|---|---|
| `npm run typecheck` | 通过 |
| `npm run build` | 通过 |
| `node --test tests/visual-design-system.test.js` | 5/5 通过 |
| `git diff --check` | 通过 |

构建仍输出历史遗留警告：部分旧脚本不是 module，以及少量 `home-assets` URL 在构建阶段无法解析。这些警告在本阶段之前已存在，不属于视觉系统改造范围，构建产物生成成功。

### 页面渲染

在 1280×720 浏览器视口逐页验证：

- 首页
- 辣味效果
- 图片编辑器
- AI 换脸
- 性感礼服
- 性爱姿势
- 图片转视频
- 我的作品
- 购买积分
- 免费积分

全部页面满足：

- 页面可打开
- Header / Sidebar / 浮动操作保持单实例
- 没有横向溢出
- 卡片高度和表面层级稳定
- 主 CTA 使用统一粉紫色
- 缺失媒体不显示破图或纯黑空卡

## 10. 截图

- `artifacts/phase11/home-desktop.png`
- `artifacts/phase11/spicy-effects-desktop.png`
- `artifacts/phase11/image-editor-desktop.png`
- `artifacts/phase11/face-swap-desktop.png`
- `artifacts/phase11/outfit-studio-desktop.png`
- `artifacts/phase11/pose-generator-desktop.png`
- `artifacts/phase11/image-to-video-desktop.png`
- `artifacts/phase11/my-creations-desktop.png`
- `artifacts/phase11/pricing-desktop.png`
- `artifacts/phase11/free-coins-desktop.png`

## 11. 未完成项与风险

1. **精确设备尺寸截图未完成**
   原因：当前内置浏览器视口固定为 1280×720，设置 viewport 未生效。
   处理建议：在支持 Chrome Device Mode 或可设置 viewport 的 CI 中补拍 390、430、768、1440、1920 五组截图。

2. **历史 CSS 仍然庞大**
   本阶段使用消费者作用域最终层收敛视觉，避免破坏已工作的页面和后台。旧规则仍存在，后续如清理必须逐页做视觉回归，不能一次性删除。

3. **真实效果媒体仍不足**
   当前 25 个效果均为 `preview_only`，没有经批准的 active workflow 预览。系统会诚实显示“预览准备中 / 即将上线”。待运营补齐来源、许可、真实预览和 workflow 后才能转为可生成状态。

4. **外部媒体可靠性**
   外部 URL 仍可能受 CORS、下线或网络质量影响，统一错误回退已生效，但不替代资源迁移和授权审计。

## 12. 下一任务依赖

- 真实媒体与 active workflow 上线前，需完成来源、许可证、状态和预览审核。
- 如需继续降低 CSS 维护成本，应以本阶段 tokens 为唯一标准，分页面迁移并保留截图回归。
- 在设备模拟环境补齐五个目标尺寸的视觉基线。
