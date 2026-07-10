import type { AiAssetConfig, AssetDetail, AssetFile, AssetSearchResult, AssetType, AssetVersion, SearchAssetsInput } from "../types.js";

const CIVITAI_BASE_URL = "https://civitai.com";

export class CivitaiProvider {
  constructor(private readonly config: AiAssetConfig, private readonly fetchImpl: typeof fetch = fetch) {}

  async search(input: SearchAssetsInput): Promise<AssetSearchResult[]> {
    const params = new URLSearchParams();
    if (input.query) params.set("query", input.query);
    const civitaiType = toCivitaiType(input.type);
    if (civitaiType) params.set("types", civitaiType);
    if (input.baseModel) params.set("baseModels", input.baseModel);
    params.set("limit", String(clampLimit(input.limit)));
    params.set("sort", toCivitaiSort(input.sort));
    const data = await this.getJson(`${CIVITAI_BASE_URL}/api/v1/models?${params.toString()}`);
    const items = Array.isArray(data?.items) ? data.items : [];
    return items.map((item: any) => normalizeCivitaiSearchResult(item));
  }

  async detail(modelId: string): Promise<AssetDetail> {
    const data = await this.getJson(`${CIVITAI_BASE_URL}/api/v1/models/${encodeURIComponent(modelId)}`);
    return normalizeCivitaiDetail(data);
  }

  async version(modelVersionId: string): Promise<AssetVersion> {
    const data = await this.getJson(`${CIVITAI_BASE_URL}/api/v1/model-versions/${encodeURIComponent(modelVersionId)}`);
    return normalizeCivitaiVersion(data);
  }

  private async getJson(url: string): Promise<any> {
    const response = await this.fetchImpl(url, {
      headers: {
        Accept: "application/json",
        ...(this.config.civitaiApiToken ? { Authorization: `Bearer ${this.config.civitaiApiToken}` } : {}),
      },
    });
    if (!response.ok) throw new Error(`Civitai request failed: HTTP ${response.status}`);
    return response.json();
  }
}

export function normalizeCivitaiSearchResult(item: any): AssetSearchResult {
  const latestVersion = Array.isArray(item.modelVersions) ? item.modelVersions[0] : undefined;
  const stats = item.stats ?? {};
  return {
    provider: "civitai",
    providerId: String(item.id ?? ""),
    name: String(item.name ?? "Untitled Civitai asset"),
    type: fromCivitaiType(item.type),
    baseModel: latestVersion?.baseModel ? String(latestVersion.baseModel) : undefined,
    version: latestVersion?.id ? String(latestVersion.id) : undefined,
    downloadCount: Number(stats.downloadCount ?? stats.downloads ?? 0),
    rating: Number(stats.rating ?? 0),
    nsfwLevel: item.nsfwLevel !== undefined ? String(item.nsfwLevel) : String(Boolean(item.nsfw)),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    raw: item,
  };
}

export function normalizeCivitaiDetail(data: any): AssetDetail {
  const versions = Array.isArray(data?.modelVersions) ? data.modelVersions.map(normalizeCivitaiVersion) : [];
  return {
    provider: "civitai",
    providerId: String(data?.id ?? ""),
    name: String(data?.name ?? "Untitled Civitai asset"),
    type: fromCivitaiType(data?.type),
    baseModel: versions[0]?.baseModel,
    tags: Array.isArray(data?.tags) ? data.tags.map(String) : [],
    nsfwLevel: data?.nsfwLevel !== undefined ? String(data.nsfwLevel) : String(Boolean(data?.nsfw)),
    license: data?.allowCommercialUse ? String(data.allowCommercialUse) : undefined,
    versions,
    raw: data,
  };
}

export function normalizeCivitaiVersion(version: any): AssetVersion {
  return {
    id: String(version?.id ?? ""),
    name: String(version?.name ?? "default"),
    baseModel: version?.baseModel ? String(version.baseModel) : undefined,
    triggerWords: Array.isArray(version?.trainedWords) ? version.trainedWords.map(String) : [],
    files: Array.isArray(version?.files) ? version.files.map(normalizeCivitaiFile) : [],
    raw: version,
  };
}

function normalizeCivitaiFile(file: any): AssetFile {
  return {
    id: file.id,
    name: String(file.name ?? "model.safetensors"),
    sizeKb: Number(file.sizeKB ?? file.sizeKb ?? 0),
    downloadUrl: file.downloadUrl ? String(file.downloadUrl) : undefined,
    sha256: file.hashes?.SHA256 ? String(file.hashes.SHA256).toLowerCase() : undefined,
    type: file.type ? String(file.type) : undefined,
    primary: Boolean(file.primary),
  };
}

function toCivitaiType(type?: AssetType): string | undefined {
  const mapping: Partial<Record<AssetType, string>> = {
    lora: "LORA",
    checkpoint: "Checkpoint",
    vae: "VAE",
    controlnet: "Controlnet",
    embedding: "TextualInversion",
    workflow: "Workflows",
  };
  return mapping[type ?? "unknown"];
}

function fromCivitaiType(type: unknown): AssetType {
  const normalized = String(type ?? "").toLowerCase();
  if (normalized.includes("lora")) return "lora";
  if (normalized.includes("checkpoint")) return "checkpoint";
  if (normalized.includes("vae")) return "vae";
  if (normalized.includes("control")) return "controlnet";
  if (normalized.includes("textual") || normalized.includes("embedding")) return "embedding";
  if (normalized.includes("workflow")) return "workflow";
  return "unknown";
}

function toCivitaiSort(sort?: string): string {
  const normalized = String(sort || "").toLowerCase();
  if (normalized.includes("rating")) return "Highest Rated";
  if (normalized.includes("new")) return "Newest";
  return "Most Downloaded";
}

function clampLimit(limit?: number): number {
  const numeric = Number(limit);
  if (!Number.isFinite(numeric)) return 10;
  return Math.max(1, Math.min(100, Math.floor(numeric)));
}
