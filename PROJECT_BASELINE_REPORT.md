# Open Video Studio 项目基线报告

日期：2026-07-26

## 结论

项目唯一代码源、远端 commit、GitHub Pages workflow、线上入口和实际页面已完成只读核验。

总体状态：`BLOCKED`

原因不是部署不可访问。当前线上页面已经是 commit `b049c817...` 构建出的消费者首页，并已达到 `ONLINE_VERIFIED`；总体仍为 `BLOCKED`，因为 lint 脚本不存在、完整测试仍有 12 项失败、构建存在资源警告，且工作区仍有服务器与迁移修改未提交。

## 代码与部署基线

| 项目 | 状态 | 结果 |
|---|---|---|
| 唯一源码目录 | `IMPLEMENTED_LOCAL` | `C:\Users\admin\Documents\工作流模型\_repo` |
| 分支 | `PUSHED` | `main` |
| 本地 commit | `PUSHED` | `b049c817c18c34b8f6856c6a7f6556ece4a2f7c1` |
| origin/main | `PUSHED` | `b049c817c18c34b8f6856c6a7f6556ece4a2f7c1` |
| Pages 部署 commit | `DEPLOYED` | `b049c817c18c34b8f6856c6a7f6556ece4a2f7c1` |
| Pages Run | `DEPLOYED` | `30195176257` |
| 线上入口 | `ONLINE_VERIFIED` | `https://jiang289140790-eng.github.io/open-video-studio/app.html` |

## GitHub Pages 实际来源

`main` 分支 push

→ `.github/workflows/deploy-pages.yml`

→ `npm ci`

→ `npm run build`

→ `apps/web` 作为 Vite root

→ `dist-web`

→ Pages artifact

→ `actions/deploy-pages`

Pages API 的 `/docs` 是兼容 source 字段，不是当前 workflow 上传的实际目录。当前实际发布内容为 `dist-web` artifact。

## 线上核验

状态：`ONLINE_VERIFIED`

真实浏览器读取到：

- URL：`https://jiang289140790-eng.github.io/open-video-studio/app.html`
- Title：`AI 图片与视频生成 | Luravyn`
- H1：`上传一张图片，选择效果，开始创作`
- 首页上传组件：存在
- 热门效果组件：存在
- `effect-catalog.js`：线上已加载
- `effect-card-system.js`：线上已加载

没有仅凭本地文件或 Actions 状态写入 `ONLINE_VERIFIED`。

## 验证命令结果

| 命令 | 状态 | 结果 |
|---|---|---|
| `npm install` | `IMPLEMENTED_LOCAL` | 成功，up to date |
| `npm run typecheck` | `BUILD_PASSED` | 成功 |
| `npm run lint` | `BLOCKED` | Missing script: `lint` |
| `npm run build` | `BUILD_PASSED` | 成功 |
| `npm test` | `BLOCKED` | 63/75 通过，12 项失败 |
| `git diff --check` | `BUILD_PASSED` | 成功 |

## 测试失败分类

### 静态前端契约

状态：`BLOCKED`

- `referral.html` 共享样式契约不满足。
- 缺少旧测试要求的“立即购买”文字。
- 缺少旧测试要求的 `pricing_cta_clicked`。
- 根页面仍存在旧的非本地化路径。
- 旧筛选器 hook 不匹配。
- 旧工作台、作品中心、奖励中心与结账选择器不匹配。

### 支付页面契约

状态：`BLOCKED`

- 旧测试要求浏览器脚本包含 `VITE_STRIPE_PUBLISHABLE_KEY`。
- 旧测试要求价格页包含特定旧中文标题。

### SEO

状态：`BLOCKED`

- `pricing.html` 缺少旧测试要求的 canonical 元数据。

本任务只做基线收敛，没有修改这些功能或测试。

## 构建警告

状态：`BLOCKED`

- 多个 `api-service.js`、`effect-catalog.js`、`effect-card-system.js` 和 `spicy-effects-data.js` 以普通脚本加载，Vite不能将其作为模块打包。
- `ovs-home-01.png` 至 `ovs-home-12.png` 在构建期无法解析，运行时路径仍需保证存在。

## 工作区状态

状态：`IMPLEMENTED_LOCAL`

已有未提交修改被完整保留：

- 两个 Supabase Edge Function 源文件被修改。
- 多份 Phase/生产报告未跟踪。
- artifacts、screenshots、reports 目录未跟踪。
- 五项本地数据库迁移未跟踪。
- 三项新增测试未跟踪。
- 两份本任务基线报告未跟踪。

本任务未提交、未推送、未应用这些改动。

## 资源风险

状态：`BLOCKED`

- C: 可用空间约 8.48 GB。
- 本次按用户要求完成了安装、构建和测试。
- 后续在执行媒体生成、重复构建或安装大型依赖前，应先释放系统盘空间。

## 本任务实际修改

状态：`IMPLEMENTED_LOCAL`

仅新增：

- `PROJECT_BASELINE.md`
- `PROJECT_BASELINE_REPORT.md`

未新增页面、功能或工作流；未修改 AutoDL、Supabase数据库结构、运营后台或 `dist-web` 源码。

## 停止点

本报告完成后停止。

下一任务开始前，应以 `PROJECT_BASELINE.md` 为唯一基线，不应从 `remote-update`、旧副本或 `dist-web` 反向修改源码。
