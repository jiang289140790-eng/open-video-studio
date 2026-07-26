# Phase 10 — Free Credits and Referral System

## 结论

Phase 10 已完成本地兼容实现与静态/构建验证。奖励不再由浏览器直接增加余额；每日签到、首次成功生成、有效推荐和作品分享统一由 Supabase Edge Function 核验，并通过服务端专用 PostgreSQL 函数原子写入现有 `credit_transactions` 账本。

本阶段没有执行生产迁移、Edge Function 部署、GitHub push 或真实付款。

## 现状审计与根因

### 积分类型

当前系统已经可通过 `credit_transactions.source_type` 和 `operation_category` 区分：

| 类型 | 现有记录方式 |
|---|---|
| 购买积分 | `source_type=order`、`operation_category=grant` |
| 奖励积分 | Phase 10 统一为 `source_type=reward`、`operation_category=reward` |
| 退款积分 | `source_type=generation_refund`、`operation_category=refund` |
| 管理员调整 | `source_type=admin_adjustment`、`operation_category=admin_grant/admin_deduct` |

余额仍以 `credit_transactions` 中 `status=posted` 的 `balance_impact` 汇总为准，没有建立第二套余额系统，也没有修改已有用户余额。

### 原问题

1. 每日签到在 `apps/web/app.js` 中直接执行 `state.credits += reward`，只保存在浏览器。
2. “任务奖励”按钮可直接领取演示积分，没有核验真实任务或推荐状态。
3. `referral_codes`、`referral_events` 已存在，但生产策略允许认证客户端直接插入推荐事件。
4. 推荐事件没有“每个被推荐用户只归因一次”的唯一约束。
5. 没有签到/首次生成/分享奖励的统一幂等记录。
6. 分享奖励没有每作品一次和每日上限控制。
7. 免费积分页面部分中文文件存在编码损坏。

## 修改文件

- `apps/web/app.js`
  - 捕获 `?ref=` 推荐参数。
  - 创建匿名设备标识并仅向服务端提交哈希来源。
  - 登录后完成一次性推荐归因。
  - 接入 `reward-program-status`、`claim-daily-checkin`。
  - 删除浏览器本地直接领取任务积分的逻辑。
  - 分享私密作品前要求明确确认。
  - 分享成功后刷新真实积分余额。
- `apps/web/free-coins.html`
  - 修复中文编码。
  - 展示签到、推荐、首次生成、分享的真实规则与状态。
  - 推荐统计改为点击、注册、有效推荐、已发奖励。
- `apps/web/referral.html`
  - 合并到统一的免费积分/推荐中心，避免两套状态页面。
- `apps/web/styles.css`
  - 增加已完成、可领取、锁定状态。
  - 增加免费积分页移动端紧凑布局。
- `supabase/functions/ai/index.ts`
  - 新增推荐点击、归因、奖励状态、签到操作。
  - 首次成功生成后自动核验奖励。
  - 有效推荐在验证及首次成功生成条件满足后发奖。
  - 分享奖励按作品幂等并受每日上限约束。
- `supabase/migrations/202607260003_free_credits_referrals.sql`
  - 新增 `reward_claims`。
  - 补齐推荐事件状态、来源、时间、风控和奖励事务字段。
  - 增加归因、点击和奖励唯一约束。
  - 新增 service-role-only 原子奖励函数。
- `tests/reward-program.test.js`
  - 覆盖原子性、幂等、服务端核验和前端禁止本地发奖。
- `artifacts/phase10/free-credits-desktop.png`
  - 本地桌面页面验收截图。

## 实现规则

### 每日签到

- 统一使用 UTC 自然日。
- 一天一次，数据库唯一键防重复。
- 连续天数以最近连续 UTC 日期计算；中断后从 Day 1 重新开始。
- 默认 7 天配置沿用现有页面：`5, 6, 12, 6, 8, 8, 20`。
- 可从已发布的 `site_settings.reward_program_config` 覆盖。
- 并发请求通过事务级 advisory lock 和唯一约束保证只发一次。

### 首次生成

- 仅查询 `generation_jobs.status=completed`。
- 真实任务完成后自动调用奖励同步。
- 每用户固定幂等键 `first_generation:once`。
- 失败任务不触发。

### 推荐

- 推荐码由服务端创建。
- `referred_user_id` 只允许一次归因。
- 禁止推荐自己。
- 需要已验证用户；当前配置默认还要求首次成功生成。
- 同设备出现多个被推荐账户时进入 `risk_review`，不立即发奖。
- 页面显示点击、注册、有效推荐和已发奖励。
- 推荐点击按“推荐码 + 设备哈希 + UTC 日期”去重。

### 分享

- 私密作品创建分享链接前必须明确确认。
- 每个作品最多奖励一次。
- 默认每次 5 积分、每日最多 10 积分。
- 分享撤销和作品删除继续沿用现有 `share_links` 失效逻辑。
- 当前规则是“创建有效分享链接即发奖”；没有将访问量作为奖励条件，因此自己的访问不会产生奖励。

### 奖励积分限制

- 已支持从配置读取奖励额度、推荐是否要求首次生成、分享每日上限。
- 当前没有启用有效期、基础模型限制或奖励积分每日使用额度，避免擅自改变已有余额与消费顺序。

## 验证结果

| 检查 | 结果 |
|---|---|
| `npm run typecheck` | 通过 |
| `npm run build` | 通过 |
| `node --test tests/reward-program.test.js` | 4/4 通过 |
| `git diff --check` | 通过 |
| 桌面页面打开与无乱码检查 | 通过 |
| 本地截图 | `artifacts/phase10/free-credits-desktop.png` |

构建仍显示项目原有的非模块脚本和部分首页媒体路径警告，本阶段没有扩大范围修改。

## 验收覆盖

- 连续签到：状态算法与配置测试通过。
- 重复/并发签到：唯一约束 + advisory lock。
- 首次成功生成：仅 completed 任务触发。
- 失败生成：不会发放首次生成奖励。
- 推荐自己：服务端拒绝。
- 有效推荐：验证 + 可配置首次生成条件。
- 重复推荐：`referred_user_id` 唯一归因。
- 分享奖励：每作品一次 + UTC 日上限。
- 并发请求：奖励类型级事务锁 + 唯一键。

## 未完成项与上线依赖

1. 尚未将 `202607260003_free_credits_referrals.sql` 应用到生产库。
2. 尚未部署更新后的 `ai` Edge Function。
3. 因以上两项未部署，未执行生产账户的真实并发领取、OAuth 验证归因和真实积分回写测试。
4. 当前浏览器验收工具没有切换到 390×844/430×932 的真实视口，因此移动端只完成 CSS 构建审查，仍需部署前用真实设备或可设视口的测试环境复核。
5. 生产 Supabase 审计同时发现 45 个运营后台/Laravel 表未启用 RLS。它们不属于 Phase 10 消费者奖励表，未自动修改；这是独立的高优先级安全风险，需要逐表确认访问策略后处理。

## 下一任务依赖

1. 人工审核并应用 Phase 10 迁移。
2. 部署 `supabase/functions/ai`。
3. 使用两个经过验证的测试账号完成推荐链路。
4. 使用并发请求验证同一天签到、同作品分享和重复推荐只发一次。
5. 核对 `reward_program_config` 的正式额度后再向用户发布规则。
