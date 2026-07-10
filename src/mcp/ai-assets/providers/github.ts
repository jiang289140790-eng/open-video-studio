import type { AssetSearchResult, SearchAssetsInput } from "../types.js";

export class GitHubProvider {
  async search(_input: SearchAssetsInput): Promise<AssetSearchResult[]> {
    return [];
  }

  capability() {
    return {
      provider: "github",
      configured: false,
      supportsSearch: false,
      note: "GitHub provider is reserved for a later version for ComfyUI workflow JSON and custom-node discovery.",
    };
  }
}
