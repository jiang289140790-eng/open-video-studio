# AI Storage Abstraction

| Field | Value |
|---|---|
| Unique ID | AI-STORAGE-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | AI Infrastructure Lead / Media Platform Lead |
| Dependencies | ADR-005, BE-ARCH-STORAGE-001, DB-MEDIA-ASSETS-001 |
| Referenced By | AI-INDEX-001 |

## Purpose

Define provider-neutral storage behavior for AI inputs, outputs, and intermediate artifacts.

## Requirements

- Support local storage now.
- Support future Cloudflare R2, S3, and Supabase Storage adapters.
- Keep binary storage separate from database metadata.
- Avoid provider-specific storage assumptions in AI providers.

## Architecture

The AI storage interface supports putting, reading, deleting, and optionally resolving public URLs for objects. The current implementation includes a local adapter and not-configured placeholders for future cloud storage.

The deployed Supabase AI Edge Function now stores real provider outputs as media objects when the provider returns an `outputUrl` or base64 payload. URL outputs are downloaded server-side and written to Supabase Storage as image/video files; base64 outputs are decoded and written as binary objects. If a provider returns only structured metadata, the function falls back to the existing JSON metadata object so Fake Worker and probe flows remain stable.

## Acceptance Criteria

- AI workers can use storage through an adapter interface.
- Future object storage providers can be added without changing AI provider contracts.

## Future Plan

Add signed upload/download URLs, storage lifecycle rules, encryption policy, CDN strategy, and provider-specific object metadata mapping.

## AI Context

Storage is a boundary. Do not couple provider outputs directly to one storage vendor.
