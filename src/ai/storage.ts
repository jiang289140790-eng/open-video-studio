import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { AppError } from "../shared/errors.js";

export type AiStorageProviderName = "local" | "cloudflare_r2" | "s3" | "supabase_storage";

export interface AiStoredObject {
  key: string;
  url?: string;
  sizeBytes: number;
  contentType?: string;
}

export interface AiStorageAdapter {
  readonly name: AiStorageProviderName;
  putObject(input: { key: string; data: Buffer | string; contentType?: string }): Promise<AiStoredObject>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl?(key: string): Promise<string>;
}

export class LocalAiStorageAdapter implements AiStorageAdapter {
  readonly name: AiStorageProviderName = "local";

  constructor(private readonly root: string) {
    mkdirSync(root, { recursive: true });
  }

  async putObject(input: { key: string; data: Buffer | string; contentType?: string }): Promise<AiStoredObject> {
    const path = join(this.root, ...input.key.split("/"));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, input.data);
    return {
      key: input.key,
      sizeBytes: Buffer.byteLength(input.data),
      contentType: input.contentType,
    };
  }

  async getObject(key: string): Promise<Buffer> {
    return readFileSync(join(this.root, ...key.split("/")));
  }

  async deleteObject(): Promise<void> {
    return;
  }

  async getPublicUrl(key: string): Promise<string> {
    return `local://${key}`;
  }
}

export class NotConfiguredAiStorageAdapter implements AiStorageAdapter {
  constructor(readonly name: AiStorageProviderName) {}

  async putObject(): Promise<AiStoredObject> {
    return this.notConfigured();
  }

  async getObject(): Promise<Buffer> {
    return this.notConfigured();
  }

  async deleteObject(): Promise<void> {
    return this.notConfigured();
  }

  private notConfigured(): never {
    throw new AppError("AI_STORAGE_NOT_CONFIGURED", `${this.name} storage is not configured.`);
  }
}
