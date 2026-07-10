import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { AiAssetConfig } from "./types.js";

export function loadAiAssetConfig(env = process.env, cwd = process.cwd()): AiAssetConfig {
  const fileEnv = readLocalEnv(cwd);
  const value = (key: string, fallback = "") => fileEnv[key] ?? env[key] ?? fallback;
  return {
    civitaiApiToken: emptyToUndefined(value("CIVITAI_API_TOKEN") || value("CIVITAI_API_KEY")),
    hfToken: emptyToUndefined(value("HF_TOKEN") || value("HUGGINGFACE_TOKEN")),
    liblibAccessKey: emptyToUndefined(value("LIBLIB_ACCESS_KEY")),
    liblibSecretKey: emptyToUndefined(value("LIBLIB_SECRET_KEY")),
    liblibBaseUrl: value("LIBLIB_BASE_URL", "https://openapi.liblibai.cloud"),
    comfyuiRoot: emptyToUndefined(value("COMFYUI_ROOT")),
    storageDir: resolve(cwd, value("ASSET_STORAGE_DIR", join(".data", "ai-assets", "downloads"))),
    dbPath: resolve(cwd, value("AI_ASSET_DB_PATH", join(".data", "ai-assets", "assets.sqlite"))),
  };
}

function readLocalEnv(cwd: string): Record<string, string> {
  const envPath = join(cwd, ".env.local");
  if (!existsSync(envPath)) return {};
  const output: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    output[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return output;
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
