# 生产数据流端到端验证报告

## 测试范围

验证链路：测试内容 → Publish Task → Telegram 发布模拟 → `content_metrics` → `publish_metrics` → Performance Service → Dashboard 数据模型。

## 执行结果

本次使用事务隔离的测试夹具，未调用真实 Telegram API、未使用真实用户数据，事务结束后已回滚。

| 步骤 | 结果 | 说明 |
|---|---|---|
| 创建测试内容 | 通过 | 在 `content_items` 创建并标记为已完成/待发布流程 |
| 创建 Publish Task | 通过 | 使用现有 `agent_tasks`，`task_type=publishing` |
| Telegram 发布 | 模拟通过 | 写入模拟 Telegram 发布结果，不发送外部消息 |
| 写入 `content_metrics` | 通过 | 写入曝光、浏览、互动、点击、注册、收入、成本 |
| 写入 `publish_metrics` | 通过 | 写入平台、外部帖子 ID、点击、转化、收入、成本 |
| Performance Service 数据映射 | 通过 | 发布行继承对应内容指标的 `signups` 和 `content_ref` |
| Growth/Performance 数据模型 | 通过 | 构建产物包含真实表查询和汇总逻辑 |
| 清理测试数据 | 通过 | 事务回滚后所有夹具记录计数为 0 |

## 验证样例

事务内断言结果：

- `content_created=1`
- `task_status=completed`
- `content_metric_views=800`
- `content_metric_signups=12`
- `publish_platform=telegram`
- `publish_metric_clicks=120`
- `publish_metric_revenue_cents=900`

## 安全检查

- 未将 service role key 放入前端。
- 测试夹具使用事务回滚，未污染生产表。
- 真实 Dashboard 查询仍通过当前 Supabase Auth session，并由 RLS 限制用户数据范围。
- 未修改登录、生成 API、Workflow、Automation 或 Agent 业务逻辑。

## 构建验证

- `npm run typecheck`：通过。
- `npm run build`：通过。
- `git diff --check`：通过。

## 限制与后续现场验证

当前生产 `auth.users` 没有可用登录用户，且本次未发送真实 Telegram 消息，因此无法在已登录浏览器中完成最后一步“页面实时刷新后显示指标”的现场验收。登录一个真实账号并产生一条真实发布记录后，Performance Dashboard 和 Growth Dashboard 会通过同一 Service 读取对应数据；建议随后用该账号做一次小额、可撤销的 Telegram 测试并截图留档。
