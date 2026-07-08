# Agent Configs

| Field | Value |
|---|---|
| Unique ID | DB-AGENT-CONFIGS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | AI Product Lead / Backend Lead |
| Dependencies | DB-PROMPTS-001, DB-WORKFLOW-CONFIGS-001, DB-AUDIT-LOGS-001 |
| Referenced By | API-ADMIN-001, DOC-002 |
| Cross References | DB-WORKFLOW-CONFIGS-001, DB-PROMPTS-001, API-ADMIN-001 |

## Purpose

Define configurable AI agent behavior for operations workflows such as content analysis, creative direction, prompt assembly, and future campaign assistance.

## Owner

AI Product owns agent behavior. Backend owns execution safety and provider boundaries.

## Relationships

Agent configs reference prompts, tools, workflow configs, providers, and audit logs. Agents may create draft records but must not bypass user credits, moderation, or admin review rules.

## Fields

- `id`: Permanent config identifier.
- `agent_id`: Stable public-facing agent key.
- `name`: Human-readable label.
- `role`: Agent responsibility.
- `model_provider`: Provider abstraction key.
- `model_name`: Model or local worker name.
- `system_prompt`: Controlled instruction set.
- `temperature`: Model creativity setting.
- `max_tokens`: Output budget guardrail.
- `tools_enabled`: Allowed internal tools.
- `status`: `draft`, `testing`, `active`, or `disabled`.
- `created_at`, `updated_at`: Lifecycle timestamps.

## Indexes

Index by role and status for admin routing and operations review.

## Lifecycle

Agents start as draft, move to testing, then active. Disabled agents remain retained for audit and rollback context.

## Permissions

Admin and operator may read. Only admin may publish or disable agent configs. All writes require an operation reason and audit log.

## Retention

Keep historical configs needed to understand generated outputs, incidents, and prompt/model behavior.

## Future Expansion

Add version history, evaluation scores, sandbox execution logs, tool-call permissions, cost budgets, and model fallback rules.

## AI Context

Agents are configurable product capabilities, not autonomous platform owners. Any future automation must respect Product Bible scope, credits, moderation, and provider abstraction boundaries.
