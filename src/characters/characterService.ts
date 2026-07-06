import type { SqliteDatabase } from "../db/database.js";
import { AuditLog } from "../audit/auditLog.js";
import { AppError, assertNonEmpty } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";
import { StorageService } from "../storage/storageService.js";

export interface Character {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  characterType: string;
  referenceAssetId?: string;
  coverAssetId?: string;
  tags: string[];
  memory: Record<string, unknown>;
  consistencyStatus: string;
  promptSeed: string;
  rightsStatus: string;
  safetyStatus: string;
  visibilityStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface CharacterRow {
  id: string;
  owner_user_id: string;
  name: string;
  description: string;
  character_type: string;
  reference_asset_id: string | null;
  cover_asset_id: string | null;
  tags_json: string;
  memory_json: string;
  consistency_status: string;
  prompt_seed: string;
  rights_status: string;
  safety_status: string;
  visibility_status: string;
  created_at: string;
  updated_at: string;
}

export class CharacterService {
  private readonly audit: AuditLog;

  constructor(
    private readonly db: SqliteDatabase,
    private readonly storage?: StorageService,
  ) {
    this.audit = new AuditLog(db);
  }

  createCharacter(input: {
    ownerUserId: string;
    name: string;
    description?: string;
    characterType?: string;
    referenceAssetId?: string;
    coverAssetId?: string;
    tags?: string[];
    memory?: Record<string, unknown>;
    consistencyStatus?: string;
    promptSeed?: string;
    rightsStatus?: string;
    safetyStatus?: string;
    visibilityStatus?: string;
  }): Character {
    assertNonEmpty(input.name, "CHARACTER_NAME_REQUIRED", "Character name is required.");
    if (input.referenceAssetId && this.storage) {
      this.storage.getAsset(input.referenceAssetId, input.ownerUserId);
    }
    if (input.coverAssetId && this.storage) {
      this.storage.getAsset(input.coverAssetId, input.ownerUserId);
    }

    const timestamp = nowIso();
    const id = createId("character");
    this.db.prepare(`
      INSERT INTO characters (
        id, owner_user_id, name, description, character_type, reference_asset_id,
        cover_asset_id, tags_json, memory_json, consistency_status, prompt_seed,
        rights_status, safety_status, visibility_status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.ownerUserId,
      input.name.trim(),
      input.description ?? "",
      input.characterType ?? "persona",
      input.referenceAssetId ?? null,
      input.coverAssetId ?? null,
      JSON.stringify(input.tags ?? []),
      JSON.stringify(input.memory ?? {}),
      input.consistencyStatus ?? "draft",
      input.promptSeed ?? "",
      input.rightsStatus ?? "owned",
      input.safetyStatus ?? "pending",
      input.visibilityStatus ?? "private",
      timestamp,
      timestamp,
    );

    this.audit.record({
      actorType: "user",
      actorId: input.ownerUserId,
      action: "character.created",
      targetType: "character",
      targetId: id,
      outcome: "success",
      riskClassification: "medium",
    });

    return this.getCharacter(id, input.ownerUserId);
  }

  updateCharacter(id: string, ownerUserId: string, input: {
    name?: string;
    description?: string;
    characterType?: string;
    referenceAssetId?: string | null;
    coverAssetId?: string | null;
    tags?: string[];
    memory?: Record<string, unknown>;
    consistencyStatus?: string;
    promptSeed?: string;
    rightsStatus?: string;
    safetyStatus?: string;
    visibilityStatus?: string;
  }): Character {
    const current = this.getCharacter(id, ownerUserId);
    if (input.name !== undefined) {
      assertNonEmpty(input.name, "CHARACTER_NAME_REQUIRED", "Character name is required.");
    }
    if (input.referenceAssetId && this.storage) {
      this.storage.getAsset(input.referenceAssetId, ownerUserId);
    }
    if (input.coverAssetId && this.storage) {
      this.storage.getAsset(input.coverAssetId, ownerUserId);
    }

    this.db.prepare(`
      UPDATE characters
      SET name = ?, description = ?, character_type = ?, reference_asset_id = ?,
        cover_asset_id = ?, tags_json = ?, memory_json = ?, consistency_status = ?,
        prompt_seed = ?, rights_status = ?, safety_status = ?, visibility_status = ?,
        updated_at = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(
      input.name?.trim() ?? current.name,
      input.description ?? current.description,
      input.characterType ?? current.characterType,
      input.referenceAssetId === undefined ? current.referenceAssetId ?? null : input.referenceAssetId,
      input.coverAssetId === undefined ? current.coverAssetId ?? null : input.coverAssetId,
      JSON.stringify(input.tags ?? current.tags),
      JSON.stringify(input.memory ?? current.memory),
      input.consistencyStatus ?? current.consistencyStatus,
      input.promptSeed ?? current.promptSeed,
      input.rightsStatus ?? current.rightsStatus,
      input.safetyStatus ?? current.safetyStatus,
      input.visibilityStatus ?? current.visibilityStatus,
      nowIso(),
      id,
      ownerUserId,
    );

    this.audit.record({
      actorType: "user",
      actorId: ownerUserId,
      action: "character.updated",
      targetType: "character",
      targetId: id,
      outcome: "success",
      riskClassification: "medium",
    });

    return this.getCharacter(id, ownerUserId);
  }

  getCharacter(id: string, requesterUserId: string): Character {
    const row = this.db.prepare(`
      SELECT *
      FROM characters
      WHERE id = ? AND archived_at IS NULL
    `).get(id) as CharacterRow | undefined;

    if (!row) {
      throw new AppError("CHARACTER_NOT_FOUND", "Character not found.", 404);
    }
    if (row.owner_user_id !== requesterUserId) {
      throw new AppError("CHARACTER_FORBIDDEN", "You do not have access to this character.", 403);
    }
    return mapCharacter(row);
  }

  listCharacters(ownerUserId: string): Character[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM characters
      WHERE owner_user_id = ? AND archived_at IS NULL
      ORDER BY updated_at DESC
    `).all(ownerUserId) as unknown as CharacterRow[];
    return rows.map(mapCharacter);
  }
}

function mapCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    characterType: row.character_type,
    referenceAssetId: row.reference_asset_id ?? undefined,
    coverAssetId: row.cover_asset_id ?? undefined,
    tags: JSON.parse(row.tags_json) as string[],
    memory: JSON.parse(row.memory_json) as Record<string, unknown>,
    consistencyStatus: row.consistency_status,
    promptSeed: row.prompt_seed,
    rightsStatus: row.rights_status,
    safetyStatus: row.safety_status,
    visibilityStatus: row.visibility_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
