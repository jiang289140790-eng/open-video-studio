# Reference Image E2E Report

Status: **BLOCKED — no real generation claimed**

## Passed

- Gateway Phase 3 contract tests: 5/5
- Full Gateway tests: 55/55
- Open Video Studio tests: 75/75
- Local Supabase tests: 80/80
- Online staging transactional role/isolation check: PASS
- Supabase staging migrations: 17/17
- Local full replay: PASS
- Phase 3 rollback and re-apply: PASS
- Render current Phase 2 deployment: live; `/health` = ok; `/ready` = ready
- Phase 3 is not allowlisted on Render
- RunPod Endpoint and API key are absent from Render

## Not run

- real reference-image submit/running/completed
- failed/timeout/cancelled/retry on the new workflow
- duplicate callback and cancellation/upload race on the new workflow
- real Storage input/output lifecycle
- real character similarity and pose preservation

## Blocking evidence

- AutoDL SSH `connect.westd.seetacloud.com:46294`: TCP unreachable.
- Previously known public Worker URL: HTTP 404.
- Real character LoRA file, checksum, source and license: unavailable.
- Executable reference-remake workflow JSON and node mapping: unavailable.

No Mock result was used as evidence for this report.
