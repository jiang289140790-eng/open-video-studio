import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AssetDetail, DownloadResult, LocalAssetRecord } from "./types.js";

export class AiAssetDatabase {
  readonly db: DatabaseSync;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.migrate();
  }

  close(): void {
    this.db.close();
  }

  migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        base_model TEXT,
        version TEXT,
        download_url TEXT,
        storage_path TEXT,
        local_path TEXT,
        trigger_words TEXT NOT NULL DEFAULT '[]',
        tags TEXT NOT NULL DEFAULT '[]',
        nsfw_level TEXT,
        license TEXT,
        sha256 TEXT,
        status TEXT NOT NULL DEFAULT 'downloaded',
        raw_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(provider, provider_id, version, sha256)
      );

      CREATE TABLE IF NOT EXISTS workflow_assets (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        provider_id TEXT,
        name TEXT NOT NULL,
        source_url TEXT,
        local_path TEXT,
        required_models TEXT NOT NULL DEFAULT '[]',
        raw_json TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'installed',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_assets_provider_type ON assets(provider, type);
      CREATE INDEX IF NOT EXISTS idx_assets_base_model ON assets(base_model);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
    `);
  }

  upsertDownloaded(result: DownloadResult, detail?: AssetDetail): LocalAssetRecord {
    const now = new Date().toISOString();
    const existing = this.findByProviderVersionSha(result.provider, result.providerId, result.version, result.sha256);
    const triggerWords = JSON.stringify(detail?.versions.find((version) => version.id === result.version)?.triggerWords ?? []);
    const tags = JSON.stringify(detail?.tags ?? []);
    const raw = JSON.stringify(detail?.raw ?? {});
    if (existing) {
      this.db.prepare(`
        UPDATE assets SET
          name = ?, type = ?, base_model = ?, download_url = ?, storage_path = ?,
          trigger_words = ?, tags = ?, nsfw_level = ?, license = ?, status = ?,
          raw_json = ?, updated_at = ?
        WHERE id = ?
      `).run(
        result.name,
        result.type,
        detail?.baseModel ?? null,
        result.downloadUrl ?? null,
        result.storagePath,
        triggerWords,
        tags,
        detail?.nsfwLevel ?? null,
        detail?.license ?? null,
        "downloaded",
        raw,
        now,
        existing.id,
      );
      return this.getAsset(existing.id)!;
    }

    const id = `asset_${crypto.randomUUID().replaceAll("-", "")}`;
    this.db.prepare(`
      INSERT INTO assets (
        id, provider, provider_id, name, type, base_model, version, download_url,
        storage_path, local_path, trigger_words, tags, nsfw_level, license, sha256,
        status, raw_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      result.provider,
      result.providerId,
      result.name,
      result.type,
      detail?.baseModel ?? null,
      result.version ?? null,
      result.downloadUrl ?? null,
      result.storagePath,
      null,
      triggerWords,
      tags,
      detail?.nsfwLevel ?? null,
      detail?.license ?? null,
      result.sha256,
      "downloaded",
      raw,
      now,
      now,
    );
    return this.getAsset(id)!;
  }

  markInstalledByStoragePath(storagePath: string, localPath: string): LocalAssetRecord | null {
    const existing = this.db.prepare("SELECT id FROM assets WHERE storage_path = ? ORDER BY updated_at DESC LIMIT 1").get(storagePath) as { id: string } | undefined;
    if (!existing) return null;
    this.db.prepare("UPDATE assets SET local_path = ?, status = 'installed', updated_at = ? WHERE id = ?")
      .run(localPath, new Date().toISOString(), existing.id);
    return this.getAsset(existing.id);
  }

  listAssets(filters: { type?: string; baseModel?: string; provider?: string } = {}): LocalAssetRecord[] {
    const rows = this.db.prepare("SELECT * FROM assets ORDER BY updated_at DESC").all() as unknown as LocalAssetRecord[];
    return rows.filter((row) =>
      (!filters.type || row.type === filters.type)
      && (!filters.baseModel || row.base_model === filters.baseModel)
      && (!filters.provider || row.provider === filters.provider)
    );
  }

  removeAsset(assetId: string): LocalAssetRecord | null {
    const asset = this.getAsset(assetId);
    if (!asset) return null;
    this.db.prepare("UPDATE assets SET local_path = NULL, storage_path = NULL, status = 'removed', updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), assetId);
    return this.getAsset(assetId);
  }

  getAsset(id: string): LocalAssetRecord | null {
    return (this.db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as LocalAssetRecord | undefined) ?? null;
  }

  recordLiblibTemplate(input: { templateUuid: string; prompt: string; params: unknown; raw: unknown; taskId?: string }): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO workflow_assets (id, provider, provider_id, name, source_url, local_path, required_models, raw_json, status, created_at, updated_at)
      VALUES (?, 'liblib', ?, ?, NULL, NULL, '[]', ?, 'submitted', ?, ?)
    `).run(
      `workflow_${crypto.randomUUID().replaceAll("-", "")}`,
      input.templateUuid,
      `Liblib template ${input.templateUuid}`,
      JSON.stringify({ prompt: input.prompt, params: input.params, taskId: input.taskId, raw: input.raw }),
      now,
      now,
    );
  }

  private findByProviderVersionSha(provider: string, providerId: string, version: string | undefined, sha256: string): LocalAssetRecord | null {
    return (this.db.prepare(`
      SELECT * FROM assets
      WHERE provider = ? AND provider_id = ? AND COALESCE(version, '') = COALESCE(?, '') AND sha256 = ?
      LIMIT 1
    `).get(provider, providerId, version ?? null, sha256) as LocalAssetRecord | undefined) ?? null;
  }
}
