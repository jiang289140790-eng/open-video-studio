import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AiAssetConfig, AssetDetail, AssetFile, AssetProvider, AssetType, DownloadResult } from "../types.js";

export class AssetDownloader {
  constructor(private readonly config: AiAssetConfig, private readonly fetchImpl: typeof fetch = fetch) {}

  async download(input: {
    provider: AssetProvider;
    providerId: string;
    name: string;
    type: AssetType;
    version?: string;
    file: AssetFile;
    detail?: AssetDetail;
  }): Promise<DownloadResult> {
    if (!input.file.downloadUrl) throw new Error("Selected asset file has no downloadUrl.");
    const fileName = sanitizeFileName(input.file.name || `${input.providerId}.safetensors`);
    const target = join(this.config.storageDir, input.provider, sanitizePathPart(input.providerId), sanitizePathPart(input.version ?? "main"), fileName);
    mkdirSync(dirname(target), { recursive: true });

    if (existsSync(target)) {
      const sha256 = await sha256File(target);
      if (!input.file.sha256 || sha256 === input.file.sha256.toLowerCase()) {
        return this.result(input, target, sha256, "skipped");
      }
    }

    const partPath = `${target}.part`;
    if (existsSync(partPath)) rmSync(partPath, { force: true });
    const response = await this.fetchImpl(input.file.downloadUrl, {
      headers: authHeaders(input.provider, this.config),
      redirect: "follow",
    });
    if (!response.ok || !response.body) throw new Error(`Download failed: HTTP ${response.status}`);

    await writeResponseBody(response, partPath);
    const sha256 = await sha256File(partPath);
    if (input.file.sha256 && sha256 !== input.file.sha256.toLowerCase()) {
      rmSync(partPath, { force: true });
      throw new Error("Downloaded file SHA256 did not match provider metadata.");
    }
    renameSync(partPath, target);
    return this.result(input, target, sha256, "downloaded");
  }

  private result(input: {
    provider: AssetProvider;
    providerId: string;
    name: string;
    type: AssetType;
    version?: string;
    file: AssetFile;
  }, storagePath: string, sha256: string, status: "downloaded" | "skipped"): DownloadResult {
    return {
      assetId: `${input.provider}:${input.providerId}:${input.version ?? "main"}:${sha256}`,
      provider: input.provider,
      providerId: input.providerId,
      name: input.name,
      type: input.type,
      version: input.version,
      downloadUrl: input.file.downloadUrl,
      storagePath,
      sha256,
      status,
    };
  }
}

export function selectDownloadFile(detail: AssetDetail, versionId?: string, fileId?: string): { versionId: string; file: AssetFile } {
  const version = versionId
    ? detail.versions.find((item) => item.id === versionId)
    : detail.versions[0];
  if (!version) throw new Error("Asset version was not found.");
  const file = fileId
    ? version.files.find((item) => String(item.id ?? item.name) === fileId)
    : version.files.find((item) => item.primary && item.downloadUrl)
      ?? version.files.find((item) => /\.(safetensors|ckpt|pt|json)$/i.test(item.name) && item.downloadUrl)
      ?? version.files.find((item) => item.downloadUrl);
  if (!file) throw new Error("No downloadable file found for this asset version.");
  return { versionId: version.id, file };
}

export async function sha256File(path: string): Promise<string> {
  const { createReadStream } = await import("node:fs");
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function writeResponseBody(response: Response, target: string): Promise<void> {
  const writer = createWriteStream(target);
  const reader = response.body!.getReader();
  let written = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      written += value.byteLength;
      if (!writer.write(Buffer.from(value))) {
        await new Promise<void>((resolve) => writer.once("drain", () => resolve()));
      }
    }
  } finally {
    writer.end();
  }
  await new Promise<void>((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
  if (written <= 0 || statSync(target).size <= 0) throw new Error("Downloaded file is empty.");
}

function authHeaders(provider: AssetProvider, config: AiAssetConfig): Record<string, string> {
  if (provider === "civitai" && config.civitaiApiToken) return { Authorization: `Bearer ${config.civitaiApiToken}` };
  if (provider === "huggingface" && config.hfToken) return { Authorization: `Bearer ${config.hfToken}` };
  return {};
}

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 180) || "asset.bin";
}

function sanitizePathPart(value: string): string {
  return sanitizeFileName(value).replace(/\s+/g, "_");
}
