export type AssetProvider = "civitai" | "huggingface" | "github" | "liblib";

export type AssetType =
  | "lora"
  | "checkpoint"
  | "vae"
  | "controlnet"
  | "upscale"
  | "embedding"
  | "workflow"
  | "unknown";

export interface AiAssetConfig {
  civitaiApiToken?: string;
  hfToken?: string;
  liblibAccessKey?: string;
  liblibSecretKey?: string;
  liblibBaseUrl: string;
  comfyuiRoot?: string;
  storageDir: string;
  dbPath: string;
}

export interface SearchAssetsInput {
  provider: AssetProvider;
  query?: string;
  type?: AssetType;
  baseModel?: string;
  sort?: string;
  limit?: number;
}

export interface AssetSearchResult {
  provider: AssetProvider;
  providerId: string;
  name: string;
  type: AssetType;
  baseModel?: string;
  version?: string;
  downloadCount?: number;
  rating?: number;
  nsfwLevel?: string;
  tags: string[];
  raw: unknown;
}

export interface AssetFile {
  id?: string | number;
  name: string;
  sizeKb?: number;
  downloadUrl?: string;
  sha256?: string;
  type?: string;
  primary?: boolean;
}

export interface AssetVersion {
  id: string;
  name: string;
  baseModel?: string;
  triggerWords: string[];
  files: AssetFile[];
  raw: unknown;
}

export interface AssetDetail {
  provider: AssetProvider;
  providerId: string;
  name: string;
  type: AssetType;
  baseModel?: string;
  tags: string[];
  nsfwLevel?: string;
  license?: string;
  versions: AssetVersion[];
  raw: unknown;
}

export interface DownloadResult {
  assetId: string;
  provider: AssetProvider;
  providerId: string;
  name: string;
  type: AssetType;
  version?: string;
  downloadUrl?: string;
  storagePath: string;
  sha256: string;
  status: "downloaded" | "skipped";
}

export interface LocalAssetRecord {
  id: string;
  provider: AssetProvider;
  provider_id: string;
  name: string;
  type: AssetType;
  base_model?: string;
  version?: string;
  download_url?: string;
  storage_path?: string;
  local_path?: string;
  trigger_words: string;
  tags: string;
  nsfw_level?: string;
  license?: string;
  sha256?: string;
  status: string;
  raw_json: string;
  created_at: string;
  updated_at: string;
}
