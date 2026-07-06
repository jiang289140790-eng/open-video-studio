# Share Links

| Field | Value |
|---|---|
| Unique ID | DB-SHARE-LINKS-001 |
| Version | 1.0.0 |
| Status | Active |
| Owner | Media Platform Data Owner |
| Dependencies | DB-USERS-001, DB-MEDIA-ASSETS-001 |
| Referenced By | DB-BIBLE-001, ADR-004 |
| Cross References | API-GALLERY-001, DB-MEDIA-ASSETS-001, SEC-INDEX-001 |

## Purpose

Represent public sharing handles for approved media assets.

## Owner

Media Platform Data Owner.

## Relationships

- Belongs to an owner user.
- References one media asset.
- Exposes public lookup through gallery sharing behavior.

## Fields

- Share link ID.
- Owner user reference.
- Media asset reference.
- Public token.
- Visibility status.
- Created timestamp.
- Revoked timestamp.

## Indexes

- Owner reference plus created timestamp.
- Media asset reference.
- Unique public token.

## Lifecycle

Share links are created for approved assets, used for public lookup, and may be revoked. Sharing should update asset visibility consistently.

## Permissions

Only asset owners or authorized workspace members may create or revoke share links. Public token access must return only approved and public assets.

## Retention

Retain active links while assets are public. Revoked links may be retained for audit and abuse investigation.

## Future Expansion

Support expiration, password protection, domain allowlists, analytics, watermarking, signed URLs, revocation reasons, and abuse reporting.

## AI Context

Public sharing is a trust boundary. Never expose private, unapproved, restricted, or deleted assets through share links.
