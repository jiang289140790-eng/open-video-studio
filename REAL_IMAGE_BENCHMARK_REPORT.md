# Real Image Benchmark Report

Date: 2026-07-28

Workflow: `single-person-text-to-image-v1`

Model binding: Persephone Flux 2.0 Q8

Status: **PASS WITH QUALITY LIMITATIONS**

## Technical results

| Metric | Result |
| --- | --- |
| prompt classes | 10 |
| outputs per class | 1 |
| completed | 10/10 |
| failed | 0 |
| failure rate | 0% |
| wall time | 165.381 s |
| total GPU generation time | 152.330 s |
| mean / median generation | 15.233 s / 15.333 s |
| min / max generation | 12.615 s / 17.484 s |
| output sizes | 5×1024×1024, 5×768×960 |
| configured GPU price | ¥2.78/hour |
| proportional attributed cost | ¥0.11763259 |
| mean attributed cost/output | ¥0.01176326 |

The proportional cost is task attribution from measured GPU time. The actual
AutoDL invoice may charge a complete billing hour; that platform charge must
be reconciled against the AutoDL bill rather than inferred from one task.

## Manual image review

Scores use 1–5, where 5 means no visible issue.

| Case | Align | Anatomy | Face | Hands | Scene | Comp. | Main finding |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| close-up portrait | 5 | 5 | 5 | 5 | 4 | 5 | strong skin and face detail |
| full-body standing | 5 | 5 | 4 | 4 | 5 | 5 | stable bedroom full-body result |
| hands and book | 5 | 5 | 5 | 4 | 5 | 5 | hands plausible; book text synthetic |
| outdoor street | 4 | 4 | 4 | 4 | 5 | 4 | lower legs/feet cropped |
| cafe scene | 5 | 5 | 5 | 4 | 5 | 5 | cup interaction and hands stable |
| studio fashion | 5 | 5 | 4 | 5 | 5 | 5 | clean red-gown studio composition |
| low-angle selfie | 3 | 4 | 5 | 4 | 5 | 4 | tilted/high-angle, not true low-angle |
| seated living room | 5 | 5 | 5 | 4 | 5 | 5 | good seated anatomy and scene |
| night city | 5 | 5 | 5 | 5 | 5 | 5 | strong lighting and prompt match |
| white background | 3 | 4 | 1 | 4 | 5 | 2 | face cropped; framing misses waist-up |

Dimension averages:

- prompt alignment: 4.5
- anatomy: 4.7
- face: 4.3
- hands: 4.3
- scene fidelity: 4.9
- composition: 4.5
- overall: 4.53/5

## Decision

The model/workflow is suitable for the Phase 2 single-person photorealistic
T2I staging chain. It is not accepted as a general composition-control model:
low-angle intent and strict commercial framing need later workflow controls.
No image-to-image, pose control, character LoRA, or style LoRA capability is
claimed.

All 10 benchmark objects, 10 Worker state files, 10 remote review copies, and
10 local review copies were deleted after scoring.
