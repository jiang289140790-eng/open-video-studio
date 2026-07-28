# Real Image Benchmark Report

Date: 2026-07-28  
Status: **BLOCKED — 0 REAL IMAGES GENERATED**

The benchmark framework is fixed before model selection to avoid cherry-picking. No score is reported because the Endpoint, Worker, workflow and model files do not exist.

## Fixed prompt classes

| # | Prompt class | Primary review dimensions |
| --- | --- | --- |
| 1 | neutral studio headshot | face, skin, alignment |
| 2 | full-body daylight portrait | anatomy, hands, composition |
| 3 | seated indoor portrait | limbs, furniture interaction |
| 4 | walking street portrait | motion anatomy, scene |
| 5 | product-holding portrait | hands, object interaction |
| 6 | low-light cinematic portrait | lighting, face consistency |
| 7 | backlit outdoor portrait | exposure, hair edges |
| 8 | patterned clothing portrait | texture, anatomy, prompt detail |
| 9 | environmental workplace portrait | scene, composition, identity |
| 10 | close-up expressive portrait | expression, eyes, teeth, skin |

Each class must run the same frozen prompt at `1:1`; selected classes must also run at `4:5`. Target output is four images per class, with a minimum of one only when an explicit cost cap is recorded.

## Required measurements

- prompt alignment
- anatomy
- face
- hands
- scene fidelity
- composition
- generation duration
- provider failure rate
- actual and estimated cost
- cost per output
- output dimensions
- GPU type

## Current results

| Metric | Value |
| --- | --- |
| prompts executed | 0 / 10 |
| real outputs | 0 |
| success rate | not measured |
| failure rate | not measured |
| duration | not measured |
| cost | 0 (no provider request sent) |
| quality scores | not measured |

No model usability claim is made.

