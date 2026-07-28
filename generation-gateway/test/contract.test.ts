import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { listWorkflowManifests, parseCreativeBrief, routeWorkflow } from "../src/planning.js";
import { GenerationInputSchema } from "../src/domain.js";

test("all seven phase-1 workflow manifests are registered", () => {
  const ids = listWorkflowManifests()
    .filter((manifest) => manifest.status === "production")
    .map((manifest) => manifest.id);
  assert.deepEqual(ids.sort(), [
    "mock-effect-preset-v1",
    "mock-image-edit-v1",
    "mock-image-reference-pose-v1",
    "mock-image-single-closeup-v1",
    "mock-image-single-fullbody-v1",
    "mock-video-image-to-video-v1",
    "mock-video-text-to-video-v1",
  ]);
});

test("router retains candidates, reasons, fallbacks and version", () => {
  const input = GenerationInputSchema.parse({
    media_type: "image",
    creation_mode: "text_to_image",
    prompt: "close-up portrait",
    client_context: { app: "open-video-studio" },
  });
  const brief = parseCreativeBrief(input);
  const plan = routeWorkflow("job-1", "11111111-1111-4111-8111-111111111111", input, brief);
  assert.ok(plan.candidate_workflows.length >= 2);
  assert.ok(plan.routing_reasons.length > 0);
  assert.ok(plan.fallback_workflow_ids.length > 0);
  assert.equal(plan.router_version, "capability-router/1.1.0");
});

test("phase-2 real image workflow remains isolated in testing status", () => {
  const manifest = listWorkflowManifests().find((item) => item.id === "single-person-text-to-image-v1");
  assert.equal(manifest?.status, "testing");
  assert.deepEqual(manifest?.provider_ids, ["runpod"]);
});

test("migration enables RLS and contains owner predicates", async () => {
  const sql = await readFile(resolve(process.cwd(), "../supabase/migrations/20260727140524_generation_engine_foundation.sql"), "utf8");
  for (const table of ["generation_attempts", "generation_assets", "generation_events", "generation_reviews", "generation_billing_events"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /auth\.uid\(\).*user_id/s);
  assert.match(sql, /app_metadata/);
  assert.doesNotMatch(sql, /auth\.role\(\)/);
});

test("frontend gateway clients do not contain secret keys or concrete GPU endpoints", async () => {
  const files = [
    resolve(process.cwd(), "../apps/web/generation-gateway-client.js"),
    resolve(process.cwd(), "../../ai-marketing-studio/src/services/generation-gateway-service.js"),
  ];
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.doesNotMatch(source, /SERVICE_ROLE|RUNPOD_API_KEY|COMFYUI_API_KEY|ZEALMAN_API_TOKEN/);
  assert.doesNotMatch(source, /\/prompt|\/history|api\.runpod/);
});

test("open-video real test toggle sends only generic execution intent", async () => {
  const source = await readFile(resolve(process.cwd(), "../apps/web/app.js"), "utf8");
  const page = await readFile(resolve(process.cwd(), "../apps/web/generate.html"), "utf8");
  assert.match(page, /data-real-provider-mode/);
  assert.match(source, /execution_mode:\s*"real_test"/);
  assert.match(source, /visual_style:\s*"photorealistic"/);
  assert.doesNotMatch(source, /api\.runpod|RUNPOD_|COMFYUI_GATEWAY_URL|seetacloud/);
});

test("stored real assets are re-signed by the gateway after page refresh", async () => {
  const source = await readFile(resolve(process.cwd(), "../generation-gateway/src/repository.ts"), "utf8");
  assert.match(source, /createSignedUrl\(String\(stored\.storage_path\), 900\)/);
  assert.match(source, /ASSET_SIGNING_FAILED/);
});
