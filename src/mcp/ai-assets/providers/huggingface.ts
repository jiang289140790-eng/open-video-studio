import type { AiAssetConfig, AssetDetail, AssetFile, AssetSearchResult, AssetType, SearchAssetsInput } from "../types.js";

const HF_BASE_URL = "https://huggingface.co";

export class HuggingFaceProvider {
  constructor(private readonly config: AiAssetConfig, private readonly fetchImpl: typeof fetch = fetch) {}

  async search(input: SearchAssetsInput): Promise<AssetSearchResult[]> {
    const params = new URLSearchParams();
    if (input.query) params.set("search", input.query);
    if (input.baseModel) params.append("filter", input.baseModel);
    params.set("limit", String(clampLimit(input.limit)));
    const data = await this.getJson(`${HF_BASE_URL}/api/models?${params.toString()}`);
    const items = Array.isArray(data) ? data : [];
    return items.map((item: any) => ({
      provider: "huggingface",
      providerId: String(item.modelId ?? item.id ?? ""),
      name: String(item.modelId ?? item.id ?? "Untitled Hugging Face model"),
      type: inferTypeFromTags(item.tags ?? []),
      baseModel: inferBaseModel(item.tags ?? []),
      downloadCount: Number(item.downloads ?? 0),
      rating: Number(item.likes ?? 0),
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      raw: item,
    }));
  }

  async detail(repoId: string): Promise<AssetDetail> {
    const data = await this.getJson(`${HF_BASE_URL}/api/models/${repoId.split("/").map(encodeURIComponent).join("/")}`);
    const tags = Array.isArray(data?.tags) ? data.tags.map(String) : [];
    const siblings = Array.isArray(data?.siblings) ? data.siblings : [];
    return {
      provider: "huggingface",
      providerId: String(data?.modelId ?? data?.id ?? repoId),
      name: String(data?.modelId ?? data?.id ?? repoId),
      type: inferTypeFromTags(tags),
      baseModel: inferBaseModel(tags),
      tags,
      license: tags.find((tag: string) => tag.startsWith("license:"))?.replace("license:", ""),
      versions: [{
        id: String(data?.sha ?? "main"),
        name: "main",
        baseModel: inferBaseModel(tags),
        triggerWords: [],
        files: siblings.map((file: any) => normalizeHfFile(repoId, file)),
        raw: data,
      }],
      raw: data,
    };
  }

  private async getJson(url: string): Promise<any> {
    const response = await this.fetchImpl(url, {
      headers: {
        Accept: "application/json",
        ...(this.config.hfToken ? { Authorization: `Bearer ${this.config.hfToken}` } : {}),
      },
    });
    if (!response.ok) throw new Error(`Hugging Face request failed: HTTP ${response.status}`);
    return response.json();
  }
}

function normalizeHfFile(repoId: string, file: any): AssetFile {
  const name = String(file.rfilename ?? file.name ?? "");
  return {
    id: name,
    name,
    downloadUrl: `${HF_BASE_URL}/${repoId}/resolve/main/${name.split("/").map(encodeURIComponent).join("/")}?download=true`,
    sha256: file.lfs?.sha256 ? String(file.lfs.sha256).toLowerCase() : undefined,
    sizeKb: file.size ? Math.round(Number(file.size) / 1024) : undefined,
    primary: /\.(safetensors|ckpt|pt|json)$/i.test(name),
  };
}

function inferTypeFromTags(tags: unknown[]): AssetType {
  const joined = tags.map(String).join(" ").toLowerCase();
  if (joined.includes("lora")) return "lora";
  if (joined.includes("controlnet")) return "controlnet";
  if (joined.includes("vae")) return "vae";
  if (joined.includes("embedding")) return "embedding";
  if (joined.includes("workflow")) return "workflow";
  if (joined.includes("stable-diffusion") || joined.includes("flux")) return "checkpoint";
  return "unknown";
}

function inferBaseModel(tags: unknown[]): string | undefined {
  const joined = tags.map(String).join(" ").toLowerCase();
  if (joined.includes("flux")) return "Flux";
  if (joined.includes("sdxl")) return "SDXL";
  if (joined.includes("stable-diffusion-xl")) return "SDXL";
  if (joined.includes("stable-diffusion")) return "SD";
  if (joined.includes("wan")) return "Wan";
  if (joined.includes("hunyuan")) return "Hunyuan";
  return undefined;
}

function clampLimit(limit?: number): number {
  const numeric = Number(limit);
  if (!Number.isFinite(numeric)) return 10;
  return Math.max(1, Math.min(50, Math.floor(numeric)));
}
