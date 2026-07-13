import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

const root = process.cwd();
const templateRoot = join(root, "templates", "comfyui-headless");

test("headless runtime preserves the existing Zealman contract", () => {
  const gateway = readFileSync(join(templateRoot, "gateway", "main.py"), "utf8");
  const dockerfile = readFileSync(join(templateRoot, "Dockerfile"), "utf8");
  for (const route of [
    "/api/health",
    "/api/workflows/download/{filename}",
    "/api/workflow/generate",
    "/upload/image",
    "/history/{prompt_id}",
    "/view",
  ]) {
    assert.ok(gateway.includes(route), `gateway should implement ${route}`);
  }
  assert.ok(gateway.includes("HEADLESS_API_TOKEN"));
  assert.ok(gateway.includes("Invalid authorization token"));
  assert.ok(dockerfile.includes("8f40b43e0204d5b9780f3e9618e140e929e80594"), "ComfyUI must be pinned");
  assert.ok(dockerfile.includes("nvidia/cuda"));
  assert.equal(gateway.includes("service_role"), false);
});

test("ComfyUI application images restore the protected gateway on startup", () => {
  const autostart = readFileSync(join(templateRoot, "autostart-custom-node", "__init__.py"), "utf8");
  assert.ok(autostart.includes("runtime.env"));
  assert.ok(autostart.includes("/api/health"));
  assert.ok(autostart.includes("GATEWAY_REPLACE_PORT_OWNER"));
  assert.ok(autostart.includes("GATEWAY_PUBLIC_HOST"));
  assert.ok(autostart.includes("CADDY_BINARY"));
  assert.ok(autostart.includes("start_new_session=True"));
  assert.ok(autostart.includes("NODE_CLASS_MAPPINGS"));
  assert.equal(autostart.includes("service_role"), false);
});

test("headless runtime terminates TLS at the gateway boundary", () => {
  const caddyfile = readFileSync(join(templateRoot, "Caddyfile"), "utf8");
  assert.ok(caddyfile.includes("{$GATEWAY_PUBLIC_HOST}"));
  assert.ok(caddyfile.includes("reverse_proxy 127.0.0.1:{$GATEWAY_PORT:7860}"));
  assert.ok(caddyfile.includes("Strict-Transport-Security"));
});

test("workflow manifest contains the qualified AutoDL workflow set without raw exports", () => {
  const manifest = JSON.parse(readFileSync(join(templateRoot, "workflow-manifest.json"), "utf8"));
  assert.deepEqual(manifest.workflows.map((item: any) => item.id), ["A01", "A01-compshare", "C16", "D14", "G01", "G03", "J11"]);
  assert.equal(new Set(manifest.workflows.map((item: any) => item.id)).size, 7);
  assert.equal(manifest.workflows.find((item: any) => item.id === "A01").promptNodeId, "187");
  assert.equal(manifest.workflows.find((item: any) => item.id === "A01-compshare").promptNodeId, "4");
  assert.equal(manifest.workflows.find((item: any) => item.id === "G01").referenceImageNodeId, "145");
  assert.ok(manifest.requiredCustomNodeModules.includes("ComfyUI-WanVideoWrapper"));
  assert.ok(manifest.requiredCustomNodeModules.includes("seedvr2_videoupscaler"));
});

test("CompShare UCloud signing matches the official SDK algorithm", async () => {
  const source = readFileSync(join(root, "supabase", "functions", "_shared", "compshare.ts"), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
  }).outputText;
  const module = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

  assert.equal(
    await module.createUCloudSignature({ foo: "bar" }, "my_private_key"),
    "634edc1bb957c0d65e5ab5494cf3b7784fbc87af",
  );
  assert.deepEqual(module.flattenUCloudParams({ Disks: [{ IsBoot: true, Size: 100 }] }), {
    "Disks.0.IsBoot": "true",
    "Disks.0.Size": "100",
  });
});

test("AI Edge Function starts and schedules the optional CompShare runtime", () => {
  const edge = readFileSync(join(root, "supabase", "functions", "ai", "index.ts"), "utf8");
  assert.ok(edge.includes("ensureCompShareInstanceReady"));
  assert.ok(edge.includes("scheduleCompShareShutdown"));
  assert.ok(edge.includes("COMPSHARE_INSTANCE_ID"));
  assert.ok(edge.includes("COMPSHARE_PROJECT_ID"));
  assert.ok(edge.includes("COMPSHARE_IDLE_SHUTDOWN_SECONDS"));
  assert.ok(edge.includes("outputHeaders: zealmanHeaders(env, false)"));
  assert.ok(edge.includes("safeObject(result.outputHeaders)"));
  assert.ok(edge.indexOf("ensureCompShareRuntime(env)") < edge.indexOf("fetchZealmanWorkflow(env, workflowName)"));
});
