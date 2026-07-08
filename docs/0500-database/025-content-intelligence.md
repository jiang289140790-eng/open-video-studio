# Content Intelligence

| Field | Value |
|---|---|
| Unique ID | DB-CONTENT-INTELLIGENCE-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Growth Operations Lead / AI Product Lead |
| Dependencies | DB-PROMPTS-001, DB-GENERATION-JOBS-001, DB-AUDIT-LOGS-001 |
| Referenced By | API-ADMIN-001, DOC-002 |
| Cross References | DB-PROMPTS-001, DB-ANALYTICS-001, API-ADMIN-001 |

## Purpose

Store analyzed external or internal content signals that can become reusable creative inputs for prompts, campaigns, assets, and platform-specific posts.

## Owner

Growth Operations owns source selection and review. AI Product owns analysis schema and reuse strategy.

## Relationships

Content intelligence can reference prompts, generation jobs, assets, campaigns, and audit logs. It must not directly publish user-facing content without review.

## Fields

- `id`: Permanent record identifier.
- `source_platform`: Origin platform such as X, TikTok, YouTube, Reddit, or internal.
- `source_url`: Optional source link.
- `account_name`: Creator or account source.
- `post_text`: Captured source text or summary.
- `media_urls`: Source media references.
- `analysis_json`: Structured model or operator analysis.
- `hook`: Reusable opening idea.
- `topic`: Content theme.
- `target_audience`: Intended audience segment.
- `content_angle`: Creative angle.
- `reusable_strategy`: How the signal becomes reusable assets, prompts, or posts.
- `generated_post_variants`: Candidate platform outputs.
- `status`: `new`, `analyzed`, `approved`, or `archived`.
- `created_at`, `updated_at`: Lifecycle timestamps.

## Indexes

Index by source platform and status for operations review. Add topic/search indexes only after real ingestion volume exists.

## Lifecycle

Records begin as imported or manually created signals, move to analyzed, then approved for reuse or archived. All production publishing decisions remain outside this table.

## Permissions

Admin and operator roles may read. Admin writes must be audited. Future automated ingestion must use a scoped service account.

## Retention

Retain approved records while they influence reusable creative assets. Archive or delete source records when rights, privacy, or platform policy requires it.

## Future Expansion

Add deduplication, vector search, rights classification, source reliability, performance feedback, and model-generated insight versions.

## AI Context

AI agents may use this table to summarize trends and propose prompts, but must treat records as inputs requiring review, not as automatic publication authority.
