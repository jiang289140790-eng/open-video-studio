import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SqliteDatabase } from "../db/database.js";
import { AuditLog } from "../audit/auditLog.js";
import { AppError } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export interface MediaAsset {
  id: string;
  ownerUserId: string;
  projectId?: string;
  characterId?: string;
  generationJobId?: string;
  assetType: string;
  sourceType: string;
  storageKey: string;
  displayName: string;
  tags: string[];
  metadata: Record<string, unknown>;
  isFavorite: boolean;
  processingStatus: string;
  rightsStatus: string;
  moderationStatus: string;
  visibilityStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface MediaAssetRow {
  id: string;
  owner_user_id: string;
  project_id: string | null;
  character_id: string | null;
  generation_job_id: string | null;
  asset_type: string;
  source_type: string;
  storage_key: string;
  display_name: string;
  tags_json: string;
  metadata_json: string;
  is_favorite: number;
  processing_status: string;
  rights_status: string;
  moderation_status: string;
  visibility_status: string;
  created_at: string;
  updated_at: string;
}

export class StorageService {
  private readonly audit: AuditLog;

  constructor(
    private readonly db: SqliteDatabase,
    private readonly storageRoot: string,
  ) {
    this.audit = new AuditLog(db);
    mkdirSync(storageRoot, { recursive: true });
  }

  saveAsset(input: {
    ownerUserId: string;
    projectId?: string;
    characterId?: string;
    generationJobId?: string;
    assetType: string;
    sourceType: string;
    displayName: string;
    data: Buffer | string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    visibilityStatus?: string;
    processingStatus?: string;
    rightsStatus?: string;
    moderationStatus?: string;
    isFavorite?: boolean;
  }): MediaAsset {
    if (!input.displayName.trim()) {
      throw new AppError("STORAGE_DISPLAY_NAME_REQUIRED", "Display name is required.");
    }

    const id = createId("asset");
    const storageKey = `${input.ownerUserId}/${id}/${sanitizeFileName(input.displayName)}`;
    const path = join(this.storageRoot, ...storageKey.split("/"));
    mkdirSync(join(this.storageRoot, input.ownerUserId, id), { recursive: true });
    writeFileSync(path, input.data);

    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO media_assets (
        id, owner_user_id, project_id, character_id, generation_job_id, asset_type,
        source_type, storage_key, display_name, tags_json, metadata_json, is_favorite,
        processing_status, rights_status, moderation_status, visibility_status,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.ownerUserId,
      input.projectId ?? null,
      input.characterId ?? null,
      input.generationJobId ?? null,
      input.assetType,
      input.sourceType,
      storageKey,
      input.displayName,
      JSON.stringify(input.tags ?? []),
      JSON.stringify(input.metadata ?? {}),
      input.isFavorite ? 1 : 0,
      input.processingStatus ?? "ready",
      input.rightsStatus ?? "unknown",
      input.moderationStatus ?? "pending",
      input.visibilityStatus ?? "private",
      timestamp,
      timestamp,
    );

    this.audit.record({
      actorType: "user",
      actorId: input.ownerUserId,
      action: "storage.asset_created",
      targetType: "media_asset",
      targetId: id,
      outcome: "success",
      riskClassification: "low",
    });

    return this.getAsset(id, input.ownerUserId);
  }

  getAsset(id: string, requesterUserId: string): MediaAsset {
    const row = this.db.prepare(`
      SELECT *
      FROM media_assets
      WHERE id = ? AND deleted_at IS NULL
    `).get(id) as MediaAssetRow | undefined;

    if (!row) {
      throw new AppError("STORAGE_ASSET_NOT_FOUND", "Media asset not found.", 404);
    }
    if (row.owner_user_id !== requesterUserId) {
      throw new AppError("STORAGE_ASSET_FORBIDDEN", "You do not have access to this asset.", 403);
    }
    return mapAsset(row);
  }

  listAssets(ownerUserId: string, filters: {
    projectId?: string;
    characterId?: string;
    generationJobId?: string;
    assetType?: string;
    sourceType?: string;
    visibilityStatus?: string;
    processingStatus?: string;
    moderationStatus?: string;
    favorite?: boolean;
    query?: string;
    tags?: string[];
  } = {}): MediaAsset[] {
    const conditions = ["owner_user_id = ?", "deleted_at IS NULL"];
    const values: Array<string | number> = [ownerUserId];

    if (filters.projectId) {
      conditions.push("project_id = ?");
      values.push(filters.projectId);
    }
    if (filters.characterId) {
      conditions.push("character_id = ?");
      values.push(filters.characterId);
    }
    if (filters.generationJobId) {
      conditions.push("generation_job_id = ?");
      values.push(filters.generationJobId);
    }
    if (filters.assetType) {
      conditions.push("asset_type = ?");
      values.push(filters.assetType);
    }
    if (filters.sourceType) {
      conditions.push("source_type = ?");
      values.push(filters.sourceType);
    }
    if (filters.visibilityStatus) {
      conditions.push("visibility_status = ?");
      values.push(filters.visibilityStatus);
    }
    if (filters.processingStatus) {
      conditions.push("processing_status = ?");
      values.push(filters.processingStatus);
    }
    if (filters.moderationStatus) {
      conditions.push("moderation_status = ?");
      values.push(filters.moderationStatus);
    }
    if (typeof filters.favorite === "boolean") {
      conditions.push("is_favorite = ?");
      values.push(filters.favorite ? 1 : 0);
    }
    if (filters.query?.trim()) {
      conditions.push("(display_name LIKE ? OR metadata_json LIKE ? OR tags_json LIKE ?)");
      const query = `%${filters.query.trim()}%`;
      values.push(query, query, query);
    }
    for (const tag of filters.tags ?? []) {
      conditions.push("tags_json LIKE ?");
      values.push(`%"${tag}"%`);
    }

    const rows = this.db.prepare(`
      SELECT *
      FROM media_assets
      WHERE ${conditions.join(" AND ")}
      ORDER BY updated_at DESC
    `).all(...values) as unknown as MediaAssetRow[];
    return rows.map(mapAsset);
  }

  updateAssetState(id: string, ownerUserId: string, input: {
    processingStatus?: string;
    rightsStatus?: string;
    moderationStatus?: string;
    visibilityStatus?: string;
    tags?: string[];
    isFavorite?: boolean;
  }): MediaAsset {
    const current = this.getAsset(id, ownerUserId);
    const timestamp = nowIso();
    this.db.prepare(`
      UPDATE media_assets
      SET processing_status = ?, rights_status = ?, moderation_status = ?, visibility_status = ?,
        tags_json = ?, is_favorite = ?, updated_at = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(
      input.processingStatus ?? current.processingStatus,
      input.rightsStatus ?? current.rightsStatus,
      input.moderationStatus ?? current.moderationStatus,
      input.visibilityStatus ?? current.visibilityStatus,
      JSON.stringify(input.tags ?? current.tags),
      typeof input.isFavorite === "boolean" ? (input.isFavorite ? 1 : 0) : (current.isFavorite ? 1 : 0),
      timestamp,
      id,
      ownerUserId,
    );

    return this.getAsset(id, ownerUserId);
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function mapAsset(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    projectId: row.project_id ?? undefined,
    characterId: row.character_id ?? undefined,
    generationJobId: row.generation_job_id ?? undefined,
    assetType: row.asset_type,
    sourceType: row.source_type,
    storageKey: row.storage_key,
    displayName: row.display_name,
    tags: JSON.parse(row.tags_json) as string[],
    metadata: JSON.parse(row.metadata_json) as Record<string, unknown>,
    isFavorite: row.is_favorite === 1,
    processingStatus: row.processing_status,
    rightsStatus: row.rights_status,
    moderationStatus: row.moderation_status,
    visibilityStatus: row.visibility_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
