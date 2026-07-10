import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import type { AiAssetConfig, AssetType } from "../types.js";
import { sha256File } from "./downloader.js";

export class ComfyUiInstaller {
  constructor(private readonly config: AiAssetConfig) {}

  async install(localFile: string, assetType: AssetType): Promise<{ localPath: string; status: "installed" | "skipped" }> {
    if (!this.config.comfyuiRoot) throw new Error("COMFYUI_ROOT is not configured.");
    if (!existsSync(localFile)) throw new Error(`Local file does not exist: ${localFile}`);
    const relativeDir = comfyDirForType(assetType);
    const targetDir = join(this.config.comfyuiRoot, relativeDir);
    mkdirSync(targetDir, { recursive: true });
    const target = join(targetDir, basename(localFile));
    if (existsSync(target)) {
      const [sourceHash, targetHash] = await Promise.all([sha256File(localFile), sha256File(target)]);
      if (sourceHash === targetHash) return { localPath: target, status: "skipped" };
      rmSync(target, { force: true });
    }
    copyFileSync(localFile, target);
    return { localPath: target, status: "installed" };
  }
}

export function comfyDirForType(assetType: AssetType): string {
  const mapping: Partial<Record<AssetType, string>> = {
    lora: join("models", "loras"),
    checkpoint: join("models", "checkpoints"),
    vae: join("models", "vae"),
    controlnet: join("models", "controlnet"),
    upscale: join("models", "upscale_models"),
    embedding: join("models", "embeddings"),
    workflow: join("user", "default", "workflows"),
  };
  const dir = mapping[assetType];
  if (!dir) throw new Error(`Unsupported ComfyUI asset type: ${assetType}`);
  return dir;
}
