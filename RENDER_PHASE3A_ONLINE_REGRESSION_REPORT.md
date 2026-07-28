# Render Phase 3A Online Regression Report

Status: `PASS`

## Deployment

- Service: `generation-gateway-staging`
- Branch: `codex/render-staging`
- Phase 3A regression deployment: `dep-d9ka6eugekts73cln95g`
- Phase 3A commit: `87f375e4baa4358ea2d95c478ebaac8caedd81ad`
- Phase 3B preparation deployment: `dep-d9kabcu417fc73eg50c0`
- Current deployed commit: `c87dfe51a5d4b3687435d155fe040d2c2de40169`
- Render state: `live`
- Supabase project reference confirmed from the service configuration: `wyvswkxogkmywduhrhkw`

The prior live deployment was older, so a new staging deployment was triggered through the Render API.

## Endpoint checks

- `GET /health`: HTTP 200, `status=ok`
- `GET /ready`: HTTP 200, `status=ready`

## Online Mock Reference Pipeline

The staging test performed:

1. temporary staging user and owned reference-asset metadata creation;
2. Phase 3A mock character creation;
3. Mock Analyzer execution;
4. persisted user confirmation;
5. reference Router and Workflow Plan;
6. Mock generation submission and polling;
7. terminal completion and asset verification;
8. test-user deletion, cascading all test records.

Result:

- analyzer: `mock-reference-analyzer/1.0.0`
- workflow: `mock-character-reference-remake-v1`
- final status: `completed`
- output assets: 2
- character binding: verified
- reference-asset binding: verified
- cleanup: verified

The request explicitly selected `mock_reference`. No real provider workflow, GPU, model, LoRA or checkpoint was invoked.

## Phase 3B online gate

After the preparation code was deployed, an authenticated admin check returned:

- overall: `READY_FOR_RESOURCES`
- base model, character LoRA, Workflow JSON and node mapping: `missing`
- AutoDL Worker: `unhealthy`
- Storage upload: `unverified`
- target workflow present in real allowlist: `false`
- resource attestation: `false`
- allowlist eligible: `false`

The temporary admin test user was deleted after verification.
