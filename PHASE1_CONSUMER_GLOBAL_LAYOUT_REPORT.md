# Phase 1 — Consumer Frontend Global Layout Cleanup

## 任务边界

- 仅处理消费者前台的 AppShell、Header、Sidebar、GlobalFloatingActions、SupportChatWidget、页面主容器和响应式导航。
- 不修改生成 API、工作流、积分扣减、支付、Supabase 数据库结构或 AI Marketing Studio 后台业务逻辑。
- 工作区中原有的 `apps/web/app.js` 性能数据接入修改、`src/services/`、性能迁移和生产报告属于其他任务，本任务保留且不改写其业务逻辑。

## 现状审计与根因（修改前）

### 1. 公共布局来源

- 消费者页面是 Vite 多页面应用，不是运行时 SPA 路由。
- `apps/web/app.html`、`spicy-effects.html`、`tool.html`、`my-creations.html` 自带完整 Header 和 Sidebar。
- `image-editor.html`、`face-swap.html`、`outfit-studio.html`、`pose-generator.html`、`image-to-video.html`、`pricing.html`、`free-coins.html` 等页面自带 Header，但依赖 `apps/web/app.js` 的 `injectAppShell()` 补充 Sidebar。
- `apps/web/app.js` 的 `injectTopNavigation()`、`injectAppShell()`、`injectFloatingDock()` 和 `injectGlobalFooter()` 又在运行时改写或补充公共布局。
- `apps/web/styles.css` 同时存在早期固定侧栏规则和后期 `.app-layout` 内嵌侧栏规则，断点与容器计算彼此覆盖。

### 2. 右侧浮动按钮重复/遮挡根因

- 当前源码中浮动 Dock 的直接创建点是 `apps/web/app.js::injectFloatingDock()`，虽然通过 `.floating-dock` 查询做了基础去重，但没有一个明确的消费者 AppShell 所有权边界。
- “每日奖励”和“免费积分”同时存在于 Header、页面内容和浮动 Dock；客服头像也被放进 `.floating-dock`，视觉上形成一整列重复入口。
- 移动端旧样式将 Dock 中所有按钮平铺在右下角，没有“更多”收纳，也没有为底部生成按钮和安全区留出稳定空间。
- 返回顶部按钮缺少基于滚动距离的显示状态管理。

### 3. 左侧导航在长页面中看似重复的根因

- 部分消费者页面在 HTML 内渲染 `.side-rail`，其他页面由 `injectAppShell()` 注入，公共导航存在两种来源。
- `styles.css` 中既有 `position: fixed` 的全局 `.side-rail`，又有 `.app-layout > .side-rail { position: relative }`，不同 DOM 结构应用不同版本。
- 页面 Footer 还包含一套大量工具和运营入口，长页面底部会再次出现导航式内容；这不是同一组件重复挂载，但会造成“第二套导航”的视觉感受。
- 旧注入导航把消费者工具、创作者工作流、运营后台和辅助配置混在同一个侧栏中，超出消费者前台边界。

### 4. 路由和挂载审计

- 消费者页面使用传统多页面跳转，页面切换会完整卸载当前文档，因此没有 React/Vue 路由切换后组件未卸载的问题。
- `history.replaceState()` 只用于同一工具页面内更新查询参数，不会重新挂载公共布局。
- `MutationObserver` 只负责标准化内部链接，不负责创建 Header、Sidebar 或 FloatingActions。
- 风险来自同一文档内“页面静态公共布局 + 运行时公共布局”并存，而不是跨路由累积。

### 5. 本阶段兼容方案

- 新增一个消费者专用、幂等的 AppShell 运行时组件，统一接管 Header、ConsumerSidebar、MainContent、GlobalFloatingActions 和 SupportChatWidget。
- 消费者页面加载时移除旧页面级 Sidebar，复用或建立唯一 Header，并把页面业务内容放入唯一 MainContent。
- AI Marketing Studio/运营页面继续使用原有后台布局注入逻辑，不删除后台页面或业务代码。
- GlobalFloatingActions 在桌面端只保留免费积分、分享、帮助和按滚动状态出现的返回顶部；客服头像独立。
- 移动端 Sidebar 改为抽屉，浮动操作缩减为“免费积分 + 更多”。

## 修改文件

- `apps/web/consumer-shell.js`
  - 新增消费者前台唯一 AppShell 运行时。
  - 统一 Header、ConsumerSidebar、MainContent、GlobalFloatingActions、SupportChatWidget 和移动抽屉。
- `apps/web/app.js`
  - 消费者页面优先交给统一 AppShell；后台页面继续使用原注入逻辑。
  - 消费者登录后账户菜单不再展示运营后台入口。
  - 消费者 Footer 移除控制台、审核、排期、数据分析、发布、自动化和设置入口。
- `apps/web/styles.css`
  - 新增消费者 AppShell 桌面端、移动端、抽屉、浮动操作、tooltip 和安全区样式。
  - 修复 tooltip 通用定位覆盖客服头像 fixed 定位的问题。
- `scripts/copy-web-assets.mjs`
  - 构建产物补充复制 `consumer-shell.js`，兼容现有静态页面部署方式。
- `PHASE1_CONSUMER_GLOBAL_LAYOUT_REPORT.md`
  - 记录审计、根因、实现和验证。
- `docs/screenshots/phase1-consumer-layout/`
  - 保存本阶段视觉验收截图。

## 实现内容

### 统一 AppShell

消费者页面运行后统一为：

```text
AppShell
├── Header
├── ConsumerSidebar
├── MainContent
├── GlobalFloatingActions
└── SupportChatWidget
```

- 每次加载先清理页面级旧 Sidebar 和重复 Header，再建立唯一公共布局。
- 初始化函数为幂等实现；页面切换采用现有多页面导航，不引入第二套路由。
- `tool.html?tool=...` 根据工具查询参数高亮对应 Sidebar 项。
- 后台页面不进入消费者 AppShell，保留现有运营后台业务和导航。

### ConsumerSidebar

只保留：

- 首页
- 辣味效果
- 图片编辑器
- AI 换脸
- 性感礼服
- 性爱姿势
- 图片转视频
- 我的作品

底部保留：

- 推荐好友
- 立即升级

消费者 Sidebar、账户菜单和 Footer 均不展示 AI Marketing Studio 运营入口。

### Header

- 保留 Logo、图像工具、视频工具、购买积分、免费积分、我的作品、每日奖励、语言和登录/用户菜单。
- 下拉菜单限制最大宽度和高度，超出时内部滚动。
- 未登录继续使用原有“登录”入口；登录后继续使用现有 Auth 状态渲染头像和用户菜单。
- 移动端只显示 Logo、积分入口和菜单按钮。

### GlobalFloatingActions

- 桌面端：免费积分、分享、帮助、返回顶部。
- 返回顶部在滚动超过 480px 后显示，回到顶部后隐藏。
- 客服头像作为独立 `SupportChatWidget` 固定在右下角。
- 移动端只显示“免费积分 + 更多”两个入口；分享、帮助、返回顶部收进更多菜单。
- 所有桌面浮动入口包含 tooltip。
- 帮助弹窗沿用现有单例逻辑，打开前会清理旧弹窗。

### 响应式

- 小于 1024px 时 Sidebar 变为左侧抽屉。
- 抽屉包含消费者导航、账户入口、推荐好友和立即升级。
- fixed 元素使用 `env(safe-area-inset-*)` 计算安全区。
- 390px 和 430px 视口下无横向滚动，浮动操作不覆盖主要创建按钮。

## 验证结果

### 命令验证

- `npm run typecheck`：通过。
- `npm run build`：通过。
- `git diff --check`：通过。
- 构建仍会显示项目原有的非模块脚本和图片运行时解析警告；本阶段没有新增相关警告。

### 页面唯一性验证（1440×900）

逐页检查：

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

全部页面结果：

- Header：1
- ConsumerSidebar：1
- GlobalFloatingActions：1
- SupportChatWidget：1
- 横向滚动：无
- 工具页当前路由高亮：正确

购买积分和免费积分不属于 Sidebar 的八个工具入口，因此不设置 Sidebar 高亮。

### 页面切换和刷新

- 首页 → 辣味效果 → 姿势生成器连续切换后，每页公共组件数量仍为 1。
- 工具页面重新加载后公共组件数量仍为 1。
- `MutationObserver` 只处理链接标准化，不会再次创建 AppShell。

### 浮动操作

- 页面顶部返回顶部按钮隐藏。
- 页面下滑至 770px 时返回顶部按钮显示。
- 点击后页面回到 0px，按钮重新隐藏。
- 帮助入口唯一，打开后 `.support-overlay` 数量为 1，关闭后为 0。
- tooltip 缺失数量为 0。

### 响应式

- 1920×1080：辣味效果页 Header/Sidebar/浮动操作均唯一，无横向滚动。
- 1440×900：10 个验收页面全部无横向滚动。
- 390×844：10 个验收页面全部无横向滚动，桌面浮动入口为 0，移动浮动入口为 2。
- 430×932：10 个验收页面全部无横向滚动，桌面浮动入口为 0，移动浮动入口为 2。
- 移动抽屉打开后 `aria-expanded=true`，Sidebar 位于视口内。
- 客服头像在 430×932 下固定于右下安全区内。

## 截图路径

- `docs/screenshots/phase1-consumer-layout/home-1440x900.png`
- `docs/screenshots/phase1-consumer-layout/spicy-effects-1920x1080.png`
- `docs/screenshots/phase1-consumer-layout/home-mobile-drawer-390x844.png`
- `docs/screenshots/phase1-consumer-layout/image-editor-mobile-430x932.png`

## 未完成项

- 未执行 GitHub push 或生产部署，符合任务边界。
- 未修改 Supabase Auth、积分、订单、生成任务、Storage、RLS、支付或生成 API。
- 没有可用的真实登录测试账号，因此本阶段通过现有 `renderAccountNavigation()` 代码路径确认登录后头像/菜单结构被保留，没有执行真实 OAuth 登录。
- 本地无 Supabase 环境配置时，“我的作品”页面会暴露一个本阶段之前已存在的 `creationFilter` 初始化顺序错误。它属于作品数据渲染逻辑，不是 AppShell 重复挂载根因，本阶段未越界修改；公共布局唯一性和响应式检查仍通过。

## 下一任务依赖

- 后续消费者页面改造应复用 `consumer-shell.js`，不要在页面 HTML 中新增第二套 Header、Sidebar 或 FloatingActions。
- 若后续整理“我的作品”内容页，应先修复 `creationFilter` 的初始化顺序并补充真实 Supabase Session 下的页面验证。
- 若发布到 GitHub Pages，应沿用现有构建脚本；`consumer-shell.js` 已加入静态资源复制清单。
