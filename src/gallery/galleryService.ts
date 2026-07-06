import { randomBytes } from "node:crypto";
import type { SqliteDatabase } from "../db/database.js";
import { AuditLog } from "../audit/auditLog.js";
import { AppError } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";
import { StorageService, type MediaAsset } from "../storage/storageService.js";

export interface ShareLink {
  id: string;
  ownerUserId: string;
  mediaAssetId: string;
  token: string;
  visibilityStatus: "active" | "revoked";
  createdAt: string;
  revokedAt?: string;
}

interface ShareLinkRow {
  id: string;
  owner_user_id: string;
  media_asset_id: string;
  token: string;
  visibility_status: ShareLink["visibilityStatus"];
  created_at: string;
  revoked_at: string | null;
}

export class GalleryService {
  private readonly audit: AuditLog;

  constructor(
    private readonly db: SqliteDatabase,
    private readonly storage: StorageService,
  ) {
    this.audit = new AuditLog(db);
  }

  listUserGallery(userId: string, filters: {
    projectId?: string;
    characterId?: string;
    assetType?: string;
    sourceType?: string;
    visibilityStatus?: string;
    processingStatus?: string;
    moderationStatus?: string;
    favorite?: boolean;
    query?: string;
    tags?: string[];
  } = {}): MediaAsset[] {
    return this.storage.listAssets(userId, filters);
  }

  approveAsset(assetId: string, userId: string): MediaAsset {
    const asset = this.storage.updateAssetState(assetId, userId, {
      moderationStatus: "approved",
      processingStatus: "ready",
    });

    this.db.prepare("UPDATE images SET moderation_status = 'approved', updated_at = ? WHERE media_asset_id = ? AND owner_user_id = ?")
      .run(nowIso(), assetId, userId);
    this.db.prepare("UPDATE videos SET review_status = 'approved', updated_at = ? WHERE media_asset_id = ? AND owner_user_id = ?")
      .run(nowIso(), assetId, userId);

    this.audit.record({
      actorType: "user",
      actorId: userId,
      action: "gallery.asset_approved",
      targetType: "media_asset",
      targetId: assetId,
      outcome: "success",
      riskClassification: "medium",
    });

    return asset;
  }

  shareAsset(assetId: string, userId: string): ShareLink {
    const asset = this.storage.getAsset(assetId, userId);
    if (asset.moderationStatus !== "approved") {
      throw new AppError("GALLERY_ASSET_NOT_APPROVED", "Only approved assets can be shared.", 409);
    }

    this.storage.updateAssetState(assetId, userId, { visibilityStatus: "public" });
    const id = createId("share");
    const token = randomBytes(18).toString("base64url");
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO share_links (id, owner_user_id, media_asset_id, token, visibility_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, assetId, token, "active", timestamp);

    this.audit.record({
      actorType: "user",
      actorId: userId,
      action: "gallery.asset_shared",
      targetType: "media_asset",
      targetId: assetId,
      outcome: "success",
      riskClassification: "medium",
    });

    return this.getShareLink(token);
  }

  favoriteAsset(assetId: string, userId: string, isFavorite = true): MediaAsset {
    const asset = this.storage.updateAssetState(assetId, userId, { isFavorite });

    this.audit.record({
      actorType: "user",
      actorId: userId,
      action: isFavorite ? "gallery.asset_favorited" : "gallery.asset_unfavorited",
      targetType: "media_asset",
      targetId: assetId,
      outcome: "success",
      riskClassification: "low",
    });

    return asset;
  }

  archiveAsset(assetId: string, userId: string): MediaAsset {
    const asset = this.storage.updateAssetState(assetId, userId, {
      visibilityStatus: "archived",
    });

    this.audit.record({
      actorType: "user",
      actorId: userId,
      action: "gallery.asset_archived",
      targetType: "media_asset",
      targetId: assetId,
      outcome: "success",
      riskClassification: "medium",
    });

    return asset;
  }

  getPublicAsset(token: string): { share: ShareLink; asset: MediaAsset } {
    const share = this.getShareLink(token);
    if (share.visibilityStatus !== "active") {
      throw new AppError("GALLERY_SHARE_REVOKED", "Share link is not active.", 404);
    }
    const asset = this.storage.getAsset(share.mediaAssetId, share.ownerUserId);
    if (asset.visibilityStatus !== "public" || asset.moderationStatus !== "approved") {
      throw new AppError("GALLERY_SHARE_UNAVAILABLE", "Shared asset is not available.", 404);
    }
    return { share, asset };
  }

  private getShareLink(token: string): ShareLink {
    const row = this.db.prepare("SELECT * FROM share_links WHERE token = ?").get(token) as ShareLinkRow | undefined;
    if (!row) {
      throw new AppError("GALLERY_SHARE_NOT_FOUND", "Share link not found.", 404);
    }
    return mapShareLink(row);
  }
}

function mapShareLink(row: ShareLinkRow): ShareLink {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    mediaAssetId: row.media_asset_id,
    token: row.token,
    visibilityStatus: row.visibility_status,
    createdAt: row.created_at,
    revokedAt: row.revoked_at ?? undefined,
  };
}
