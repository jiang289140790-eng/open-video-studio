# Videos

| Field | Value |
|---|---|
| Unique ID | DB-VIDEOS-001 |
| Version | 1.2.0 |
| Status | Active |
| Owner | Video Platform Data Owner |
| Dependencies | PB-008, DB-USERS-001, DB-MEDIA-ASSETS-001, DB-PROMPTS-001, DB-CREDITS-001 |
| Referenced By | DB-ANALYTICS-001, DB-AUDIT-LOGS-001, DB-NOTIFICATIONS-001 |
| Cross References | PB-008, PB-009, PB-010, DB-MEDIA-ASSETS-001 |

## Purpose

Represent editable and exportable video artifacts in Open Video Studio.

## Requirements

- Track ownership, project context, timeline state reference, render/export state, generation provenance, and lifecycle.
- Support drafts, versions, rendered outputs, review states, and published-ready exports.
- Preserve enough metadata for analytics, collaboration, billing, and audit.

## Relationships

- Owned by a user or workspace.
- Uses media assets, images, prompts, characters, settings, credits, analytics events, notifications, and audit logs.
- May have future relationships to projects, timelines, versions, comments, approvals, and exports.

## Fields

- Video ID.
- Owner user or workspace reference.
- Project reference.
- Generation job reference.
- Character reference.
- Title.
- Description.
- Status.
- Timeline reference.
- Primary media asset reference.
- Thumbnail image reference.
- Duration metadata.
- Format and aspect ratio metadata.
- Generation or source type.
- Review status.
- Export status.
- Created timestamp.
- Updated timestamp.
- Deleted or archived timestamp.

## Indexes

- Owner reference plus updated timestamp.
- Project reference.
- Status.
- Review status.
- Export status.
- Created timestamp.

## Lifecycle

Videos move from draft to edited, reviewed, approved, exported, archived, or deleted. Generated videos may include prompt and model provenance.

## Permissions

Access follows owner, workspace, project, and review permissions. Export, deletion, sharing, and approval require stronger permissions than view access.

## Retention

Retain active videos while projects exist. Archived videos may move to lower-cost storage. Deleted videos follow user deletion, billing, legal, and audit rules.

## Future Expansion

Add versions, comments, timeline schema, export records, render jobs, approval workflows, external publishing references, and performance feedback.

## Acceptance Criteria

- Video lifecycle can be referenced by frontend, backend, AI, media, and analytics systems.
- Future implementation can separate editable state from rendered deliverables.

## Current Implementation

`ADR-004` adds local video records for completed video generation jobs. Sprint 2 records owner, project, media asset, generation job, character, title, status, duration, aspect ratio, review status, export status, visibility, and timestamps.

## Future Plan

Create dedicated documents for projects, timelines, video versions, renders, exports, comments, and approvals.

## AI Context

Do not collapse video, timeline, render, and export into one concept. This document defines the high-level video artifact only.
