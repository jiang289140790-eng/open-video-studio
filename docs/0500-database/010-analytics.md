# Analytics

| Field | Value |
|---|---|
| Unique ID | DB-ANALYTICS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Analytics Data Owner |
| Dependencies | PB-012, PB-013, DB-USERS-001 |
| Referenced By | DB-AFFILIATE-001, DB-VIDEOS-001 |
| Cross References | ANALYTICS-INDEX-001, PB-012, PB-013, SEC-INDEX-001 |

## Purpose

Represent product, growth, workflow, AI quality, reliability, and business events used for analysis and decision-making.

## Requirements

- Track event identity, actor, object, timestamp, source, context, and privacy classification.
- Support product metrics without storing unnecessary sensitive data.
- Preserve compatibility with future warehouse or event pipeline architecture.

## Relationships

- Events may reference users, videos, images, prompts, credits, subscriptions, affiliate attribution, notifications, settings, and audit logs.
- May feed dashboards, experiments, growth analysis, and AI evaluation.

## Fields

- Event ID.
- Event name.
- Actor user or system reference.
- Workspace or account reference.
- Object type.
- Object reference.
- Event timestamp.
- Session or request reference.
- Source surface.
- Properties payload reference.
- Privacy classification.
- Ingestion status.
- Created timestamp.

## Indexes

- Event name plus event timestamp.
- Actor reference plus event timestamp.
- Object type plus object reference.
- Workspace or account reference plus event timestamp.
- Privacy classification.

## Lifecycle

Events are captured from product, backend, AI, automation, billing, and system processes. They may be validated, transformed, aggregated, retained, deleted, or anonymized.

## Permissions

Raw analytics access is restricted. Aggregated dashboards may be available by role. Sensitive or user-level analytics require privacy review.

## Retention

Retain according to analytics value, privacy classification, legal requirements, and customer commitments. Prefer aggregation and anonymization for long-term analysis.

## Future Expansion

Support experiment assignments, attribution models, warehouse sync, AI quality labels, funnel definitions, and metric governance.

## Acceptance Criteria

- Product success metrics can be measured without over-collecting sensitive data.
- Analytics events are separate from audit logs.

## Future Plan

Define event taxonomy and metric contracts in `docs/1200-analytics/` before implementation.

## AI Context

Analytics events are for measurement, not legal audit. Use `DB-AUDIT-LOGS-001` for authoritative security and compliance trails.
