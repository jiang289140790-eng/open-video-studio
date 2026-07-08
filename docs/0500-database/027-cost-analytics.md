# Cost Analytics

| Field | Value |
|---|---|
| Unique ID | DB-COST-ANALYTICS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Finance Operations Lead / Backend Lead |
| Dependencies | DB-GENERATION-JOBS-001, DB-AI-COST-RECORDS-001, DB-CREDITS-001 |
| Referenced By | API-ADMIN-001, DOC-002 |
| Cross References | DB-GENERATION-JOBS-001, DB-AI-COST-RECORDS-001, DB-CREDITS-001, API-ADMIN-001 |

## Purpose

Track operational cost and margin by tool, provider, model, and workflow so the SaaS can protect gross margin before connecting real AI providers.

## Owner

Finance Operations owns margin interpretation. Backend owns accurate cost capture and derivation.

## Relationships

Cost analytics derives from generation jobs, AI cost records, credit ledger entries, provider metadata, and worker telemetry.

## Fields

- `id`: Permanent analytics record identifier.
- `tool_slug`: Tool or product surface.
- `provider`: AI provider key.
- `model_workflow`: Model or workflow identifier.
- `total_jobs`: Total completed, failed, or cancelled jobs in the window.
- `success_jobs`: Successful jobs.
- `failed_jobs`: Failed jobs.
- `total_credit_charged`: Credits charged to users.
- `estimated_api_cost`: Estimated provider API cost.
- `estimated_gpu_cost`: Estimated GPU or worker cost.
- `gross_profit`: Credit revenue proxy minus estimated costs.
- `profit_margin`: Derived margin percentage.
- `captured_at`: Snapshot timestamp.

## Indexes

Index by tool, provider, and capture time for dashboard queries.

## Lifecycle

MVP data may be derived live from generation jobs. Production snapshots should be captured on a scheduled cadence after real provider costs are available.

## Permissions

Admin and operator may read summary data. Only system jobs should write analytics snapshots.

## Retention

Retain monthly aggregates long term. Keep raw cost detail according to finance, privacy, and audit requirements.

## Future Expansion

Add cohort margin, pricing simulation, provider fallback cost comparison, GPU utilization, anomaly detection, and alert thresholds.

## AI Context

AI assistants may use cost analytics to suggest pricing or provider changes, but final business decisions require product and finance review.
