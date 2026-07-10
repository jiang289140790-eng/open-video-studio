import { existsSync, rmSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AiAssetDatabase } from "./db.js";
import { CivitaiProvider } from "./providers/civitai.js";
import { GitHubProvider } from "./providers/github.js";
import { HuggingFaceProvider } from "./providers/huggingface.js";
import { LiblibProvider } from "./providers/liblib.js";
import { ComfyUiInstaller } from "./services/comfyuiInstaller.js";
import { AssetDownloader, selectDownloadFile } from "./services/downloader.js";
import type { AiAssetConfig, AssetDetail, AssetProvider, AssetType } from "./types.js";

const providerSchema = z.enum(["civitai", "huggingface", "github", "liblib"]);
const assetTypeSchema = z.enum(["lora", "checkpoint", "vae", "controlnet", "upscale", "embedding", "workflow", "unknown"]);

export function createAiAssetMcpServer(config: AiAssetConfig): McpServer {
  const db = new AiAssetDatabase(config.dbPath);
  const civitai = new CivitaiProvider(config);
  const hf = new HuggingFaceProvider(config);
  const github = new GitHubProvider();
  const liblib = new LiblibProvider(config);
  const downloader = new AssetDownloader(config);
  const installer = new ComfyUiInstaller(config);
  const server = new McpServer({ name: "ai-assets", version: "0.1.0" });

  server.registerTool("search_assets", {
    title: "Search AI assets",
    description: "Search AI model or workflow assets across Civitai and Hugging Face. GitHub is reserved; Liblib returns capability information.",
    inputSchema: {
      provider: providerSchema,
      query: z.string().optional(),
      type: assetTypeSchema.optional(),
      baseModel: z.string().optional(),
      sort: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    },
  }, async (input) => jsonResult(await searchAssets(input)));

  server.registerTool("get_asset_detail", {
    title: "Get AI asset detail",
    description: "Get provider-specific asset details, versions, files, trigger words, and download URLs.",
    inputSchema: {
      provider: providerSchema,
      id: z.string().min(1),
    },
  }, async (input) => jsonResult(await getAssetDetail(input.provider, input.id)));

  server.registerTool("download_asset", {
    title: "Download AI asset",
    description: "Download a Civitai or Hugging Face asset file to local asset storage and record it in SQLite.",
    inputSchema: {
      provider: providerSchema,
      assetId: z.string().min(1),
      versionId: z.string().optional(),
      fileId: z.string().optional(),
    },
  }, async (input) => jsonResult(await downloadAsset(input.provider, input.assetId, input.versionId, input.fileId)));

  server.registerTool("install_to_comfyui", {
    title: "Install asset to ComfyUI",
    description: "Install a downloaded local file into the matching ComfyUI directory and update SQLite if known.",
    inputSchema: {
      localFile: z.string().min(1),
      assetType: assetTypeSchema,
    },
  }, async (input) => {
    const result = await installer.install(input.localFile, input.assetType);
    const record = db.markInstalledByStoragePath(input.localFile, result.localPath);
    return jsonResult({ ...result, record });
  });

  server.registerTool("list_local_assets", {
    title: "List local AI assets",
    description: "List downloaded or installed assets from the local SQLite database.",
    inputSchema: {
      type: assetTypeSchema.optional(),
      baseModel: z.string().optional(),
      provider: providerSchema.optional(),
    },
  }, async (input) => jsonResult({ assets: db.listAssets(input) }));

  server.registerTool("remove_asset", {
    title: "Remove local AI asset",
    description: "Delete local files for an asset and mark its SQLite record as removed.",
    inputSchema: {
      assetId: z.string().min(1),
    },
  }, async (input) => {
    const asset = db.getAsset(input.assetId);
    if (!asset) throw new Error("Asset not found.");
    for (const path of [asset.local_path, asset.storage_path]) {
      if (path && existsSync(path)) rmSync(path, { force: true });
    }
    return jsonResult({ asset: db.removeAsset(input.assetId) });
  });

  server.registerTool("call_liblib_template", {
    title: "Call Liblib template",
    description: "Submit a Liblib template generation request and record the template run in SQLite.",
    inputSchema: {
      templateUuid: z.string().min(1),
      prompt: z.string().min(1),
      params: z.record(z.string(), z.unknown()).optional(),
    },
  }, async (input) => {
    const raw = await liblib.callTemplate(input.templateUuid, input.prompt, input.params ?? {});
    const taskId = String(raw?.data?.generateUuid || raw?.generateUuid || raw?.data?.generate_uuid || "");
    db.recordLiblibTemplate({ templateUuid: input.templateUuid, prompt: input.prompt, params: input.params ?? {}, raw, taskId });
    return jsonResult({ taskId, raw });
  });

  async function searchAssets(input: {
    provider: AssetProvider;
    query?: string;
    type?: AssetType;
    baseModel?: string;
    sort?: string;
    limit?: number;
  }) {
    if (input.provider === "civitai") return { assets: await civitai.search(input) };
    if (input.provider === "huggingface") return { assets: await hf.search(input) };
    if (input.provider === "github") return { assets: await github.search(input), capability: github.capability() };
    return { assets: [], capability: liblib.capability() };
  }

  async function getAssetDetail(provider: AssetProvider, id: string) {
    if (provider === "civitai") return await civitai.detail(id);
    if (provider === "huggingface") return await hf.detail(id);
    if (provider === "github") return github.capability();
    return liblib.capability();
  }

  async function downloadAsset(provider: AssetProvider, assetId: string, versionId?: string, fileId?: string) {
    if (provider !== "civitai" && provider !== "huggingface") {
      throw new Error(`${provider} does not support asset downloads in v1.`);
    }
    const detail: AssetDetail = provider === "civitai" ? await civitai.detail(assetId) : await hf.detail(assetId);
    const selected = selectDownloadFile(detail, versionId, fileId);
    const download = await downloader.download({
      provider,
      providerId: detail.providerId,
      name: detail.name,
      type: detail.type,
      version: selected.versionId,
      file: selected.file,
      detail,
    });
    const record = db.upsertDownloaded(download, detail);
    return { download, record };
  }

  return server;
}

function jsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}
