import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadAiAssetConfig } from "../src/mcp/ai-assets/config.js";
import { AiAssetDatabase } from "../src/mcp/ai-assets/db.js";
import { normalizeCivitaiDetail, normalizeCivitaiSearchResult } from "../src/mcp/ai-assets/providers/civitai.js";
import { hmacSha1Base64Url } from "../src/mcp/ai-assets/providers/liblib.js";
import { ComfyUiInstaller, comfyDirForType } from "../src/mcp/ai-assets/services/comfyuiInstaller.js";
import { AssetDownloader } from "../src/mcp/ai-assets/services/downloader.js";
import type { AiAssetConfig, AssetDetail } from "../src/mcp/ai-assets/types.js";

test("AI Asset MCP server exposes the planned tools and env placeholders", () => {
  const root = process.cwd();
  const serverSource = readFileSync(join(root, "src", "mcp", "ai-assets", "server.ts"), "utf8");
  const mcpConfig = readFileSync(join(root, ".mcp.json"), "utf8");
  const envExample = readFileSync(join(root, ".env.example"), "utf8");
  const readme = readFileSync(join(root, "README.md"), "utf8");

  for (const tool of [
    "search_assets",
    "get_asset_detail",
    "download_asset",
    "install_to_comfyui",
    "list_local_assets",
    "remove_asset",
    "call_liblib_template",
  ]) {
    assert.ok(serverSource.includes(tool), `${tool} should be registered`);
    assert.ok(readme.includes(tool), `${tool} should be documented`);
  }

  for (const key of ["CIVITAI_API_TOKEN", "HF_TOKEN", "LIBLIB_ACCESS_KEY", "LIBLIB_SECRET_KEY", "COMFYUI_ROOT", "ASSET_STORAGE_DIR", "AI_ASSET_DB_PATH"]) {
    assert.ok(envExample.includes(`${key}=`), `${key} should be in env examples`);
    assert.ok(mcpConfig.includes(key), `${key} should be in MCP config`);
  }
});

test("Civitai normalizers map model search and detail into asset records", () => {
  const search = normalizeCivitaiSearchResult({
    id: 123,
    name: "Flux Portrait LoRA",
    type: "LORA",
    tags: ["flux", "portrait"],
    stats: { downloadCount: 9001, rating: 4.9 },
    modelVersions: [{ id: 456, baseModel: "Flux.1 D" }],
  });
  assert.equal(search.provider, "civitai");
  assert.equal(search.providerId, "123");
  assert.equal(search.type, "lora");
  assert.equal(search.baseModel, "Flux.1 D");

  const detail = normalizeCivitaiDetail({
    id: 123,
    name: "Flux Portrait LoRA",
    type: "LORA",
    tags: ["flux"],
    modelVersions: [{
      id: 456,
      name: "v1",
      baseModel: "Flux",
      trainedWords: ["portrait_style"],
      files: [{
        id: 789,
        name: "flux_portrait.safetensors",
        primary: true,
        downloadUrl: "https://example.test/model",
        hashes: { SHA256: "ABCDEF" },
      }],
    }],
  });
  assert.equal(detail.versions[0].files[0].sha256, "abcdef");
  assert.deepEqual(detail.versions[0].triggerWords, ["portrait_style"]);
});

test("downloader, SQLite, and ComfyUI installer complete a local asset loop", async () => {
  const root = mkdtempSync(join(tmpdir(), "ai-assets-"));
  const config: AiAssetConfig = {
    liblibBaseUrl: "https://openapi.liblibai.cloud",
    storageDir: join(root, "downloads"),
    dbPath: join(root, "assets.sqlite"),
    comfyuiRoot: join(root, "ComfyUI"),
  };
  const payload = Buffer.from("fake model bytes");
  const fetchImpl = async () => new Response(payload, { status: 200 });
  const downloader = new AssetDownloader(config, fetchImpl as typeof fetch);
  const db = new AiAssetDatabase(config.dbPath);
  const detail: AssetDetail = {
    provider: "civitai",
    providerId: "123",
    name: "Tiny LoRA",
    type: "lora",
    baseModel: "Flux",
    tags: ["test"],
    versions: [{
      id: "456",
      name: "v1",
      baseModel: "Flux",
      triggerWords: ["tiny"],
      files: [{ id: "file", name: "tiny.safetensors", downloadUrl: "https://example.test/tiny.safetensors", primary: true }],
      raw: {},
    }],
    raw: {},
  };

  const downloaded = await downloader.download({
    provider: "civitai",
    providerId: "123",
    name: "Tiny LoRA",
    type: "lora",
    version: "456",
    file: detail.versions[0].files[0],
    detail,
  });
  const record = db.upsertDownloaded(downloaded, detail);
  assert.equal(record.status, "downloaded");
  assert.equal(db.listAssets({ type: "lora", provider: "civitai" }).length, 1);

  const installer = new ComfyUiInstaller(config);
  const installed = await installer.install(downloaded.storagePath, "lora");
  const updated = db.markInstalledByStoragePath(downloaded.storagePath, installed.localPath);
  assert.equal(updated?.status, "installed");
  assert.ok(installed.localPath.endsWith(join("models", "loras", "tiny.safetensors")));

  const removed = db.removeAsset(record.id);
  assert.equal(removed?.status, "removed");
  db.close();
});

test("ComfyUI directory mapping covers model and workflow asset types", () => {
  assert.equal(comfyDirForType("lora"), join("models", "loras"));
  assert.equal(comfyDirForType("checkpoint"), join("models", "checkpoints"));
  assert.equal(comfyDirForType("workflow"), join("user", "default", "workflows"));
  assert.throws(() => comfyDirForType("unknown"), /Unsupported/);
});

test("Liblib HMAC signature is URL-safe and does not include the secret", async () => {
  const secret = "secret-value";
  const signature = await hmacSha1Base64Url(secret, "/api/generate/webui/text2img&123&nonce");
  assert.match(signature, /^[A-Za-z0-9_-]+$/);
  assert.equal(signature.includes(secret), false);
});

test("AI asset config reads defaults without real secrets", () => {
  const root = mkdtempSync(join(tmpdir(), "ai-assets-config-"));
  const config = loadAiAssetConfig({}, root);
  assert.equal(config.liblibBaseUrl, "https://openapi.liblibai.cloud");
  assert.ok(config.storageDir.endsWith(join(".data", "ai-assets", "downloads")));
  assert.equal(config.civitaiApiToken, undefined);
  assert.equal(config.liblibSecretKey, undefined);
});
