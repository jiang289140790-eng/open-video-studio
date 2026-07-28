# Reference Analyzer Specification

Status: **rules analyzer implemented; user confirmation required**

Schema:

- `people_count`
- `shot_type`
- `pose`
- `camera_angle`
- `composition`
- `scene`
- `lighting`
- `expression`
- `outfit`
- `visible_body_region`
- `preserve_candidates`
- `confidence`
- `analyzer_version`

The first implementation is `rules-reference-analyzer/1.0.0`. It accepts normalized observations, fills unknown fields explicitly, validates the complete output with Zod and assigns conservative confidence. It neither reads nor selects Provider configuration.

`POST /v1/reference-analyses` first verifies that the authenticated user owns the referenced asset. The response includes `requires_confirmation: true`. Generation is rejected unless:

- the analysis matches the fixed schema;
- `reference_analysis_confirmed` is true;
- exactly one person is reported;
- the request contains exactly one owned reference image;
- adult confirmation is explicit.

This rules version does not claim pixel-level computer vision accuracy. A future multimodal implementation may replace it behind the same schema.
