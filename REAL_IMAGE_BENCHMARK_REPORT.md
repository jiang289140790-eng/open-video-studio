# Real Image Benchmark Report

Date: 2026-07-28

Workflow: `single-person-text-to-image-v1`

Model binding: Persephone Flux 2.0 Q8

Status: **BLOCKED — 10-CASE RUN NOT COMPLETED**

## Smoke evidence

Real images have been generated; this is no longer a zero-output integration:

| Run | Result | Dimensions | Duration |
| --- | --- | --- | --- |
| direct Worker smoke 1 | completed | 1024×1024 | 25,266 ms |
| direct Worker smoke 2 | completed | 1024×1024 | 18,852 ms |
| Render online E2E | completed | 1024×1024 | persisted by Provider |
| Render retry E2E | completed | 1024×1024 | persisted by Provider |

Visual inspection of the first direct image found strong photorealistic face,
skin, lighting, and plausible visible hands. This is smoke evidence only and
is not sufficient for a model-quality acceptance claim.

## Frozen 10-case set

1. close-up editorial portrait
2. full-body standing portrait
3. hands holding an open book
4. outdoor street portrait
5. seated cafe scene
6. studio fashion portrait
7. low-angle social-media composition
8. seated living-room portrait
9. night city portrait
10. white-background commercial portrait

The executable benchmark uses one output per case to control staging cost,
alternating `1:1` and `4:5`. It records status, state transitions, dimensions,
duration, GPU type, Storage path, and cost fields.

## Required review rubric

Each completed image will receive 1–5 scores for:

- prompt alignment
- anatomy
- face
- hands
- scene fidelity
- composition

The report will also aggregate failure rate, total/median duration, output
dimensions, estimated cost, actual cost, and cost per output.

## Why no scores are reported

The AutoDL control panel currently shows the staging instance powered off.
SSH rejects connections and the public Worker route is unavailable. Reporting
scores without all 10 real outputs would violate the fixed benchmark rule.

In addition, `AUTODL_GPU_HOURLY_COST` remains zero. The dashboard shows a
separate daily storage charge, but no verified GPU hourly price was captured,
so `actual_cost` cannot yet be accepted.

## Resume action

Start the existing staging instance, keep it online for approximately
5–10 minutes, and provide or configure the actual GPU hourly price. The
prepared benchmark can then run, images can be reviewed, and all benchmark
objects can be removed from staging Storage.
