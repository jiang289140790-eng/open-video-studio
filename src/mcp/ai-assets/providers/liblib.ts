import type { AiAssetConfig } from "../types.js";

export class LiblibProvider {
  constructor(private readonly config: AiAssetConfig, private readonly fetchImpl: typeof fetch = fetch) {}

  capability() {
    return {
      provider: "liblib",
      supportsSearch: false,
      supportsDownload: false,
      supportsTemplateGeneration: true,
      configured: Boolean(this.config.liblibAccessKey && this.config.liblibSecretKey),
      note: "Liblib is configured as a template/workflow generation provider in v1, not a free model-download source.",
    };
  }

  async callTemplate(templateUuid: string, prompt: string, params: Record<string, unknown> = {}) {
    if (!this.config.liblibAccessKey || !this.config.liblibSecretKey) {
      throw new Error("Liblib credentials are missing. Set LIBLIB_ACCESS_KEY and LIBLIB_SECRET_KEY.");
    }
    const path = "/api/generate/webui/text2img";
    const response = await this.fetchImpl(await this.signedUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        templateUuid,
        generateParams: { prompt, ...params },
      }),
    });
    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { text };
    }
    if (!response.ok) throw new Error(`Liblib template call failed: HTTP ${response.status}`);
    const code = data?.code ?? data?.statusCode;
    if (code !== undefined && !["0", "200", 0, 200].includes(code)) {
      throw new Error(data?.msg || data?.message || "Liblib template call failed.");
    }
    return data;
  }

  private async signedUrl(path: string): Promise<string> {
    const timestamp = String(Date.now());
    const nonce = crypto.randomUUID().replaceAll("-", "");
    const signature = await hmacSha1Base64Url(this.config.liblibSecretKey!, [path, timestamp, nonce].join("&"));
    const query = new URLSearchParams({
      AccessKey: this.config.liblibAccessKey!,
      Signature: signature,
      Timestamp: timestamp,
      SignatureNonce: nonce,
    });
    return `${this.config.liblibBaseUrl.replace(/\/$/, "")}${path}?${query.toString()}`;
  }
}

export async function hmacSha1Base64Url(secret: string, content: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(content));
  let binary = "";
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}
