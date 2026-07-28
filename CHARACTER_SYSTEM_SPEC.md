# Character System Specification

Status: **database and Gateway validation implemented**

## Tables

- `characters`: existing owner-scoped table extended with adult verification, model/LoRA binding, tested weight range, trigger words, reference asset IDs and Phase 3 lifecycle status.
- `character_versions`: immutable version records.
- `character_reference_assets`: owner-scoped identity, preview and benchmark asset associations.
- `character_lora_bindings`: versioned LoRA bindings and selected weight.

Allowed Phase 3 lifecycle states are `draft`, `testing`, `production`, `deprecated`, and `disabled`. Existing legacy `active` rows are preserved for compatibility, but the Generation Gateway never routes them.

## Adult gate

A `testing` or `production` character must have:

- `is_adult = true`
- `declared_age >= 18`
- non-null base model, LoRA ID and LoRA version
- a default LoRA weight inside the configured min/max range

The Gateway independently verifies the same conditions from the trusted service-side character record. Client-provided age or LoRA metadata is not trusted.

## Access model

- Ordinary authenticated users may read only their own character rows and related records.
- Ordinary users cannot insert or mutate trusted adult, model or LoRA binding metadata through the Data API.
- Admin/operator may read all rows.
- `service_role` performs controlled management writes.
- `anon` has no table privileges.

The public character API returns only `id`, `display_name`, and `status`.
